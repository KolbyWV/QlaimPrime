import React from "react";

import { useSession } from "../session";
import { Badge, Body, Button, Card, Heading, Screen } from "../../ui/components";

export function ModeSelectScreen() {
  const { switchMode } = useSession();

  return (
    <Screen scroll>
      <Heading>Choose your Qlaim</Heading>
      <Body style={{ marginBottom: 20 }}>
        Pick a mode to get started. You can switch modes at any time from your profile.
      </Body>

      <Card>
        <Badge label="Profile" />
        <Heading style={{ fontSize: 22, marginTop: 10 }}>Find and complete gigs</Heading>
        <Body style={{ marginBottom: 14 }}>
          Discover open gigs, track assignments, manage stars products, and review payouts.
        </Body>
        <Button label="Continue as Profile" onPress={() => switchMode("worker")} />
      </Card>

      <Card>
        <Badge label="Company" />
        <Heading style={{ fontSize: 22, marginTop: 10 }}>Publish and manage work</Heading>
        <Body style={{ marginBottom: 14 }}>
          Manage your companies, publish gigs, coordinate members, and review assignment pipeline.
        </Body>
        <Button label="Continue as Company" onPress={() => switchMode("company")} />
      </Card>
    </Screen>
  );
}
