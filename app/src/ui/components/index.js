import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "../theme";

export function Screen({ children, scroll = false, contentStyle }) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const constrainedWidth = Math.min(width - 24, 840);

  const sharedLayout = [
    {
      alignSelf: "center",
      width: constrainedWidth,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    contentStyle,
  ];

  if (scroll) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={["top", "left", "right"]}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, ...sharedLayout]}
        >
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
      <View style={[styles.flex, ...sharedLayout]}>{children}</View>
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

  return (
    <Text
      style={[
        styles.heading,
        {
          color: theme.colors.text,
          marginBottom: theme.spacing.sm,
        },
        style,
      ]}
    >
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
  ...inputProps
}) {
  const { theme } = useAppTheme();
  const { style: inputStyle, ...restInputProps } = inputProps;

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>{label}</Text>
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
          },
          inputStyle,
        ]}
      />
    </View>
  );
}

export function Button({ label, onPress, variant = "primary", disabled = false, loading = false }) {
  const { theme } = useAppTheme();
  const primary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          borderRadius: theme.radii.sm,
          backgroundColor: primary ? theme.colors.primary : theme.colors.surface,
          borderColor: primary ? theme.colors.primary : theme.colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? theme.colors.primaryText : theme.colors.primary} />
      ) : (
        <Text
          style={{
            color: primary ? theme.colors.primaryText : theme.colors.text,
            fontSize: 15,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
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
    fontWeight: "700",
    lineHeight: 34,
  },
  body: {
    fontSize: 15,
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
});
