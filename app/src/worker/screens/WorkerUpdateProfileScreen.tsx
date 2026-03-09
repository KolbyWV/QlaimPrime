import React, { useMemo, useState } from "react";
import { Image, Text, View } from "react-native";
import { useMutation } from "@apollo/client/react";
import * as ImagePicker from "expo-image-picker";

import { useSession } from "../../auth/session";
import { CREATE_IMAGE_UPLOAD_URL_MUTATION, UPDATE_PROFILE_MUTATION } from "../../graphql/domain";
import { Button, Card, Field, Heading, Screen } from "../../ui/components";
import { useAppTheme } from "../../ui/theme";
import { uploadImageWithPresignedUrl } from "../../utils/imageUpload";

export function WorkerUpdateProfileScreen({ navigation }) {
  const { me, refreshMe } = useSession();
  const { theme } = useAppTheme();
  const profile = me?.profile;
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [zipcode, setZipcode] = useState(profile?.zipcode || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [createImageUploadUrl, { loading: uploadingAvatar }] = useMutation(
    CREATE_IMAGE_UPLOAD_URL_MUTATION,
  );
  const [updateProfile, { loading: savingProfile }] = useMutation(UPDATE_PROFILE_MUTATION);

  const hasChanges = useMemo(() => {
    return (
      (firstName || "") !== (profile?.firstName || "") ||
      (lastName || "") !== (profile?.lastName || "") ||
      (username || "") !== (profile?.username || "") ||
      (zipcode || "") !== (profile?.zipcode || "") ||
      (avatarUrl || "") !== (profile?.avatarUrl || "")
    );
  }, [avatarUrl, firstName, lastName, profile?.avatarUrl, profile?.firstName, profile?.lastName, profile?.username, profile?.zipcode, username, zipcode]);

  return (
    <Screen scroll>
      <Heading>Update profile</Heading>

      <Card>
        <Field label="First name" value={firstName} onChangeText={setFirstName} placeholder="Jane" />
        <Field label="Last name" value={lastName} onChangeText={setLastName} placeholder="Doe" />
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
          Profile photo
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
                backgroundColor: theme.colors.surfaceAlt,
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
              setSuccess(null);
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                setError("Photo library permission is required to upload an avatar.");
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                allowsEditing: true,
                quality: 0.85,
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
              setError(nextError?.message || "Unable to upload avatar right now.");
            }
          }}
        />

        {error ? <Text style={{ color: theme.colors.danger, marginBottom: 8 }}>{error}</Text> : null}
        {success ? <Text style={{ color: theme.colors.primary, marginBottom: 8 }}>{success}</Text> : null}

        <Button
          label={savingProfile ? "Saving..." : "Save changes"}
          loading={savingProfile}
          disabled={!firstName || !lastName || !username || !zipcode || !hasChanges}
          onPress={async () => {
            try {
              setError(null);
              setSuccess(null);
              await updateProfile({
                variables: {
                  firstName: firstName.trim(),
                  lastName: lastName.trim(),
                  username: username.trim(),
                  zipcode: zipcode.trim(),
                  avatarUrl: avatarUrl.trim() || null,
                },
              });
              await refreshMe();
              setSuccess("Profile updated.");
              navigation.goBack();
            } catch (nextError) {
              setError(nextError?.message || "Unable to update profile right now.");
            }
          }}
        />
      </Card>
    </Screen>
  );
}
