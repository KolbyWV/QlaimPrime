import React from "react";
import { Text } from "react-native";
import { useQuery } from "@apollo/client/react";

import { MY_ASSIGNMENTS_QUERY } from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import { Body, Card, Heading, LoadingState, Screen } from "../../ui/components";

export function WorkerAssignmentsScreen() {
  const { theme } = useAppTheme();
  const { data, loading, error } = useQuery(MY_ASSIGNMENTS_QUERY, {
    variables: { limit: 40, offset: 0 },
  });

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Loading assignments..." />
      </Screen>
    );
  }

  const assignments = data?.myAssignments || [];

  return (
    <Screen scroll>
      <Heading>My assignments</Heading>
      <Body style={{ marginBottom: 12 }}>Status from `myAssignments`.</Body>
      {error ? <Text style={{ color: theme.colors.danger }}>{error.message}</Text> : null}

      {assignments.map((assignment) => (
        <Card key={assignment.id}>
          <Heading style={{ fontSize: 19 }}>{assignment.gig?.title || "Untitled gig"}</Heading>
          <Body>Status: {assignment.status || "Unknown"}</Body>
          <Body>Claimed: {assignment.claimedAt || "-"}</Body>
          <Body>Completed: {assignment.completedAt || "-"}</Body>
        </Card>
      ))}

      {assignments.length === 0 ? (
        <Card>
          <Body>You have not claimed any gigs yet.</Body>
        </Card>
      ) : null}
    </Screen>
  );
}
