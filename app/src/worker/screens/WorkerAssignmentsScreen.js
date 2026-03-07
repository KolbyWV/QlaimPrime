import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, Text } from "react-native";
import { useMutation, useQuery } from "@apollo/client/react";
import { useFocusEffect } from "@react-navigation/native";

import {
  CLAIM_GIG_MUTATION,
  MY_ASSIGNMENTS_QUERY,
  MY_WATCHLIST_QUERY,
  REMOVE_GIG_FROM_WATCHLIST_MUTATION,
} from "../../graphql/domain";
import { Body, Card, Heading, LoadingState, Screen, SearchInput } from "../../ui/components";
import { WatchlistCard } from "../../ui/domain";
import { useAppTheme } from "../../ui/theme";

function normalizeSearch(value) {
  return value.trim().toLowerCase();
}

function matchesSearch(entry, search) {
  if (!search) {
    return true;
  }

  const gig = entry?.gig || {};
  const combined = [gig.title, gig.description, gig.company?.name, gig.location?.name, gig.location?.city]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return combined.includes(search);
}

export function WorkerAssignmentsScreen({ navigation }) {
  const { theme } = useAppTheme();
  const [search, setSearch] = useState("");
  const [operationError, setOperationError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { data, loading, error, refetch } = useQuery(MY_WATCHLIST_QUERY, {
    variables: { limit: 80, offset: 0 },
  });
  const {
    data: assignmentsData,
    loading: assignmentsLoading,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useQuery(MY_ASSIGNMENTS_QUERY, {
    variables: { limit: 40, offset: 0 },
  });

  const [removeFromWatchlist, { loading: removing }] = useMutation(
    REMOVE_GIG_FROM_WATCHLIST_MUTATION,
    {
      onCompleted: () => {
        setOperationError(null);
        refetch();
      },
      onError: (nextError) => {
        setOperationError(nextError.message || "Failed to remove gig.");
      },
    },
  );
  const [claimGig, { loading: claiming }] = useMutation(CLAIM_GIG_MUTATION, {
    onCompleted: (payload) => {
      setOperationError(null);
      refetch();
      const assignmentId = payload?.claimGig?.id;
      if (!assignmentId) {
        return;
      }
      navigation.navigate("Home", {
        screen: "HomeFeed",
        params: { selectedAssignmentId: assignmentId },
      });
    },
    onError: (nextError) => {
      setOperationError(nextError.message || "Unable to claim gig.");
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchAssignments();
    }, [refetch, refetchAssignments]),
  );
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchAssignments()]);
    } catch (nextError) {
      setOperationError(nextError?.message || "Unable to refresh watchlist.");
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchAssignments]);
  const hasActiveAssignmentLock = (assignmentsData?.myAssignments || []).some((assignment) =>
    ["CLAIMED", "ACCEPTED", "STARTED"].includes(assignment.status),
  );

  const normalizedSearch = normalizeSearch(search);
  const entries = useMemo(
    () => (data?.myWatchlist || []).filter((entry) => matchesSearch(entry, normalizedSearch)),
    [data, normalizedSearch],
  );

  if (loading || assignmentsLoading) {
    return (
      <Screen hideBack>
        <LoadingState label="Loading watchlist..." />
      </Screen>
    );
  }

  return (
    <Screen
      hideBack
      scroll
      contentStyle={{ paddingBottom: 130 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <Heading style={{ fontSize: 32, marginBottom: 12 }}>WATCHLIST</Heading>
      <SearchInput value={search} onChangeText={setSearch} placeholder="Search" />

      {error ? <Text style={{ color: theme.colors.danger }}>{error.message}</Text> : null}
      {assignmentsError ? <Text style={{ color: theme.colors.danger }}>{assignmentsError.message}</Text> : null}
      {operationError ? <Text style={{ color: theme.colors.danger }}>{operationError}</Text> : null}
      {hasActiveAssignmentLock ? (
        <Card>
          <Body>You already have an active assignment. Finish it before claiming another gig.</Body>
        </Card>
      ) : null}

      {entries.map((entry) => (
        <WatchlistCard
          key={entry.id}
          gig={entry.gig}
          onOpen={() =>
            navigation.navigate("Home", {
              screen: "GigDetails",
              params: { gigId: entry.gigId, gig: entry.gig },
            })
          }
          onClaim={() => claimGig({ variables: { gigId: entry.gigId } })}
          onRemove={() => removeFromWatchlist({ variables: { gigId: entry.gigId } })}
          claimLoading={claiming || assignmentsLoading}
          removeLoading={removing}
          claimDisabled={hasActiveAssignmentLock}
        />
      ))}

      {entries.length === 0 ? (
        <Card>
          <Body>No saved gigs in your watchlist yet.</Body>
        </Card>
      ) : null}
    </Screen>
  );
}
