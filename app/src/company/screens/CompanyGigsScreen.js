import React, { useCallback } from "react";
import { Text } from "react-native";
import { useMutation, useQuery } from "@apollo/client/react";
import { useFocusEffect } from "@react-navigation/native";

import {
  GIGS_QUERY,
  MY_COMPANIES_QUERY,
  UPDATE_GIG_STATUS_MUTATION,
} from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import {
  Body,
  Button,
  Card,
  Heading,
  LoadingState,
  Screen,
} from "../../ui/components";

export function CompanyGigsScreen() {
  const { theme } = useAppTheme();
  const companyQuery = useQuery(MY_COMPANIES_QUERY);

  const activeCompanyId = companyQuery.data?.myCompanies?.[0]?.id;

  const gigsQuery = useQuery(GIGS_QUERY, {
    variables: { companyId: activeCompanyId, limit: 30, offset: 0 },
    skip: !activeCompanyId,
  });
  const refetchGigs = gigsQuery.refetch;

  const [updateGigStatus, { loading: updating }] = useMutation(UPDATE_GIG_STATUS_MUTATION, {
    onCompleted: () => refetchGigs(),
  });

  useFocusEffect(
    useCallback(() => {
      if (activeCompanyId) {
        refetchGigs();
      }
    }, [activeCompanyId, refetchGigs]),
  );

  if (companyQuery.loading || gigsQuery.loading) {
    return (
      <Screen>
        <LoadingState label="Loading company gigs..." />
      </Screen>
    );
  }

  const gigs = gigsQuery.data?.gigs || [];

  return (
    <Screen scroll>
      <Heading>Company gigs</Heading>
      <Body style={{ marginBottom: 12 }}>
        Showing gigs for {companyQuery.data?.myCompanies?.[0]?.name || "your first company"}.
      </Body>

      {companyQuery.error ? <Text style={{ color: theme.colors.danger }}>{companyQuery.error.message}</Text> : null}
      {gigsQuery.error ? <Text style={{ color: theme.colors.danger }}>{gigsQuery.error.message}</Text> : null}

      {gigs.map((gig) => (
        <Card key={gig.id}>
          <Heading style={{ fontSize: 20 }}>{gig.title || "Untitled gig"}</Heading>
          <Body>{gig.description || "No description"}</Body>
          <Body>Status: {gig.status}</Body>
          <Body>${((gig.currentPriceCents || gig.payCents || 0) / 100).toFixed(2)}</Body>
          <Button
            label="Mark Open"
            variant="secondary"
            loading={updating}
            onPress={() => updateGigStatus({ variables: { gigId: gig.id, status: "OPEN" } })}
          />
          <Button
            label="Mark Cancelled"
            variant="secondary"
            loading={updating}
            onPress={() => updateGigStatus({ variables: { gigId: gig.id, status: "CANCELLED" } })}
          />
        </Card>
      ))}

      {!gigs.length ? (
        <Card>
          <Body>No gigs found for this company.</Body>
        </Card>
      ) : null}
    </Screen>
  );
}
