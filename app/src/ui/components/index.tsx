import React, { useContext } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContext } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "../theme";

export function Screen({
  children,
  scroll = false,
  contentStyle,
  hideBack = false,
  refreshControl,
}) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const navigation = useContext(NavigationContext);
  const canGoBack = !hideBack && navigation?.canGoBack?.();
  const constrainedWidth = Math.min(width - 24, 840);

  const contentLayout = [
    {
      alignSelf: "center",
      width: constrainedWidth,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    contentStyle,
  ];

  const backButton = canGoBack ? (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={8}
      style={({ pressed }) => [
        {
          alignSelf: "flex-start",
          marginTop: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
          width: 42,
          height: 42,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
    </Pressable>
  ) : null;

  if (scroll) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={["top", "left", "right"]}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, ...contentLayout]}
          refreshControl={refreshControl}
        >
          {backButton}
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.flex, ...contentLayout]}>
        {backButton}
        {children}
      </View>
    </SafeAreaView>
  );
}

export function Card({ children, style }) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.md,
          padding: theme.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Heading({ children, style }) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== "web" && width <= 430;

  const resolvedStyle = StyleSheet.flatten([
    styles.heading,
    {
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      ...(theme.typography?.h2 || {}),
    },
    style,
  ]);

  const normalizedStyle = {
    ...resolvedStyle,
    ...(isMobile
      ? {
          fontSize: Math.min(resolvedStyle?.fontSize || 28, 24),
          lineHeight: Math.min(resolvedStyle?.lineHeight || 34, 30),
        }
      : null),
  };

  return (
    <Text style={normalizedStyle}>
      {children}
    </Text>
  );
}

export function Body({ children, style }) {
  const { theme } = useAppTheme();

  return (
    <Text
      style={[
        styles.body,
        {
          color: theme.colors.textMuted,
          ...(theme.typography?.body || {}),
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
  placeholder,
  autoCapitalize = "none",
  editable = true,
  rightAdornment = null,
  ...inputProps
}) {
  const { theme } = useAppTheme();
  const { style: inputStyle, ...restInputProps } = inputProps;

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize={autoCapitalize}
          editable={editable}
          {...restInputProps}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.radii.sm,
              paddingRight: rightAdornment ? 44 : 12,
            },
            inputStyle,
          ]}
        />
        {rightAdornment ? <View style={styles.inputAdornment}>{rightAdornment}</View> : null}
      </View>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}) {
  const { theme } = useAppTheme();
  const isPrimary = variant === "primary";
  const isDestructive = variant === "destructive";
  const isGhost = variant === "ghost";

  const backgroundColor = (() => {
    if (isPrimary) return theme.colors.primary;
    if (isDestructive) return theme.colors.danger;
    if (isGhost) return "transparent";
    return theme.colors.surface;
  })();

  const borderColor = (() => {
    if (isPrimary) return theme.colors.primary;
    if (isDestructive) return theme.colors.danger;
    if (isGhost) return "transparent";
    return theme.colors.border;
  })();

  const textColor = (() => {
    if (isPrimary || isDestructive) return theme.colors.primaryText;
    if (isGhost) return theme.colors.primary;
    return theme.colors.text;
  })();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          borderRadius: theme.radii.sm,
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={{
            color: textColor,
            ...(theme.typography?.label || { fontSize: 15, fontWeight: "600" }),
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function SearchInput({ value, onChangeText, placeholder = "Search", style }) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.searchWrap,
        {
          borderRadius: theme.radii.md,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.spacing.md,
        },
        style,
      ]}
    >
      <Ionicons name="search" size={28} color={theme.colors.textMuted} style={{ marginRight: 10 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.searchInput,
          {
            color: theme.colors.text,
            ...(theme.typography?.h3 || { fontSize: 24, fontWeight: "700" }),
          },
        ]}
      />
    </View>
  );
}

export function SectionTitle({ children, style }) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== "web" && width <= 430;

  const resolvedStyle = StyleSheet.flatten([
    styles.sectionTitle,
    {
      color: theme.colors.textSecondary || theme.colors.text,
      ...(theme.typography?.h3 || {}),
    },
    style,
  ]);

  const normalizedStyle = {
    ...resolvedStyle,
    ...(isMobile
      ? {
          fontSize: Math.min(resolvedStyle?.fontSize || 20, 16),
          lineHeight: Math.min(resolvedStyle?.lineHeight || 26, 22),
          letterSpacing: Math.min(resolvedStyle?.letterSpacing || 0.6, 0.4),
        }
      : null),
  };

  return (
    <Text style={normalizedStyle}>
      {children}
    </Text>
  );
}

export function Badge({ label }) {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: theme.colors.surfaceAlt,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
      }}
    >
      <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}

export function LoadingState({ label = "Loading..." }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={{ marginTop: 10, color: theme.colors.textMuted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    marginBottom: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  fieldLabel: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  inputWrap: {
    position: "relative",
    justifyContent: "center",
  },
  inputAdornment: {
    position: "absolute",
    right: 12,
    top: 10,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    borderWidth: 1,
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    minHeight: 54,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
});
