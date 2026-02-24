import React, { useState } from "react";
import { Text } from "react-native";

import { useSession } from "../session";
import { useAppTheme } from "../../ui/theme";
import { Body, Button, Card, Field, Heading, Screen } from "../../ui/components";

export function SignInScreen({ navigation }) {
  const { theme } = useAppTheme();
  const { signIn, mode } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <Screen scroll>
      <Heading>Sign in</Heading>
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
          placeholder="Enter password"
        />

        {error ? (
          <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>{error}</Text>
        ) : null}

        <Button label="Sign in" onPress={onSubmit} loading={loading} disabled={!email || !password} />
        <Button
          label="Create an account"
          variant="secondary"
          onPress={() => navigation.navigate("Register")}
        />
        <Button label="Switch mode" variant="secondary" onPress={() => navigation.navigate("ModeReset")} />
      </Card>
    </Screen>
  );
}
