import React, { useState } from "react";
import { Image, Text, View } from "react-native";
import { useMutation } from "@apollo/client/react";
import * as ImagePicker from "expo-image-picker";

import { useSession } from "../../auth/session";
import { CREATE_IMAGE_UPLOAD_URL_MUTATION, CREATE_PROFILE_MUTATION } from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import { Body, Button, Card, Field, Heading, Screen } from "../../ui/components";
import { uploadImageWithPresignedUrl } from "../../utils/imageUpload";

export function WorkerOnboardingScreen() {
  const { theme } = useAppTheme();
  const { refreshMe } = useSession();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState(null);

  const [createProfile, { loading }] = useMutation(CREATE_PROFILE_MUTATION, {
    onCompleted: () => {
      refreshMe();
    },
    onError: (nextError) => {
      setError(nextError.message || "Failed to create profile.");
    },
  });
  const [createImageUploadUrl, { loading: uploadingAvatar }] = useMutation(
    CREATE_IMAGE_UPLOAD_URL_MUTATION,
  );

  const onCreate = async () => {
    setError(null);
    try {
      await createProfile({
        variables: {
          firstName,
          lastName,
          username,
          zipcode,
          avatarUrl: avatarUrl || null,
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
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 20,
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          Profile photo (optional)
        </Text>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            />
          ) : (
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card,
              }}
            />
          )}
        </View>
        <Button
          label={uploadingAvatar ? "Uploading avatar..." : "Upload Avatar"}
          variant="secondary"
          loading={uploadingAvatar}
          onPress={async () => {
            try {
              setError(null);
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                setError("Photo library permission is required to upload an avatar.");
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                allowsEditing: true,
                quality: 0.8,
              });
              if (result.canceled || !result.assets?.[0]?.uri) return;
              const uploadedUrl = await uploadImageWithPresignedUrl({
                localUri: result.assets[0].uri,
                bucket: "PUBLIC",
                folder: "users/avatars",
                createImageUploadUrl,
              });
              setAvatarUrl(uploadedUrl);
            } catch (nextError) {
              setError(nextError?.message || "Unable to upload avatar.");
            }
          }}
        />

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
