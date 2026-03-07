import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../theme";
import { Card } from "../components";

function formatCountdown(endsAt, nowMs) {
  if (!endsAt) {
    return null;
  }

  const end = new Date(endsAt).getTime();
  if (!Number.isFinite(end)) {
    return null;
  }

  const remainingSeconds = Math.max(0, Math.floor((end - nowMs) / 1000));
  const hours = String(Math.floor(remainingSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatElapsed(sinceAt, nowMs) {
  if (!sinceAt) {
    return null;
  }

  const start = new Date(sinceAt).getTime();
  if (!Number.isFinite(start)) {
    return null;
  }

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - start) / 1000));
  const hours = String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function GigCard({
  gig,
  watched = false,
  onPress,
  onToggleWatch,
  timerMode = "countdown",
  timerStartedAt,
  style,
  width,
  children,
}) {
  const { theme } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [nowMs, setNowMs] = useState(() => Date.now());

  const timerText = useMemo(() => {
    if (timerMode === "none") return null;
    if (timerMode === "elapsed") return formatElapsed(timerStartedAt, nowMs);
    return formatCountdown(gig?.endsAt, nowMs);
  }, [gig?.endsAt, nowMs, timerMode, timerStartedAt]);
  const defaultCardWidth = useMemo(() => {
    if (Platform.OS === "web") {
      return 340;
    }
    return Math.min(Math.max(windowWidth - 64, 260), 340);
  }, [windowWidth]);
  const resolvedWidth = typeof width === "number" ? width : (width === null ? null : defaultCardWidth);

  useEffect(() => {
    const hasTimerSource = timerMode === "elapsed" ? Boolean(timerStartedAt) : Boolean(gig?.endsAt);
    if (!hasTimerSource || timerMode === "none") return undefined;
    const interval = setInterval(() => setNowMs(Date.now()), 30 * 1000);
    return () => clearInterval(interval);
  }, [gig?.endsAt, timerMode, timerStartedAt]);

  const content = (
    <Card
      style={[
        {
          ...(typeof resolvedWidth === "number"
            ? {
                width: resolvedWidth,
                marginRight: theme.spacing.md,
              }
            : { marginRight: 0 }),
          padding: Platform.OS === "web" ? theme.spacing.lg : theme.spacing.md,
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.surface,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: Platform.OS === "web" ? 20 : 18,
              lineHeight: Platform.OS === "web" ? 26 : 24,
              fontWeight: "800",
            }}
            numberOfLines={1}
          >
            {gig?.title || "Untitled"}
          </Text>
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: Platform.OS === "web" ? 17 : 16,
              lineHeight: Platform.OS === "web" ? 22 : 21,
              fontWeight: "700",
            }}
            numberOfLines={1}
          >
            {gig?.company?.name || "Unknown company"}
          </Text>
        </View>
        <Pressable
          hitSlop={10}
          onPress={onToggleWatch}
          disabled={!onToggleWatch}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons
            name={watched ? "heart" : "heart-outline"}
            size={Platform.OS === "web" ? 34 : 30}
            color={watched ? theme.colors.danger : theme.colors.text}
          />
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
        <Ionicons name="navigate" size={26} color={theme.colors.accent} style={{ marginRight: 8 }} />
        <Text
          style={{
            color: theme.colors.text,
            fontSize: Platform.OS === "web" ? 16 : 15,
            lineHeight: Platform.OS === "web" ? 22 : 20,
            fontWeight: "700",
          }}
          numberOfLines={1}
        >
          {gig?.location?.name || gig?.location?.city || "Location TBD"}
        </Text>
      </View>

      <View
        style={{
          marginTop: theme.spacing.md,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: theme.colors.accent, fontSize: Platform.OS === "web" ? 24 : 22, lineHeight: Platform.OS === "web" ? 30 : 28, fontWeight: "800" }}>
          ${((gig?.payCents || 0) / 100).toFixed(0)}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="star" size={20} color={theme.colors.warning} style={{ marginRight: 6 }} />
          <Text style={{ color: theme.colors.text, fontSize: Platform.OS === "web" ? 20 : 18, lineHeight: Platform.OS === "web" ? 24 : 22, fontWeight: "800" }}>
            {gig?.totalStarsReward || gig?.baseStars || 0}
          </Text>
        </View>
      </View>

      {timerText ? (
        <View
          style={{
            marginTop: theme.spacing.md,
            borderRadius: theme.radii.sm,
            backgroundColor: theme.colors.strongSurface,
            paddingVertical: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: theme.colors.strongSurfaceText, fontSize: 28, lineHeight: 32, fontWeight: "800" }}>
            {timerText}
          </Text>
        </View>
      ) : null}

      {children}
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
      {content}
    </Pressable>
  );
}
