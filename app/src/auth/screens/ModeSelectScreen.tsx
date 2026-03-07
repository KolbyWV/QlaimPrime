import React from "react";
import { Pressable, Text, View } from "react-native";

import { useSession } from "../session";
import { Body, Button, Heading, Screen } from "../../ui/components";
import { useAppTheme } from "../../ui/theme";

export function ModeSelectScreen() {
  const { switchMode } = useSession();
  const { theme } = useAppTheme();

  return (
    <Screen hideBack scroll contentStyle={{ justifyContent: "space-between", flexGrow: 1 }}>
      <View>
        <View style={{ alignItems: "center", marginTop: 100 }}>
          <Text style={{ color: theme.colors.text, fontSize: 30, fontWeight: "900", letterSpacing: 1 }}>QLAIM</Text>
          <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: "700", marginTop: 4 }}>
            Version 1.2.0
          </Text>
        </View>

        <Heading style={{ marginTop: 48, marginBottom: 8 }}>Shift Happens. Earn Money Better.</Heading>
        <Body style={{ fontSize: 18 }}>
          QLAIM is a platform that connects you with companies that need your help. Sign up and start earning money
          today.
        </Body>
      </View>

      <View style={{ marginBottom: 40 }}>
        <Button label="Continue as Contractor" onPress={() => switchMode("worker")} style={{ minHeight: 56 }} />
        <Button
          label="Continue as Company"
          variant="secondary"
          onPress={() => switchMode("company")}
          style={{ minHeight: 56, marginBottom: 0 }}
        />
      </View>
      <Pressable
        onPress={() => switchMode("admin")}
        style={{ position: "absolute", right: 12, bottom: 10, paddingHorizontal: 8, paddingVertical: 6 }}
      >
        <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: "600" }}>admin</Text>
      </Pressable>
    </Screen>
  );
}
