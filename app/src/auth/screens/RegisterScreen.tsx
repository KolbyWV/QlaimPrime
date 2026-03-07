import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useSession } from "../session";
import { Body, Button, Field, Heading, Screen } from "../../ui/components";
import { useAppTheme } from "../../ui/theme";

export function RegisterScreen({ navigation }) {
  const { theme } = useAppTheme();
  const { register, mode } = useSession();
  const isCompanyAuth = mode === "company";
  const modeAccent = isCompanyAuth ? theme.colors.warning : theme.colors.primary;
  const modeLabel = mode === "company" ? "COMPANY PORTAL" : (mode === "admin" ? "ADMIN PORTAL" : "CONTRACTOR PORTAL");
  const modeBadgeBg = mode === "company" ? "#d6e7ff" : (mode === "admin" ? theme.colors.strongSurface : theme.colors.accentSoft);
  const modeBadgeText = mode === "company" ? "#023e8a" : (mode === "admin" ? theme.colors.strongSurfaceText : theme.colors.strongSurface);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({ email, password });
    } catch (nextError) {
      setError(nextError.message || "Unable to register.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen hideBack scroll contentStyle={{ paddingTop: 8, paddingBottom: 30 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={30} color={theme.colors.text} />
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={{ color: modeAccent, fontSize: 18, fontWeight: "700" }}>Sign In</Text>
        </Pressable>
      </View>

      <View style={{ alignItems: "center", marginTop: 22, marginBottom: 12 }}>
        <Text style={{ color: theme.colors.text, fontSize: 30, fontWeight: "900", letterSpacing: 1 }}>QLAIM</Text>
        <View
          style={{
            marginTop: 4,
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

      <Heading style={{ fontSize: 30, marginBottom: 4 }}>Create account</Heading>
      <Body style={{ fontSize: 16, marginBottom: 18 }}>Set up your Qlaim account to start claiming gigs</Body>

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

      <Field
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        placeholder="Confirm password"
        rightAdornment={
          <Pressable onPress={() => setShowConfirmPassword((prev) => !prev)} hitSlop={8}>
            <Ionicons
              name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
              size={24}
              color={theme.colors.text}
            />
          </Pressable>
        }
      />

      {error ? <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>{error}</Text> : null}

      <Button
        label={loading ? "Creating account..." : "Sign up"}
        onPress={onSubmit}
        loading={loading}
        disabled={!email || !password || !confirmPassword}
        style={{ minHeight: 56 }}
      />
    </Screen>
  );
}
