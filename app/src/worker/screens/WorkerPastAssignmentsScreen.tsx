import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, Text } from "react-native";
import { useQuery } from "@apollo/client/react";

import { ASSIGNMENT_HISTORY_QUERY } from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import { Body, Card, Heading, LoadingState, Screen } from "../../ui/components";

const PAST_ASSIGNMENT_STATUSES = new Set(["SUBMITTED", "REVIEWED", "COMPLETED", "CANCELLED", "DECLINED"]);

export function WorkerPastAssignmentsScreen() {
  const { theme } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const { data, loading, error, refetch } = useQuery(ASSIGNMENT_HISTORY_QUERY, {
    variables: { limit: 80, offset: 0 },
  });
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setRefreshError(null);
      await refetch();
    } catch (nextError) {
      setRefreshError(nextError?.message || "Unable to refresh assignments.");
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const pastAssignments = useMemo(
    () =>
      (data?.assignmentHistory || []).filter((assignment) =>
        PAST_ASSIGNMENT_STATUSES.has(assignment.status),
      ),
    [data],
  );

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Loading gig history..." />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <Heading>Gig History</Heading>
      <Body style={{ marginBottom: 12 }}>
        Submitted, completed, or closed gigs from `assignmentHistory`.
      </Body>
      {error ? <Text style={{ color: theme.colors.danger }}>{error.message}</Text> : null}
      {refreshError ? <Text style={{ color: theme.colors.danger }}>{refreshError}</Text> : null}

      {pastAssignments.map((assignment) => (
        <Card key={assignment.id}>
          <Heading style={{ fontSize: 19 }}>{assignment.gig?.title || "Untitled gig"}</Heading>
          <Body>Status: {assignment.status || "Unknown"}</Body>
          <Body>Claimed: {assignment.claimedAt || "-"}</Body>
          <Body>Completed: {assignment.completedAt || "-"}</Body>
        </Card>
      ))}

      {pastAssignments.length === 0 ? (
        <Card>
          <Body>No gig history yet.</Body>
        </Card>
      ) : null}
    </Screen>
  );
}
