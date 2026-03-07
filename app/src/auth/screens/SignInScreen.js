import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useSession } from "../session";
import { useAppTheme } from "../../ui/theme";
import { Body, Button, Field, Heading, Screen } from "../../ui/components";

export function SignInScreen({ navigation, route }) {
  const { theme } = useAppTheme();
  const { signIn } = useSession();
  const hideSignUp = Boolean(route?.params?.hideSignUp);

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
    <Screen scroll contentStyle={{ paddingTop: 8, paddingBottom: 30 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Pressable onPress={() => navigation.navigate("ModeReset")} hitSlop={10}>
          <Ionicons name="arrow-back" size={30} color={theme.colors.text} />
        </Pressable>
        {hideSignUp ? <View /> : (
          <Pressable onPress={() => navigation.navigate("Register")} hitSlop={10}>
            <Text style={{ color: theme.colors.primary, fontSize: 18, fontWeight: "700" }}>Sign Up</Text>
          </Pressable>
        )}
      </View>

      <View style={{ alignItems: "center", marginTop: 22, marginBottom: 22 }}>
        <Text style={{ color: theme.colors.text, fontSize: 30, fontWeight: "900", letterSpacing: 1 }}>QLAIM</Text>
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
            color: theme.colors.primary,
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
