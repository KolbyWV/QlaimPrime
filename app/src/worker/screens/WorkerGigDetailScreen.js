import React, { useEffect, useMemo, useState } from "react";
import { Image, Linking, Platform, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@apollo/client/react";

import {
  ADD_GIG_TO_WATCHLIST_MUTATION,
  CLAIM_GIG_MUTATION,
  GIGS_QUERY,
  MY_ASSIGNMENTS_QUERY,
  MY_WATCHLIST_QUERY,
  REMOVE_GIG_FROM_WATCHLIST_MUTATION,
} from "../../graphql/domain";
import { Body, Button, Card, Heading, LoadingState, Screen } from "../../ui/components";
import { useAppTheme } from "../../ui/theme";

const ACTIVE_ASSIGNMENT_STATUSES = new Set(["CLAIMED", "ACCEPTED", "STARTED"]);

function formatCountdown(endsAt, nowMs) {
  if (!endsAt) return null;
  const endMs = new Date(endsAt).getTime();
  if (!Number.isFinite(endMs)) return null;
  const diffSeconds = Math.max(0, Math.floor((endMs - nowMs) / 1000));
  const hours = String(Math.floor(diffSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((diffSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(diffSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function buildMapPreviewUrl(lat, lng) {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=13&size=900x320&markers=${lat},${lng},red-pushpin`;
}

function buildMapsLink(gig) {
  const lat = gig?.location?.lat;
  const lng = gig?.location?.lng;
  if (typeof lat === "number" && typeof lng === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const query = [
    gig?.location?.name,
    gig?.location?.address,
    gig?.location?.city,
    gig?.location?.state,
    gig?.location?.zipcode,
  ]
    .filter(Boolean)
    .join(", ");

  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function formatDate(dateLike) {
  if (!dateLike) return "N/A";
  const date = new Date(dateLike);
  if (!Number.isFinite(date.getTime())) return "N/A";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function WorkerGigDetailScreen({ route, navigation }) {
  const { theme } = useAppTheme();
  const gigId = route?.params?.gigId;
  const initialGig = route?.params?.gig || null;

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [errorMessage, setErrorMessage] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const { data, loading, refetch } = useQuery(GIGS_QUERY, {
    variables: { status: "OPEN", limit: 80, offset: 0 },
    skip: !gigId,
  });
  const {
    data: watchlistData,
    loading: watchlistLoading,
    refetch: refetchWatchlist,
  } = useQuery(MY_WATCHLIST_QUERY, {
    variables: { limit: 100, offset: 0 },
  });
  const {
    data: assignmentsData,
    loading: assignmentsLoading,
    refetch: refetchAssignments,
  } = useQuery(MY_ASSIGNMENTS_QUERY, {
    variables: { limit: 40, offset: 0 },
  });

  const [addToWatchlist, { loading: addingToWatchlist }] = useMutation(
    ADD_GIG_TO_WATCHLIST_MUTATION,
    {
      onCompleted: async () => {
        setErrorMessage(null);
        await refetchWatchlist();
      },
      onError: (nextError) => {
        setErrorMessage(nextError.message || "Unable to update watchlist.");
      },
    },
  );
  const [removeFromWatchlist, { loading: removingFromWatchlist }] = useMutation(
    REMOVE_GIG_FROM_WATCHLIST_MUTATION,
    {
      onCompleted: async () => {
        setErrorMessage(null);
        await refetchWatchlist();
      },
      onError: (nextError) => {
        setErrorMessage(nextError.message || "Unable to update watchlist.");
      },
    },
  );
  const [claimGig, { loading: claiming }] = useMutation(CLAIM_GIG_MUTATION, {
    onCompleted: async (payload) => {
      setErrorMessage(null);
      await Promise.all([refetch(), refetchAssignments(), refetchWatchlist()]);
      const assignmentId = payload?.claimGig?.id;
      if (!assignmentId) return;
      navigation.navigate("HomeFeed", { selectedAssignmentId: assignmentId });
    },
    onError: (nextError) => {
      setErrorMessage(nextError.message || "Unable to claim gig.");
    },
  });

  const gig = useMemo(() => {
    const fetched = (data?.gigs || []).find((item) => item?.id === gigId);
    return fetched || initialGig;
  }, [data?.gigs, gigId, initialGig]);

  const isWatched = useMemo(() => {
    const entries = watchlistData?.myWatchlist || [];
    return entries.some((entry) => entry?.gigId === gig?.id);
  }, [gig?.id, watchlistData]);

  const hasActiveAssignmentLock = useMemo(
    () =>
      (assignmentsData?.myAssignments || []).some((assignment) =>
        ACTIVE_ASSIGNMENT_STATUSES.has(assignment.status),
      ),
    [assignmentsData],
  );

  const countdown = useMemo(() => formatCountdown(gig?.endsAt, nowMs), [gig?.endsAt, nowMs]);

  const mapLink = useMemo(() => buildMapsLink(gig), [gig]);
  const canShowMapImage =
    typeof gig?.location?.lat === "number" && typeof gig?.location?.lng === "number";

  useEffect(() => {
    if (!gig?.endsAt) return undefined;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [gig?.endsAt]);

  if (!gigId) {
    return (
      <Screen>
        <Card>
          <Body>Missing gig id.</Body>
        </Card>
      </Screen>
    );
  }

  if (loading || watchlistLoading || assignmentsLoading) {
    return (
      <Screen>
        <LoadingState label="Loading gig..." />
      </Screen>
    );
  }

  if (!gig) {
    return (
      <Screen>
        <Card>
          <Body style={{ color: theme.colors.danger }}>
            Gig not found.
          </Body>
        </Card>
      </Screen>
    );
  }

  const claimDisabled =
    claiming || hasActiveAssignmentLock || gig.status !== "OPEN";

  const shortDescription =
    gig.description && gig.description.length > 180
      ? `${gig.description.slice(0, 180).trimEnd()}...`
      : gig.description;

  return (
    <Screen scroll contentStyle={{ paddingBottom: 140 }}>
      <Card style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Heading style={{ marginBottom: 4, fontSize: 30 }}>
              ${((gig.currentPriceCents ?? gig.payCents ?? 0) / 100).toFixed(0)}
            </Heading>
            <Body style={{ marginBottom: 4, color: theme.colors.text }}>
              {gig.company?.name || "Unknown company"}
            </Body>
          </View>
          <Pressable
            hitSlop={10}
            disabled={addingToWatchlist || removingFromWatchlist}
            onPress={() => {
              if (!gig.id) return;
              if (isWatched) {
                removeFromWatchlist({ variables: { gigId: gig.id } });
              } else {
                addToWatchlist({ variables: { gigId: gig.id } });
              }
            }}
          >
            <Ionicons
              name={isWatched ? "heart" : "heart-outline"}
              size={36}
              color={isWatched ? theme.colors.danger : theme.colors.text}
            />
          </Pressable>
        </View>

        <Text style={{ color: theme.colors.text, fontSize: 30, fontWeight: "900", marginBottom: 8 }}>
          {gig.title}
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
          <View style={{ backgroundColor: theme.colors.strongSurface, borderRadius: theme.radii.sm, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 }}>
            <Text style={{ color: theme.colors.strongSurfaceText, fontWeight: "700" }}>{gig.type}</Text>
          </View>
          <View style={{ backgroundColor: theme.colors.accentSoft, borderRadius: theme.radii.sm, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 }}>
            <Text style={{ color: theme.colors.text, fontWeight: "700" }}>Tier: {gig.requiredTier || "COPPER"}</Text>
          </View>
          <View style={{ backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.sm, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 }}>
            <Text style={{ color: theme.colors.text, fontWeight: "700" }}>Stars: {gig.totalStarsReward ?? gig.baseStars ?? 0}</Text>
          </View>
        </View>

        <Body style={{ color: theme.colors.text, marginBottom: 6 }}>
          {showFullDescription ? (gig.description || "No description provided.") : (shortDescription || "No description provided.")}
        </Body>
        {gig.description && gig.description.length > 180 ? (
          <Pressable onPress={() => setShowFullDescription((prev) => !prev)}>
            <Text style={{ color: theme.colors.primary, fontWeight: "700", marginBottom: 10 }}>
              {showFullDescription ? "Show less" : "See more"}
            </Text>
          </Pressable>
        ) : null}

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <Body style={{ marginBottom: 0 }}>Starts: {formatDate(gig.startsAt)}</Body>
          <Body style={{ marginBottom: 0 }}>Ends: {formatDate(gig.endsAt)}</Body>
        </View>
      </Card>

      <Card>
        <Heading style={{ fontSize: 19 }}>Location</Heading>
        <Body style={{ color: theme.colors.text, marginBottom: 4 }}>
          {gig.location?.name || "Location TBD"}
        </Body>
        <Body style={{ marginBottom: 10 }}>
          {[gig.location?.address, gig.location?.city, gig.location?.state, gig.location?.zipcode]
            .filter(Boolean)
            .join(", ") || "Address not available"}
        </Body>

        {canShowMapImage ? (
          <Image
            source={{ uri: buildMapPreviewUrl(gig.location.lat, gig.location.lng) }}
            style={{
              width: "100%",
              height: Platform.OS === "web" ? 220 : 180,
              borderRadius: theme.radii.md,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.md,
              height: 120,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
              backgroundColor: theme.colors.surfaceAlt,
            }}
          >
            <Body style={{ marginBottom: 0 }}>Map preview unavailable for this location.</Body>
          </View>
        )}

        <Button
          label="Open in maps"
          variant="secondary"
          disabled={!mapLink}
          onPress={async () => {
            if (!mapLink) return;
            try {
              await Linking.openURL(mapLink);
            } catch (nextError) {
              setErrorMessage(nextError.message || "Unable to open map.");
            }
          }}
        />
      </Card>

      {errorMessage ? (
        <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>{errorMessage}</Text>
      ) : null}

      {hasActiveAssignmentLock ? (
        <Card>
          <Body style={{ marginBottom: 0 }}>
            You already have an active assignment. Complete it before claiming another gig.
          </Body>
        </Card>
      ) : null}

      <Card style={{ marginBottom: 0 }}>
        {countdown ? (
          <View
            style={{
              backgroundColor: theme.colors.strongSurface,
              borderRadius: theme.radii.sm,
              paddingVertical: 10,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: theme.colors.strongSurfaceText, fontSize: 30, fontWeight: "800", textAlign: "center" }}>
              {countdown}
            </Text>
          </View>
        ) : null}
        <Button
          label="Claim Gig"
          loading={claiming}
          disabled={claimDisabled}
          onPress={() => {
            setErrorMessage(null);
            claimGig({ variables: { gigId: gig.id } });
          }}
          style={{ marginBottom: 0 }}
        />
        {gig.status !== "OPEN" ? (
          <Body style={{ marginTop: 8, marginBottom: 0 }}>
            This gig is currently {gig.status.toLowerCase()}.
          </Body>
        ) : null}
      </Card>
    </Screen>
  );
}
