import React from "react";
import { Platform, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../theme";
import { Card } from "../components";

function formatMoney(amountCents) {
  return `$${((amountCents || 0) / 100).toFixed(2)}`;
}

function getTierBubbleColor(tier, theme) {
  switch (tier) {
    case "COPPER":
      return "#B87333";
    case "BRONZE":
      return "#CD7F32";
    case "SILVER":
      return "#A7B1C2";
    case "GOLD":
      return "#D4AF37";
    case "PLATINUM":
      return "#7FB5B5";
    case "DIAMOND":
      return "#6ECBEF";
    default:
      return theme.colors.tierBronze;
  }
}

export function UserSummaryCard({
  name,
  username,
  tier,
  starsBalance = 0,
  ratingAvg = null,
  moneyBalanceCents = null,
  starsOnly = false,
  style,
}) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== "web" && width <= 430;

  const cardPadding = isMobile ? theme.spacing.md : theme.spacing.lg;
  const nameSize = isMobile ? 16 : 22;
  const nameLineHeight = isMobile ? 22 : 28;
  const usernameSize = isMobile ? 14 : 18;
  const usernameLineHeight = isMobile ? 18 : 22;
  const statLabelSize = isMobile ? 13 : 16;
  const statValueSize = isMobile ? 16 : 20;
  const statIconSize = isMobile ? 18 : 24;
  const tierFontSize = isMobile ? 13 : 16;
  const tierPaddingX = isMobile ? 8 : 10;
  const tierPaddingY = isMobile ? 4 : 5;
  const statGap = isMobile ? 6 : 8;
  const ratingValue = Number.isFinite(Number(ratingAvg)) ? Number(ratingAvg).toFixed(1) : "0.0";
  const tierBubbleColor = getTierBubbleColor(tier, theme);

  return (
    <Card
      style={[
        {
          backgroundColor: theme.colors.strongSurface,
          borderColor: theme.colors.strongSurface,
          borderRadius: theme.radii.lg,
          padding: cardPadding,
          marginBottom: theme.spacing.lg,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "stretch" }}>
        <View style={{ flex: 1, justifyContent: "space-between", minHeight: isMobile ? 112 : 128 }}>
          <View>
            <Text
              style={{
                color: theme.colors.strongSurfaceText,
                fontSize: nameSize,
                lineHeight: nameLineHeight,
                fontWeight: "800",
              }}
              numberOfLines={1}
            >
              {name || "Profile"}
            </Text>
            <Text
              style={{
                color: theme.colors.success,
                fontSize: usernameSize,
                lineHeight: usernameLineHeight,
                fontWeight: "700",
              }}
              numberOfLines={1}
            >
              @{username || "username"}
            </Text>
          </View>
          {tier ? (
            <View
              style={{
                alignSelf: "flex-start",
                borderRadius: theme.radii.sm,
                backgroundColor: tierBubbleColor,
                paddingHorizontal: tierPaddingX,
                paddingVertical: tierPaddingY,
              }}
            >
              <Text style={{ color: theme.colors.strongSurfaceText, fontSize: tierFontSize, fontWeight: "700" }}>
                {tier}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ alignItems: "flex-end", justifyContent: starsOnly ? "flex-start" : "space-between", marginLeft: 8, minHeight: isMobile ? 112 : 128 }}>
          {!starsOnly ? (
            <View style={{ marginBottom: statGap, alignItems: "flex-end" }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: statLabelSize, fontWeight: "600" }}>Rating</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="star" size={isMobile ? 17 : 20} color={theme.colors.success} style={{ marginRight: 6 }} />
                <Text style={{ color: theme.colors.strongSurfaceText, fontSize: statValueSize, fontWeight: "800" }}>
                  {ratingValue}
                </Text>
              </View>
            </View>
          ) : null}

          {!starsOnly ? (
            <View style={{ alignItems: "flex-end", marginBottom: moneyBalanceCents == null ? 0 : statGap }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: statLabelSize, fontWeight: "600" }}>
                Balance
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="cash-outline" size={statIconSize} color={theme.colors.success} style={{ marginRight: 6 }} />
                <Text style={{ color: theme.colors.strongSurfaceText, fontSize: statValueSize, fontWeight: "800" }}>
                  {formatMoney(moneyBalanceCents)}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={{ alignItems: "flex-end", marginTop: starsOnly ? 4 : 0 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: statLabelSize, fontWeight: "600" }}>Stars</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="star" size={statIconSize} color={theme.colors.warning} style={{ marginRight: 6 }} />
              <Text style={{ color: theme.colors.strongSurfaceText, fontSize: statValueSize, fontWeight: "800" }}>
                {starsBalance || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}
