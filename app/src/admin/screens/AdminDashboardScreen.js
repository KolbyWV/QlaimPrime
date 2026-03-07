import React from "react";
import { Text } from "react-native";
import { useQuery } from "@apollo/client/react";

import { useSession } from "../../auth/session";
import { MY_COMPANIES_QUERY } from "../../graphql/domain";
import { Body, Button, Card, Heading, LoadingState, Screen, SectionTitle } from "../../ui/components";
import { useAppTheme } from "../../ui/theme";

export function AdminDashboardScreen({ navigation }) {
  const { theme } = useAppTheme();
  const { me, switchMode, signOut } = useSession();
  const { data, loading, error } = useQuery(MY_COMPANIES_QUERY);

  if (loading) {
    return (
      <Screen>
        <LoadingState label="Loading admin dashboard..." />
      </Screen>
    );
  }

  const companies = data?.myCompanies || [];
  const isAdmin = me?.role === "ADMIN";

  return (
    <Screen scroll contentStyle={{ paddingBottom: 120 }}>
      <Heading>Admin dashboard</Heading>
      <Body style={{ marginBottom: 10 }}>Background operations and full company management tools.</Body>

      {error ? <Text style={{ color: theme.colors.danger, marginBottom: 8 }}>{error.message}</Text> : null}

      <Card>
        <Body>Email: {me?.email || "-"}</Body>
        <Body>Role: {me?.role || "USER"}</Body>
        <Body>Admin access: {isAdmin ? "Yes" : "No"}</Body>
        <Body>Companies in scope: {companies.length}</Body>
      </Card>

      <SectionTitle>Quick actions</SectionTitle>
      <Card>
        <Button label="Open Company Dashboard" onPress={() => navigation.navigate("AdminCompanyDashboard")} />
        <Button label="Create Gig" onPress={() => navigation.navigate("AdminCreateGig")} />
        <Button label="Create Location" onPress={() => navigation.navigate("AdminCreateLocation")} />
        <Button label="Manage Gigs" onPress={() => navigation.navigate("AdminCompanyGigs")} />
        <Button label="Manage Members" onPress={() => navigation.navigate("AdminCompanyMembers")} />
        <Button label="Manage Reviews" onPress={() => navigation.navigate("AdminCompanyReviews")} />
        <Button label="Company Account" onPress={() => navigation.navigate("AdminCompanyAccount")} />
      </Card>

      <SectionTitle>Session</SectionTitle>
      <Card>
        <Button label="Switch to Profile Mode" variant="secondary" onPress={() => switchMode("worker")} />
        <Button label="Switch to Company Mode" variant="secondary" onPress={() => switchMode("company")} />
        <Button label="Sign out" variant="destructive" onPress={signOut} style={{ marginBottom: 0 }} />
      </Card>
    </Screen>
  );
}
