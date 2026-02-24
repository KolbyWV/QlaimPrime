import React from "react";

import { useSession } from "../../auth/session";
import { useAppTheme } from "../../ui/theme";
import { Badge, Body, Button, Card, Heading, Screen } from "../../ui/components";

export function CompanyAccountScreen() {
  const { me, switchMode, signOut } = useSession();
  const { themeMode, toggleThemeMode } = useAppTheme();

  const membershipCount = me?.companies?.length || 0;

  return (
    <Screen scroll>
      <Heading>Company account</Heading>
      <Body style={{ marginBottom: 12 }}>Switch modes, theme, or session.</Body>

      <Card>
        <Badge label="User" />
        <Heading style={{ fontSize: 22, marginTop: 10 }}>{me?.email || "No email"}</Heading>
        <Body>Memberships: {membershipCount}</Body>
      </Card>

      <Card>
        <Button label="Switch to Profile Mode" onPress={() => switchMode("worker")} />
        <Button
          label={themeMode === "dark" ? "Use Light Theme" : "Use Dark Theme"}
          variant="secondary"
          onPress={toggleThemeMode}
        />
        <Button label="Sign out" variant="secondary" onPress={signOut} />
      </Card>
    </Screen>
  );
}
