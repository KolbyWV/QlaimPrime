import "dotenv/config";
import assert from "node:assert/strict";

const GRAPHQL_URL = process.env.GRAPHQL_URL || "http://localhost:4000/graphql";
const TEST_EMAIL = process.env.TEST_EMAIL || "worker1@qlaim.dev";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "Password123!";
const ALLOW_CLAIM = process.env.ALLOW_CLAIM === "1";

async function graphql(query, variables = {}, accessToken = null) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    const joined = payload.errors.map((err) => err.message).join("; ");
    throw new Error(joined);
  }

  return payload.data;
}

function logStep(message) {
  console.log(`\n[smoke] ${message}`);
}

async function main() {
  logStep(`Target: ${GRAPHQL_URL}`);

  const loginData = await graphql(
    `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          accessToken
          user {
            id
            email
            profile {
              id
              username
              starsBalance
            }
          }
        }
      }
    `,
    { email: TEST_EMAIL, password: TEST_PASSWORD },
  );

  const accessToken = loginData?.login?.accessToken;
  assert.ok(accessToken, "login.accessToken missing");
  assert.equal(loginData?.login?.user?.email, TEST_EMAIL, "Logged-in user email mismatch");
  assert.ok(loginData?.login?.user?.profile?.id, "Expected user profile");
  logStep("Login + profile check passed");

  const meData = await graphql(
    `
      query Me {
        me {
          id
          email
          profile {
            id
            tier
            starsBalance
          }
        }
      }
    `,
    {},
    accessToken,
  );
  assert.ok(meData?.me?.id, "me.id missing");
  assert.equal(meData?.me?.email, TEST_EMAIL, "me.email mismatch");
  logStep("me query passed");

  const gigsData = await graphql(
    `
      query OpenGigs($status: GigStatus, $limit: Int, $offset: Int) {
        gigs(status: $status, limit: $limit, offset: $offset) {
          id
          title
          status
          company {
            id
            name
          }
        }
      }
    `,
    { status: "OPEN", limit: 40, offset: 0 },
    accessToken,
  );
  const openGigs = gigsData?.gigs || [];
  assert.ok(openGigs.length > 0, "Expected at least one OPEN gig");
  logStep(`OPEN gigs available: ${openGigs.length}`);

  const watchlistBeforeData = await graphql(
    `
      query Watchlist {
        myWatchlist(limit: 100, offset: 0) {
          id
          gigId
        }
      }
    `,
    {},
    accessToken,
  );
  const watchlistBefore = watchlistBeforeData?.myWatchlist || [];
  const watchedGigIds = new Set(watchlistBefore.map((entry) => entry.gigId));

  let candidateGig = openGigs.find((gig) => !watchedGigIds.has(gig.id));
  let removedPreexisting = false;
  if (!candidateGig) {
    candidateGig = openGigs[0];
    await graphql(
      `
        mutation Remove($gigId: String!) {
          removeGigFromWatchlist(gigId: $gigId)
        }
      `,
      { gigId: candidateGig.id },
      accessToken,
    );
    removedPreexisting = true;
  }

  assert.ok(candidateGig?.id, "No gig candidate for watchlist checks");

  await graphql(
    `
      mutation Add($gigId: String!) {
        addGigToWatchlist(gigId: $gigId) {
          id
          gigId
        }
      }
    `,
    { gigId: candidateGig.id },
    accessToken,
  );

  const watchlistAfterAddData = await graphql(
    `
      query Watchlist {
        myWatchlist(limit: 100, offset: 0) {
          gigId
        }
      }
    `,
    {},
    accessToken,
  );
  const watchlistAfterAddIds = new Set((watchlistAfterAddData?.myWatchlist || []).map((entry) => entry.gigId));
  assert.ok(watchlistAfterAddIds.has(candidateGig.id), "Gig was not added to watchlist");

  await graphql(
    `
      mutation Remove($gigId: String!) {
        removeGigFromWatchlist(gigId: $gigId)
      }
    `,
    { gigId: candidateGig.id },
    accessToken,
  );

  const watchlistAfterRemoveData = await graphql(
    `
      query Watchlist {
        myWatchlist(limit: 100, offset: 0) {
          gigId
        }
      }
    `,
    {},
    accessToken,
  );
  const watchlistAfterRemoveIds = new Set(
    (watchlistAfterRemoveData?.myWatchlist || []).map((entry) => entry.gigId),
  );
  assert.ok(!watchlistAfterRemoveIds.has(candidateGig.id), "Gig was not removed from watchlist");

  if (removedPreexisting) {
    await graphql(
      `
        mutation Add($gigId: String!) {
          addGigToWatchlist(gigId: $gigId) {
            id
          }
        }
      `,
      { gigId: candidateGig.id },
      accessToken,
    );
  }
  logStep("Watchlist add/remove checks passed");

  const assignmentsData = await graphql(
    `
      query Assignments {
        myAssignments(limit: 40, offset: 0) {
          id
          status
          gigId
        }
      }
    `,
    {},
    accessToken,
  );
  const activeAssignments = (assignmentsData?.myAssignments || []).filter((assignment) =>
    ["CLAIMED", "ACCEPTED", "STARTED"].includes(assignment.status),
  );
  logStep(`Active assignments: ${activeAssignments.length}`);

  if (ALLOW_CLAIM) {
    if (activeAssignments.length > 0) {
      logStep("Skipping claim mutation because account has active assignment(s)");
    } else {
      const claimCandidate = openGigs[0];
      assert.ok(claimCandidate?.id, "No OPEN gig available to claim");
      const claimData = await graphql(
        `
          mutation Claim($gigId: String!) {
            claimGig(gigId: $gigId) {
              id
              status
              gigId
            }
          }
        `,
        { gigId: claimCandidate.id },
        accessToken,
      );
      assert.ok(claimData?.claimGig?.id, "Claim mutation did not return assignment");
      assert.equal(claimData?.claimGig?.status, "CLAIMED", "Claimed assignment status mismatch");
      logStep(`Claim check passed for gig ${claimCandidate.id}`);
    }
  } else {
    logStep("Claim mutation skipped (set ALLOW_CLAIM=1 to enable)");
  }

  console.log("\n[smoke] PASS");
}

main().catch((error) => {
  console.error("\n[smoke] FAIL");
  console.error(error);
  process.exitCode = 1;
});
