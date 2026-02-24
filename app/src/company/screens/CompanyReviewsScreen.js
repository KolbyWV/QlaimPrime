import React, { useMemo, useState } from "react";
import { Text } from "react-native";
import { useMutation, useQuery } from "@apollo/client/react";

import {
  CREATE_GIG_REVIEW_MUTATION,
  GIG_ASSIGNMENTS_QUERY,
  GIGS_QUERY,
  MY_COMPANIES_QUERY,
} from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import { Body, Button, Card, Field, Heading, LoadingState, Screen } from "../../ui/components";

export function CompanyReviewsScreen() {
  const { theme } = useAppTheme();
  const [commentByAssignment, setCommentByAssignment] = useState({});

  const companyQuery = useQuery(MY_COMPANIES_QUERY);
  const companyId = companyQuery.data?.myCompanies?.[0]?.id;

  const gigsQuery = useQuery(GIGS_QUERY, {
    variables: { companyId, limit: 10, offset: 0 },
    skip: !companyId,
  });

  const firstGigId = gigsQuery.data?.gigs?.[0]?.id;

  const assignmentsQuery = useQuery(GIG_ASSIGNMENTS_QUERY, {
    variables: { gigId: firstGigId, limit: 15, offset: 0 },
    skip: !firstGigId,
  });

  const reviewableAssignments = useMemo(
    () => (assignmentsQuery.data?.gigAssignments || []).filter((item) => !item.review),
    [assignmentsQuery.data],
  );

  const [createReview, { loading: reviewing }] = useMutation(CREATE_GIG_REVIEW_MUTATION, {
    onCompleted: () => assignmentsQuery.refetch(),
  });

  if (companyQuery.loading || gigsQuery.loading || assignmentsQuery.loading) {
    return (
      <Screen>
        <LoadingState label="Loading review queue..." />
      </Screen>
    );
  }

  const globalError = companyQuery.error || gigsQuery.error || assignmentsQuery.error;

  return (
    <Screen scroll>
      <Heading>Review queue</Heading>
      <Body style={{ marginBottom: 12 }}>
        Reviewing assignments for {gigsQuery.data?.gigs?.[0]?.title || "your latest gig"}.
      </Body>

      {globalError ? <Text style={{ color: theme.colors.danger }}>{globalError.message}</Text> : null}

      {reviewableAssignments.map((assignment) => (
        <Card key={assignment.id}>
          <Heading style={{ fontSize: 19 }}>{assignment.user?.email || assignment.userId}</Heading>
          <Body>Status: {assignment.status}</Body>
          <Field
            label="Review comment"
            value={commentByAssignment[assignment.id] || ""}
            onChangeText={(value) =>
              setCommentByAssignment((prev) => ({
                ...prev,
                [assignment.id]: value,
              }))
            }
            placeholder="Optional comment"
          />
          <Button
            label="Approve (5 stars)"
            loading={reviewing}
            onPress={() =>
              createReview({
                variables: {
                  assignmentId: assignment.id,
                  starsRating: 5,
                  decision: "APPROVED",
                  comment: commentByAssignment[assignment.id] || null,
                },
              })
            }
          />
          <Button
            label="Reject (1 star)"
            variant="secondary"
            loading={reviewing}
            onPress={() =>
              createReview({
                variables: {
                  assignmentId: assignment.id,
                  starsRating: 1,
                  decision: "REJECTED",
                  comment: commentByAssignment[assignment.id] || null,
                },
              })
            }
          />
        </Card>
      ))}

      {!reviewableAssignments.length ? (
        <Card>
          <Body>No assignments are waiting for review.</Body>
        </Card>
      ) : null}
    </Screen>
  );
}
