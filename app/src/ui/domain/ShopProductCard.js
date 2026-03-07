import React from "react";
import { Platform, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../theme";
import { Button, Card } from "../components";

export function ShopProductCard({ product, variant = "membership", onPurchase, loading = false, owned = false }) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const isMembership = variant === "membership";
  const isMobile = Platform.OS !== "web" && width <= 430;

  const verticalPadding = isMobile ? 14 : 20;
  const titleSize = isMobile ? 18 : 22;
  const titleLineHeight = isMobile ? 24 : 28;
  const subtitleSize = isMobile ? 15 : 18;
  const subtitleLineHeight = isMobile ? 21 : 24;
  const priceSize = isMobile ? 20 : 22;
  const priceLineHeight = isMobile ? 24 : 28;
  const starSize = isMobile ? 20 : 22;
  const buttonTopMargin = isMobile ? 10 : 14;

  return (
    <Card
      style={{
        paddingVertical: verticalPadding,
        borderRadius: theme.radii.md,
        backgroundColor: isMembership ? theme.colors.surface : theme.colors.accentSoft,
        marginBottom: theme.spacing.md,
        shadowColor: theme.colors.strongSurface,
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={{
              color: theme.colors.accent,
              fontSize: titleSize,
              lineHeight: titleLineHeight,
              fontWeight: "800",
            }}
            numberOfLines={1}
          >
            {product?.title || "Untitled product"}
          </Text>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: subtitleSize,
              lineHeight: subtitleLineHeight,
              fontWeight: "600",
              marginTop: 4,
            }}
            numberOfLines={2}
          >
            {product?.subtitle || "Upgrade your contractor advantages."}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: theme.colors.text, fontSize: priceSize, lineHeight: priceLineHeight, fontWeight: "800" }}>
            {product?.starsCost || 0}
          </Text>
          <Ionicons name="star" size={starSize} color={theme.colors.warning} style={{ marginLeft: 6 }} />
        </View>
      </View>

      <Button
        label={owned ? "Owned" : "Buy with stars"}
        onPress={onPurchase}
        disabled={owned || loading}
        loading={loading}
        style={{ marginTop: buttonTopMargin, marginBottom: 0 }}
      />
    </Card>
  );
}
