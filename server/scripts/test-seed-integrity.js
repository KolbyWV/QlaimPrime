import "dotenv/config";
import { prisma } from "../src/prisma.js";

const minimums = {
  user: 8,
  profile: 8,
  refreshToken: 4,
  passwordResetToken: 4,
  company: 4,
  location: 4,
  member: 12,
  companyMembershipRequest: 4,
  gig: 18,
  watchlist: 10,
  gigAssignment: 4,
  product: 4,
  purchase: 4,
  gigReview: 4,
  starsTransaction: 4,
  moneyTransaction: 4,
};

async function main() {
  const counts = {
    user: await prisma.user.count(),
    profile: await prisma.profile.count(),
    refreshToken: await prisma.refreshToken.count(),
    passwordResetToken: await prisma.passwordResetToken.count(),
    company: await prisma.company.count(),
    location: await prisma.location.count(),
    member: await prisma.member.count(),
    companyMembershipRequest: await prisma.companyMembershipRequest.count(),
    gig: await prisma.gig.count(),
    watchlist: await prisma.watchlist.count(),
    gigAssignment: await prisma.gigAssignment.count(),
    product: await prisma.product.count(),
    purchase: await prisma.purchase.count(),
    gigReview: await prisma.gigReview.count(),
    starsTransaction: await prisma.starsTransaction.count(),
    moneyTransaction: await prisma.moneyTransaction.count(),
  };

  const failures = [];

  console.log("[seed-integrity] table counts");
  for (const [table, count] of Object.entries(counts)) {
    const min = minimums[table];
    const ok = count >= min;
    console.log(`- ${table}: ${count} (min ${min}) ${ok ? "OK" : "FAIL"}`);
    if (!ok) {
      failures.push({ table, count, min });
    }
  }

  if (failures.length > 0) {
    const detail = failures.map((row) => `${row.table}=${row.count} < ${row.min}`).join(", ");
    throw new Error(`Seed integrity check failed: ${detail}`);
  }

  console.log("[seed-integrity] PASS");
}

main()
  .catch((error) => {
    console.error("[seed-integrity] FAIL");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
