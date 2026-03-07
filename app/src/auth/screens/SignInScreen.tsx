import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useSession } from "../session";
import { useAppTheme } from "../../ui/theme";
import { Body, Button, Field, Heading, Screen } from "../../ui/components";

export function SignInScreen({ navigation, route }) {
  const { theme } = useAppTheme();
  const { signIn, switchMode, mode } = useSession();
  const hideSignUp = Boolean(route?.params?.hideSignUp);
  const isCompanyAuth = mode === "company";
  const modeAccent = isCompanyAuth ? theme.colors.warning : theme.colors.primary;
  const modeLabel = mode === "company" ? "COMPANY PORTAL" : (mode === "admin" ? "ADMIN PORTAL" : "CONTRACTOR PORTAL");
  const modeBadgeBg = mode === "company" ? "#d6e7ff" : (mode === "admin" ? theme.colors.strongSurface : theme.colors.accentSoft);
  const modeBadgeText = mode === "company" ? "#023e8a" : (mode === "admin" ? theme.colors.strongSurfaceText : theme.colors.strongSurface);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await signIn({ email, password });
    } catch (nextError) {
      setError(nextError.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen hideBack scroll contentStyle={{ paddingTop: 8, paddingBottom: 30 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Pressable onPress={() => switchMode(null)} hitSlop={10}>
          <Ionicons name="arrow-back" size={30} color={theme.colors.text} />
        </Pressable>
        {hideSignUp ? <View /> : (
          <Pressable onPress={() => navigation.navigate("Register")} hitSlop={10}>
            <Text style={{ color: modeAccent, fontSize: 18, fontWeight: "700" }}>Sign Up</Text>
          </Pressable>
        )}
      </View>

      <View style={{ alignItems: "center", marginTop: 22, marginBottom: 22 }}>
        <Text style={{ color: theme.colors.text, fontSize: 30, fontWeight: "900", letterSpacing: 1 }}>QLAIM</Text>
        <View
          style={{
            marginTop: 8,
            borderRadius: theme.radii.pill,
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: modeBadgeBg,
          }}
        >
          <Text style={{ color: modeBadgeText, fontSize: 12, fontWeight: "800", letterSpacing: 0.7 }}>
            {modeLabel}
          </Text>
        </View>
      </View>

      <Heading style={{ fontSize: 30, marginBottom: 2 }}>Welcome back</Heading>
      <Body style={{ fontSize: 16, marginBottom: 18 }}>Sign in to your account to continue</Body>

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        rightAdornment={<Ionicons name="person-outline" size={24} color={theme.colors.text} />}
      />

      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        placeholder="Password"
        rightAdornment={
          <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={24}
              color={theme.colors.text}
            />
          </Pressable>
        }
      />

      <Pressable onPress={() => navigation.navigate("ForgotPassword")} hitSlop={8}>
        <Text
          style={{
            color: modeAccent,
            fontSize: 18,
            fontWeight: "800",
            textAlign: "right",
            marginBottom: 20,
          }}
        >
          Forgot your password?
        </Text>
      </Pressable>

      {error ? <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>{error}</Text> : null}

      <Button
        label={loading ? "Signing in..." : "Sign in"}
        onPress={onSubmit}
        loading={loading}
        disabled={!email || !password}
        style={{ minHeight: 56, marginBottom: 16 }}
      />

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
        <Text style={{ marginHorizontal: 12, color: theme.colors.text, fontWeight: "700", fontSize: 16 }}>Or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
      </View>

      <Button
        label="Sign in with Apple"
        variant="primary"
        onPress={() => {}}
        style={{ minHeight: 56, backgroundColor: theme.colors.strongSurface, borderColor: theme.colors.strongSurface }}
      />
    </Screen>
  );
}
