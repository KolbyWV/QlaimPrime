import React, { useState } from "react";
import { Text } from "react-native";

import { useSession } from "../session";
import { useAppTheme } from "../../ui/theme";
import { Body, Button, Card, Field, Heading, Screen } from "../../ui/components";

export function RegisterScreen({ navigation }) {
  const { theme } = useAppTheme();
  const { register, mode } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    <Screen scroll>
      <Heading>Create account</Heading>
      <Body style={{ marginBottom: 12 }}>
        Mode selected: {mode === "company" ? "Company" : "Profile"}
      </Body>

      <Card>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@company.com"
          autoCapitalize="none"
        />

        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Create password"
        />

        <Field
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Re-enter password"
        />

        {error ? (
          <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>{error}</Text>
        ) : null}

        <Button
          label="Register"
          onPress={onSubmit}
          loading={loading}
          disabled={!email || !password || !confirmPassword}
        />
        <Button label="Already have an account" variant="secondary" onPress={() => navigation.goBack()} />
      </Card>
    </Screen>
  );
}
