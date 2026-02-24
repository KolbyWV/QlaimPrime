import React from "react";
import { Text, View } from "react-native";
import { useMutation, useQuery } from "@apollo/client/react";

import {
  ADD_GIG_TO_WATCHLIST_MUTATION,
  GIGS_QUERY,
  REMOVE_GIG_FROM_WATCHLIST_MUTATION,
} from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import { Badge, Body, Button, Card, Heading, LoadingState, Screen } from "../../ui/components";

export function WorkerHomeScreen() {
  const { theme } = useAppTheme();
  const { data, loading, refetch, error } = useQuery(GIGS_QUERY, {
    variables: { status: "OPEN", limit: 25, offset: 0 },
  });

  const [addToWatchlist, { loading: adding }] = useMutation(ADD_GIG_TO_WATCHLIST_MUTATION, {
    onCompleted: () => refetch(),
  });
  const [removeFromWatchlist, { loading: removing }] = useMutation(
    REMOVE_GIG_FROM_WATCHLIST_MUTATION,
    {
      onCompleted: () => refetch(),
    },
  );

  const gigs = data?.gigs || [];

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Loading open gigs..." />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Heading>Open gigs</Heading>
      <Body style={{ marginBottom: 14 }}>Available gigs near your location.</Body>

      {error ? <Text style={{ color: theme.colors.danger }}>{error.message}</Text> : null}

      {gigs.length === 0 ? (
        <Card>
          <Body>No gigs are currently open.</Body>
        </Card>
      ) : (
        gigs.map((gig) => (
          <Card key={gig.id}>
            <Badge label={gig.type || "STANDARD"} />
            <Heading style={{ fontSize: 20, marginTop: 10 }}>{gig.title || "Untitled gig"}</Heading>
            <Body>{gig.description || "No description provided."}</Body>
            <View style={{ marginVertical: 10 }}>
              <Body>
                {gig.company?.name || "Unknown company"} · {gig.location?.city || "Unknown city"}
              </Body>
              <Body>
                ${((gig.payCents || 0) / 100).toFixed(2)} · {gig.totalStarsReward || gig.baseStars || 0} stars
              </Body>
            </View>

            <Button
              label="Watch"
              onPress={() => addToWatchlist({ variables: { gigId: gig.id } })}
              loading={adding}
            />
            <Button
              label="Unwatch"
              variant="secondary"
              onPress={() => removeFromWatchlist({ variables: { gigId: gig.id } })}
              loading={removing}
            />
          </Card>
        ))
      )}
    </Screen>
  );
}
