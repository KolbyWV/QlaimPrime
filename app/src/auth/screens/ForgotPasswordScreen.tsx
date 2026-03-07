import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useMutation } from "@apollo/client/react";
import { Ionicons } from "@expo/vector-icons";

import { useSession } from "../session";
import { REQUEST_PASSWORD_RESET_MUTATION } from "../../graphql/domain";
import { Body, Button, Field, Heading, Screen } from "../../ui/components";
import { useAppTheme } from "../../ui/theme";

export function ForgotPasswordScreen({ navigation }) {
  const { theme } = useAppTheme();
  const { mode } = useSession();
  const modeLabel = mode === "company" ? "COMPANY PORTAL" : (mode === "admin" ? "ADMIN PORTAL" : "CONTRACTOR PORTAL");
  const modeBadgeBg = mode === "company" ? "#d6e7ff" : (mode === "admin" ? theme.colors.strongSurface : theme.colors.accentSoft);
  const modeBadgeText = mode === "company" ? "#023e8a" : (mode === "admin" ? theme.colors.strongSurfaceText : theme.colors.strongSurface);
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  const [requestReset, { loading }] = useMutation(REQUEST_PASSWORD_RESET_MUTATION, {
    onCompleted: () => {
      setError(null);
      setSuccessMessage("If the email exists, we sent reset instructions.");
    },
    onError: (nextError) => {
      setError(nextError.message || "Unable to send reset email.");
      setSuccessMessage(null);
    },
  });

  return (
    <Screen hideBack scroll contentStyle={{ paddingTop: 8, paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ width: 40, marginBottom: 10 }}>
        <Ionicons name="arrow-back" size={30} color={theme.colors.text} />
      </Pressable>

      <Image
        source={require("../../images/logos/QlaimBig.png")}
        style={{ width: 140, height: 140, alignSelf: "center", marginBottom: 16 }}
        resizeMode="contain"
      />
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <View
          style={{
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

      <Heading style={{ fontSize: 30, marginBottom: 4 }}>Forgot Password</Heading>
      <Body style={{ fontSize: 16, marginBottom: 18 }}>
        Enter the email address with your account and we'll send an email with confirmation to reset your
        password.
      </Body>

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        rightAdornment={<Ionicons name="person-outline" size={24} color={theme.colors.text} />}
      />

      {error ? <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>{error}</Text> : null}
      {successMessage ? <Text style={{ color: theme.colors.success, marginBottom: 10 }}>{successMessage}</Text> : null}

      <Button
        label={loading ? "Sending..." : "Send Email"}
        loading={loading}
        onPress={() => requestReset({ variables: { email: email.trim() } })}
        disabled={!email.trim()}
        style={{ minHeight: 56 }}
      />
    </Screen>
  );
}
