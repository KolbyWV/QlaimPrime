import React, { useState } from "react";
import { Text } from "react-native";
import { useMutation } from "@apollo/client/react";

import { useSession } from "../../auth/session";
import { CREATE_PROFILE_MUTATION } from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import { Body, Button, Card, Field, Heading, Screen } from "../../ui/components";

export function WorkerOnboardingScreen() {
  const { theme } = useAppTheme();
  const { refreshMe } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [error, setError] = useState(null);

  const [createProfile, { loading }] = useMutation(CREATE_PROFILE_MUTATION, {
    onCompleted: () => {
      refreshMe();
    },
    onError: (nextError) => {
      setError(nextError.message || "Failed to create profile.");
    },
  });

  const onCreate = async () => {
    setError(null);
    try {
      await createProfile({
        variables: {
          firstName,
          lastName,
          username,
          zipcode,
        },
      });
    } catch {
      // handled by onError
    }
  };

  return (
    <Screen scroll>
      <Heading>Complete profile</Heading>
      <Body style={{ marginBottom: 12 }}>
        Profile mode requires this setup before entering your tabs.
      </Body>

      <Card>
        <Field
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Jane"
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
        />
        <Field
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Doe"
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
        />
        <Field label="Username" value={username} onChangeText={setUsername} placeholder="janedoe" />
        <Field label="Zipcode" value={zipcode} onChangeText={setZipcode} placeholder="73104" />

        {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}

        <Button
          label="Create profile"
          onPress={onCreate}
          loading={loading}
          disabled={!firstName || !lastName || !username || !zipcode}
        />
      </Card>
    </Screen>
  );
}
