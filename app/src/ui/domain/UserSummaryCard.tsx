import React from "react";
import { Image, Platform, Text, View, useWindowDimensions } from "react-native";
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
  avatarUrl,
  tier,
  starsBalance = 0,
  gigCount = 0,
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
  const avatarSize = isMobile ? 56 : 72;
  const tierBadgeHeight = tier ? tierFontSize + tierPaddingY * 2 : 0;
  const tierRowSpacing = tier ? 10 : 0;
  const bottomStatReserve = tierBadgeHeight + tierRowSpacing;
  const baseColumnHeight = isMobile ? 112 : 128;
  const columnHeight = baseColumnHeight + bottomStatReserve;
  const ratingValue = Number.isFinite(Number(ratingAvg)) ? Number(ratingAvg).toFixed(1) : "0.0";
  const tierBubbleColor = getTierBubbleColor(tier, theme);

  const rightStats = [
    ...(!starsOnly
      ? [
          {
            label: "Rating",
            icon: "star",
            iconColor: theme.colors.success,
            value: ratingValue,
            iconSize: isMobile ? 17 : 20,
          },
          {
            label: "Balance",
            icon: "cash-outline",
            iconColor: theme.colors.success,
            value: formatMoney(moneyBalanceCents),
            iconSize: statIconSize,
          },
        ]
      : []),
    {
      label: "Stars",
      icon: "star",
      iconColor: theme.colors.warning,
      value: String(starsBalance || 0),
      iconSize: statIconSize,
    },
    {
      label: "Gigs",
      icon: "briefcase-outline",
      iconColor: theme.colors.strongSurfaceText,
      value: String(gigCount || 0),
      iconSize: statIconSize,
    },
  ];

  return (
    <Card
      style={[
        {
          backgroundColor: theme.colors.strongSurface,
          borderColor: theme.colors.strongSurface,
          borderRadius: theme.radii.lg,
          padding: cardPadding,
          paddingBottom: cardPadding,
          marginBottom: theme.spacing.lg,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "stretch" }}>
        <View style={{ flex: 1, height: columnHeight, position: "relative" }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ marginRight: isMobile ? 10 : 14, justifyContent: "flex-start" }}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceAlt,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="person" size={isMobile ? 24 : 30} color={theme.colors.textMuted} />
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
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
          </View>
        </View>

        <View
          style={{
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginLeft: 8,
            height: columnHeight,
          }}
        >
          {rightStats.map((stat) => (
            <View key={stat.label} style={{ alignItems: "flex-end" }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: statLabelSize, fontWeight: "600" }}>
                {stat.label}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name={stat.icon} size={stat.iconSize} color={stat.iconColor} style={{ marginRight: 6 }} />
                <Text style={{ color: theme.colors.strongSurfaceText, fontSize: statValueSize, fontWeight: "800" }}>
                  {stat.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {tier ? (
        <View
          style={{
            position: "absolute",
            left: cardPadding,
            bottom: cardPadding,
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
    </Card>
  );
}
