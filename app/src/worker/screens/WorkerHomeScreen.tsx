import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery } from "@apollo/client/react";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

import { useSession } from "../../auth/session";
import {
  ADD_GIG_TO_WATCHLIST_MUTATION,
  GIGS_QUERY,
  MY_ASSIGNMENTS_QUERY,
  MY_WATCHLIST_QUERY,
  REMOVE_GIG_FROM_WATCHLIST_MUTATION,
  UPDATE_ASSIGNMENT_STATUS_MUTATION,
} from "../../graphql/domain";
import { Body, Button, Card, Heading, LoadingState, Screen, SearchInput, SectionTitle } from "../../ui/components";
import { GigCard } from "../../ui/domain";
import { useAppTheme } from "../../ui/theme";

const ACTIVE_ASSIGNMENT_STATUSES = new Set(["CLAIMED", "ACCEPTED", "STARTED"]);
const TIER_MAX_DOLLARS = {
  COPPER: 50,
  BRONZE: 100,
  SILVER: 200,
  GOLD: 350,
  PLATINUM: 500,
  DIAMOND: Number.POSITIVE_INFINITY,
};
const QUICK_GIG_MAX_CENTS = 5000;

function getGigPayCents(gig) {
  return gig?.currentPriceCents ?? gig?.payCents ?? 0;
}

function getGigBasePayCents(gig) {
  return gig?.payCents ?? 0;
}

function getGigWatchlistCount(gig) {
  if (Number.isFinite(gig?.watchlistCount)) {
    return gig.watchlistCount;
  }
  if (Array.isArray(gig?.watchlistEntries)) {
    return gig.watchlistEntries.length;
  }
  return 0;
}

function getAssignmentAction(status) {
  if (status === "CLAIMED" || status === "ACCEPTED") {
    return { label: "Start assignment", nextStatus: "STARTED" };
  }
  if (status === "STARTED") {
    return { label: "Submit for review", nextStatus: "SUBMITTED" };
  }
  return null;
}

function normalizeSearch(value) {
  return value.trim().toLowerCase();
}

function matchesSearch(gig, search) {
  if (!search) {
    return true;
  }

  const combined = [
    gig?.title,
    gig?.description,
    gig?.company?.name,
    gig?.location?.name,
    gig?.location?.city,
    gig?.location?.state,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return combined.includes(search);
}

export function WorkerHomeScreen({ route, navigation }) {
  const { theme } = useAppTheme();
  const { me } = useSession();
  const [search, setSearch] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [operationError, setOperationError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [startProofPhotos, setStartProofPhotos] = useState([null, null]);
  const [submitProofPhotos, setSubmitProofPhotos] = useState([null, null]);

  const { data, loading, refetch, error } = useQuery(GIGS_QUERY, {
    variables: { status: "OPEN", limit: 40, offset: 0 },
  });
  const {
    data: assignmentsData,
    loading: assignmentsLoading,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useQuery(MY_ASSIGNMENTS_QUERY, {
    variables: { limit: 40, offset: 0 },
  });
  const {
    data: watchlistData,
    loading: watchlistLoading,
    error: watchlistError,
    refetch: refetchWatchlist,
  } = useQuery(MY_WATCHLIST_QUERY, {
    variables: { limit: 100, offset: 0 },
  });

  const [addToWatchlist, { loading: adding }] = useMutation(ADD_GIG_TO_WATCHLIST_MUTATION, {
    onCompleted: async () => {
      setOperationError(null);
      await Promise.all([refetch(), refetchWatchlist()]);
    },
    onError: (nextError) => {
      setOperationError(nextError.message || "Unable to add gig to watchlist.");
    },
  });
  const [removeFromWatchlist, { loading: removing }] = useMutation(
    REMOVE_GIG_FROM_WATCHLIST_MUTATION,
    {
      onCompleted: async () => {
        setOperationError(null);
        await Promise.all([refetch(), refetchWatchlist()]);
      },
      onError: (nextError) => {
        setOperationError(nextError.message || "Unable to remove gig from watchlist.");
      },
    },
  );
  const [updateAssignmentStatus, { loading: updatingAssignment }] = useMutation(
    UPDATE_ASSIGNMENT_STATUS_MUTATION,
    {
      onCompleted: async () => {
        setOperationError(null);
        await refetchAssignments();
      },
      onError: (nextError) => {
        setOperationError(nextError.message || "Unable to update assignment.");
      },
    },
  );

  const watchlistByGigId = useMemo(() => {
    const map = new Set();
    (watchlistData?.myWatchlist || []).forEach((entry) => {
      if (entry?.gigId) {
        map.add(entry.gigId);
      }
    });
    return map;
  }, [watchlistData]);

  const activeAssignments = useMemo(
    () =>
      (assignmentsData?.myAssignments || []).filter((assignment) =>
        ACTIVE_ASSIGNMENT_STATUSES.has(assignment.status),
      ),
    [assignmentsData],
  );
  const selectedAssignment = activeAssignments.find((assignment) => assignment.id === selectedAssignmentId);
  const hasActiveAssignmentLock = activeAssignments.length > 0;

  const normalizedSearch = normalizeSearch(search);
  const gigs = useMemo(
    () => (data?.gigs || []).filter((gig) => matchesSearch(gig, normalizedSearch)),
    [data, normalizedSearch],
  );
  const userTier = me?.profile?.tier || "COPPER";
  const tierMaxDollars = TIER_MAX_DOLLARS[userTier] ?? TIER_MAX_DOLLARS.COPPER;
  const tierMaxCents = Number.isFinite(tierMaxDollars)
    ? Math.floor(tierMaxDollars * 100)
    : Number.POSITIVE_INFINITY;

  const gigsThatEarn = useMemo(() => {
    const byHighestPay = (a, b) => getGigPayCents(b) - getGigPayCents(a);

    if (!Number.isFinite(tierMaxCents)) {
      return [...gigs].sort(byHighestPay).slice(0, 8);
    }

    const eligible = gigs.filter((gig) => getGigPayCents(gig) <= tierMaxCents);
    const nearCeilingThreshold = Math.floor(tierMaxCents * 0.8);
    const nearCeiling = eligible.filter((gig) => getGigPayCents(gig) >= nearCeilingThreshold);
    const source = nearCeiling.length > 0 ? nearCeiling : eligible;
    return [...source].sort(byHighestPay).slice(0, 8);
  }, [gigs, tierMaxCents]);
  const popularGigs = useMemo(
    () =>
      [...gigs]
        .filter((gig) => getGigWatchlistCount(gig) > 2)
        .sort((a, b) => {
          const countDiff = getGigWatchlistCount(b) - getGigWatchlistCount(a);
          if (countDiff !== 0) return countDiff;
          return getGigPayCents(b) - getGigPayCents(a);
        })
        .slice(0, 20),
    [gigs],
  );
  const quickGigs = useMemo(
    () =>
      [...gigs]
        .filter((gig) => getGigBasePayCents(gig) < QUICK_GIG_MAX_CENTS)
        .sort((a, b) => (new Date(a?.endsAt || 0).getTime() || 0) - (new Date(b?.endsAt || 0).getTime() || 0))
        .slice(0, 20),
    [gigs],
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchAssignments();
      refetchWatchlist();
    }, [refetch, refetchAssignments, refetchWatchlist]),
  );

  useEffect(() => {
    const nextId = route?.params?.selectedAssignmentId;
    if (!nextId) {
      return;
    }
    setSelectedAssignmentId(nextId);
    navigation.setParams({ selectedAssignmentId: undefined });
  }, [navigation, route?.params?.selectedAssignmentId]);

  useEffect(() => {
    if (activeAssignments.length === 0) {
      if (selectedAssignmentId) {
        setSelectedAssignmentId(null);
      }
      return;
    }

    if (
      selectedAssignmentId &&
      activeAssignments.some((assignment) => assignment.id === selectedAssignmentId)
    ) {
      return;
    }

    if (activeAssignments.length === 1) {
      setSelectedAssignmentId(activeAssignments[0].id);
    }
  }, [activeAssignments, selectedAssignmentId]);
  useEffect(() => {
    setStartProofPhotos([null, null]);
    setSubmitProofPhotos([null, null]);
  }, [selectedAssignment?.id]);

  const onToggleWatch = useCallback(
    (gigId) => {
      if (!gigId) {
        return;
      }
      if (watchlistByGigId.has(gigId)) {
        removeFromWatchlist({ variables: { gigId } });
      } else {
        addToWatchlist({ variables: { gigId } });
      }
    },
    [addToWatchlist, removeFromWatchlist, watchlistByGigId],
  );
  const openGigDetails = useCallback(
    (gig) => {
      if (!gig?.id) return;
      navigation.navigate("GigDetails", { gigId: gig.id, gig });
    },
    [navigation],
  );
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchAssignments(), refetchWatchlist()]);
    } catch (nextError) {
      setOperationError(nextError?.message || "Unable to refresh home feed.");
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchAssignments, refetchWatchlist]);
  const captureProofPhoto = useCallback(async (kind, index, source = "camera") => {
    setOperationError(null);
    try {
      let result;
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setOperationError("Camera permission is required to capture proof photos.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: false,
          mediaTypes: "images",
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setOperationError("Photo library permission is required to select photos.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.7,
          allowsEditing: false,
          mediaTypes: "images",
        });
      }

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      const uri = result.assets[0].uri;
      if (kind === "start") {
        setStartProofPhotos((prev) => {
          const next = [...prev];
          next[index] = uri;
          return next;
        });
        return;
      }
      setSubmitProofPhotos((prev) => {
        const next = [...prev];
        next[index] = uri;
        return next;
      });
    } catch (nextError) {
      setOperationError(nextError?.message || "Unable to capture photo right now.");
    }
  }, []);

  if (loading || assignmentsLoading || watchlistLoading) {
    return (
      <Screen>
        <LoadingState label="Loading home..." />
      </Screen>
    );
  }

  if (selectedAssignment) {
    const action = getAssignmentAction(selectedAssignment.status);
    return (
      <Screen
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
        <Heading style={{ marginTop: 2 }}>Active Gig</Heading>
        <Body style={{ marginBottom: 12 }}>
          {selectedAssignment.gig?.title || "Untitled gig"} · {selectedAssignment.status}
        </Body>

        {operationError ? <Text style={{ color: theme.colors.danger }}>{operationError}</Text> : null}
        {assignmentsError ? <Text style={{ color: theme.colors.danger }}>{assignmentsError.message}</Text> : null}

        <GigCard
          gig={selectedAssignment.gig}
          watched={watchlistByGigId.has(selectedAssignment.gigId)}
          timerMode={selectedAssignment.status === "STARTED" ? "elapsed" : "none"}
          timerStartedAt={
            selectedAssignment.claimedAt ||
            selectedAssignment.assignedAt ||
            selectedAssignment.startedAt
          }
          width={null}
        />

        <Card>
          <Body style={{ marginBottom: 10 }}>
            Claimed: {selectedAssignment.claimedAt || "-"}{"\n"}
            Status: {selectedAssignment.status}
          </Body>

          {action ? (
            <>
              {action.nextStatus === "STARTED" ? (
                <Card>
                  <Body style={{ marginBottom: 8 }}>Required: 2 start photos before work begins.</Body>
                  {[0, 1].map((i) => (
                    <View key={i} style={{ marginBottom: 8 }}>
                      <Body style={{ marginBottom: 4, fontWeight: "700" }}>
                        Photo {i + 1}{startProofPhotos[i] ? " ✓" : ""}
                      </Body>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <Button
                          label="Camera"
                          variant="secondary"
                          onPress={() => captureProofPhoto("start", i, "camera")}
                          style={{ flex: 1 }}
                        />
                        <Button
                          label="Library"
                          variant="secondary"
                          onPress={() => captureProofPhoto("start", i, "library")}
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                  ))}
                  <Body style={{ marginBottom: 0 }}>
                    Captured: {startProofPhotos.filter(Boolean).length}/2
                  </Body>
                </Card>
              ) : null}
              {action.nextStatus === "SUBMITTED" ? (
                <Card>
                  <Body style={{ marginBottom: 8 }}>Required: 2 submission photos for review.</Body>
                  {[0, 1].map((i) => (
                    <View key={i} style={{ marginBottom: 8 }}>
                      <Body style={{ marginBottom: 4, fontWeight: "700" }}>
                        Photo {i + 1}{submitProofPhotos[i] ? " ✓" : ""}
                      </Body>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <Button
                          label="Camera"
                          variant="secondary"
                          onPress={() => captureProofPhoto("submit", i, "camera")}
                          style={{ flex: 1 }}
                        />
                        <Button
                          label="Library"
                          variant="secondary"
                          onPress={() => captureProofPhoto("submit", i, "library")}
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                  ))}
                  <Body style={{ marginBottom: 0 }}>
                    Captured: {submitProofPhotos.filter(Boolean).length}/2
                  </Body>
                </Card>
              ) : null}
              <Button
                label={action.label}
                loading={updatingAssignment}
                onPress={async () => {
                  try {
                    const variables = {
                      assignmentId: selectedAssignment.id,
                      status: action.nextStatus,
                    };
                    if (action.nextStatus === "STARTED") {
                      if (startProofPhotos.filter(Boolean).length !== 2) {
                        setOperationError("Please capture 2 start photos before starting.");
                        return;
                      }
                      variables.startImageUrls = startProofPhotos;
                    }
                    if (action.nextStatus === "SUBMITTED") {
                      if (submitProofPhotos.filter(Boolean).length !== 2) {
                        setOperationError("Please capture 2 submission photos before submitting.");
                        return;
                      }
                      variables.endImageUrls = submitProofPhotos;
                    }

                    await updateAssignmentStatus({ variables });

                    if (action.nextStatus === "SUBMITTED") {
                      setSelectedAssignmentId(null);
                    }
                  } catch {
                    // handled by mutation onError
                  }
                }}
              />
            </>
          ) : (
            <Body style={{ marginBottom: 10 }}>
              {selectedAssignment.status === "SUBMITTED" || selectedAssignment.status === "REVIEWED"
                ? "Waiting for company review."
                : "No further action available right now."}
            </Body>
          )}
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
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
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ color: theme.colors.text, fontSize: 30, fontWeight: "900", letterSpacing: 1.5 }}>QLAIM</Text>
      </View>

      <SearchInput value={search} onChangeText={setSearch} placeholder="Search" />

      {operationError ? <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>{operationError}</Text> : null}
      {error ? <Text style={{ color: theme.colors.danger }}>{error.message}</Text> : null}
      {assignmentsError ? <Text style={{ color: theme.colors.danger }}>{assignmentsError.message}</Text> : null}
      {watchlistError ? <Text style={{ color: theme.colors.danger }}>{watchlistError.message}</Text> : null}

      {hasActiveAssignmentLock ? (
        <Card>
          <SectionTitle style={{ marginBottom: 8, marginTop: 0 }}>Active Gig</SectionTitle>
          {activeAssignments.map((assignment) => (
            <View key={assignment.id} style={{ marginBottom: 8 }}>
              <Body>
                {assignment.gig?.title || "Untitled gig"} · {assignment.status}
              </Body>
              <Button label="Open assignment" variant="secondary" onPress={() => setSelectedAssignmentId(assignment.id)} />
            </View>
          ))}
          <Body style={{ marginBottom: 0 }}>
            Finish your active assignment before browsing or claiming more gigs.
          </Body>
        </Card>
      ) : null}

      {!hasActiveAssignmentLock ? (
        <>
          <SectionTitle>Gigs that earn</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {gigsThatEarn.map((gig) => (
              <GigCard
                key={gig.id}
                gig={gig}
                watched={watchlistByGigId.has(gig.id)}
                onToggleWatch={() => onToggleWatch(gig.id)}
                onPress={() => openGigDetails(gig)}
              />
            ))}
          </ScrollView>
          {gigsThatEarn.length === 0 ? (
            <Card>
              <Body>No gigs near your tier ceiling right now.</Body>
            </Card>
          ) : null}

          <SectionTitle>Popular gigs</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {popularGigs.map((gig) => (
              <GigCard
                key={gig.id}
                gig={gig}
                watched={watchlistByGigId.has(gig.id)}
                onToggleWatch={() => onToggleWatch(gig.id)}
                onPress={() => openGigDetails(gig)}
              />
            ))}
          </ScrollView>
          {popularGigs.length === 0 ? (
            <Card>
              <Body>No gigs are on more than two watchlists yet.</Body>
            </Card>
          ) : null}

          <SectionTitle>Quick gigs</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {quickGigs.map((gig) => (
              <GigCard
                key={gig.id}
                gig={gig}
                watched={watchlistByGigId.has(gig.id)}
                onToggleWatch={() => onToggleWatch(gig.id)}
                showCountdown
                onPress={() => openGigDetails(gig)}
              />
            ))}
          </ScrollView>
          {quickGigs.length === 0 ? (
            <Card>
              <Body>No quick gigs under $50 right now.</Body>
            </Card>
          ) : null}

          {gigs.length === 0 ? (
            <Card>
              <Body>No gigs matched your search.</Body>
            </Card>
          ) : null}
        </>
      ) : null}

      {(adding || removing) ? (
        <Body style={{ marginTop: 4 }}>Updating watchlist...</Body>
      ) : null}
    </Screen>
  );
}
