import React from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { useQuery } from "@apollo/client/react";

import { useSession } from "../../auth/session";
import {
  COMPANY_MEMBERSHIP_REQUESTS_QUERY,
  MY_COMPANIES_QUERY,
} from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import { Body, Button, Card, Heading, LoadingState, Screen } from "../../ui/components";

const ACTION_ROLES = new Set(["CREATOR", "MANAGER", "OWNER"]);

export function CompanyDashboardScreen({ navigation }) {
  const { theme } = useAppTheme();
  const { me } = useSession();
  const { width } = useWindowDimensions();
  const { data, loading, error } = useQuery(MY_COMPANIES_QUERY);
  const companies = data?.myCompanies || [];
  const activeCompanyId = companies?.[0]?.id;
  const activeMemberRole = me?.companies?.find(
    (member) => member?.companyId === activeCompanyId,
  )?.role;
  const canModerateRequests = activeMemberRole === "OWNER";
  const canUseCreateActions = activeCompanyId && ACTION_ROLES.has(activeMemberRole);
  const compact = width < 760;
  const membershipRequestsQuery = useQuery(COMPANY_MEMBERSHIP_REQUESTS_QUERY, {
    variables: {
      companyId: activeCompanyId,
      status: "PENDING",
      limit: 100,
      offset: 0,
    },
    skip: !activeCompanyId || !canModerateRequests,
  });
  const pendingRequests = membershipRequestsQuery.data?.companyMembershipRequests || [];

  if (loading || (canModerateRequests && membershipRequestsQuery.loading)) {
    return (
      <Screen>
        <LoadingState label="Loading companies..." />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Heading>Company dashboard</Heading>
      <Body style={{ marginBottom: 12 }}>My companies and quick actions.</Body>

      {error ? <Text style={{ color: theme.colors.danger }}>{error.message}</Text> : null}
      {canModerateRequests && membershipRequestsQuery.error ? (
        <Text style={{ color: theme.colors.danger }}>{membershipRequestsQuery.error.message}</Text>
      ) : null}
      {!activeCompanyId ? (
        <Body style={{ marginBottom: 10 }}>Join or create a company to access company actions.</Body>
      ) : !canUseCreateActions ? (
        <Body style={{ marginBottom: 10 }}>
          Your role is {activeMemberRole || "UNKNOWN"}. Only CREATOR, MANAGER, or OWNER can create gigs and locations.
        </Body>
      ) : null}

      <View style={{ flexDirection: compact ? "column" : "row", marginBottom: 12 }}>
        <View style={{ flex: 1, marginRight: compact ? 0 : 6 }}>
          <Card>
            <Heading style={{ fontSize: 20 }}>Add A New Gig</Heading>
            <Body style={{ marginBottom: 10 }}>
              Publish new work opportunities for contractors.
            </Body>
            <Button
              label="Create Gig"
              disabled={!canUseCreateActions}
              onPress={() => navigation.navigate("CreateGig")}
            />
          </Card>
        </View>
        <View style={{ flex: 1, marginLeft: compact ? 0 : 6 }}>
          <Card>
            <Heading style={{ fontSize: 20 }}>Add A Location</Heading>
            <Body style={{ marginBottom: 10 }}>
              Add saved locations used when posting gigs.
            </Body>
            <Button
              label="Create Location"
              disabled={!canUseCreateActions}
              onPress={() => navigation.navigate("CreateLocation")}
            />
          </Card>
        </View>
      </View>

      {canModerateRequests ? (
        <Card>
          <Heading style={{ fontSize: 20 }}>Pending membership requests</Heading>
          <Body style={{ marginBottom: 10 }}>
            {pendingRequests.length
              ? `${pendingRequests.length} request(s) awaiting review.`
              : "No pending membership requests."}
          </Body>
          {pendingRequests.slice(0, 3).map((request) => (
            <Body key={request.id} style={{ marginBottom: 6 }}>
              {request.user?.email || request.userId} requested membership.
            </Body>
          ))}
          <Button
            label="Review in Members tab"
            variant="secondary"
            onPress={() => navigation.getParent()?.navigate("Members")}
          />
        </Card>
      ) : null}

      {companies.map((company) => (
        <Card key={company.id}>
          <Heading style={{ fontSize: 20 }}>{company.name}</Heading>
          <Body>ID: {company.id}</Body>
          <Body>Created: {company.createdAt || "-"}</Body>
        </Card>
      ))}

      {companies.length === 0 ? (
        <Card>
          <Body>No companies found.</Body>
        </Card>
      ) : null}
    </Screen>
  );
}
