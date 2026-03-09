import React, { useCallback } from "react";
import { Text } from "react-native";
import { useQuery } from "@apollo/client/react";
import { useFocusEffect } from "@react-navigation/native";

import { useSession } from "../../auth/session";
import {
  MY_MONEY_TRANSACTIONS_QUERY,
} from "../../graphql/domain";
import { Button, Card, Heading, Screen, SectionTitle } from "../../ui/components";
import { UserSummaryCard } from "../../ui/domain";
import { useAppTheme } from "../../ui/theme";

function calculateMoneyBalance(transactions) {
  return (transactions || []).reduce((total, tx) => total + (tx?.amountCents || 0), 0);
}

export function WorkerAccountScreen({ navigation }) {
  const { theme, themeMode, toggleThemeMode } = useAppTheme();
  const { me, switchMode, signOut, refreshMe } = useSession();
  const { data: moneyData, error: moneyError } = useQuery(MY_MONEY_TRANSACTIONS_QUERY, {
    variables: { limit: 100, offset: 0 },
  });

  const balanceCents = calculateMoneyBalance(moneyData?.myMoneyTransactions);
  const canAccessAdmin = me?.role === "ADMIN";

  useFocusEffect(
    useCallback(() => {
      refreshMe().catch(() => {
        // Ignore focus-refresh failures; the screen can still render cached session data.
      });
    }, [refreshMe]),
  );

  return (
    <Screen hideBack scroll contentStyle={{ paddingBottom: 130 }}>
      <Heading style={{ fontSize: 32, marginBottom: 10 }}>PROFILE</Heading>

      <UserSummaryCard
        name={`${me?.profile?.firstName || ""} ${me?.profile?.lastName || ""}`.trim() || me?.email || "Profile"}
        username={me?.profile?.username || "username"}
        avatarUrl={me?.profile?.avatarUrl || ""}
        tier={me?.profile?.tier || "COPPER"}
        starsBalance={me?.profile?.starsBalance || 0}
        gigCount={me?.assignments?.length || 0}
        ratingAvg={me?.profile?.ratingAvg ?? 5}
        moneyBalanceCents={balanceCents}
      />

      {moneyError ? <Text style={{ color: theme.colors.danger, marginBottom: 8 }}>{moneyError.message}</Text> : null}

      <SectionTitle>Account actions</SectionTitle>
      <Card>
        <Button
          label="Update Profile"
          variant="secondary"
          onPress={() => navigation.navigate("UpdateProfile")}
        />
        <Button
          label="Gig History"
          variant="secondary"
          onPress={() => navigation.navigate("PastAssignments")}
        />
        <Button
          label="Transactions"
          variant="secondary"
          onPress={() => navigation.navigate("Transactions")}
        />
        <Button label="Switch to Company Mode" onPress={() => switchMode("company")} />
        {canAccessAdmin ? (
          <Button label="Switch to Admin Mode" variant="secondary" onPress={() => switchMode("admin")} />
        ) : null}
        <Button
          label={themeMode === "dark" ? "Use Light Theme" : "Use Dark Theme"}
          variant="secondary"
          onPress={toggleThemeMode}
        />
        <Button label="Sign out" variant="destructive" onPress={signOut} style={{ marginBottom: 0 }} />
      </Card>
    </Screen>
  );
}
