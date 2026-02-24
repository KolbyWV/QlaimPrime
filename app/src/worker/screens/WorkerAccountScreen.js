import React from "react";

import { useSession } from "../../auth/session";
import { useAppTheme } from "../../ui/theme";
import { Badge, Body, Button, Card, Heading, Screen } from "../../ui/components";

export function WorkerAccountScreen() {
  const { themeMode, toggleThemeMode } = useAppTheme();
  const { me, switchMode, signOut } = useSession();

  return (
    <Screen scroll>
      <Heading>Account</Heading>
      <Body style={{ marginBottom: 12 }}>Manage identity, mode, and session.</Body>

      <Card>
        <Badge label="Profile" />
        <Heading style={{ fontSize: 22, marginTop: 10 }}>
          {me?.profile?.firstName || "Unnamed"} {me?.profile?.lastName || ""}
        </Heading>
        <Body>{me?.email || "No email"}</Body>
        <Body>@{me?.profile?.username || "username"}</Body>
      </Card>

      <Card>
        <Button label="Switch to Company Mode" onPress={() => switchMode("company")} />
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
