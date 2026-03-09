import React, { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import * as ImagePicker from "expo-image-picker";

import { useSession } from "../../auth/session";
import {
  CREATE_IMAGE_UPLOAD_URL_MUTATION,
  MY_COMPANIES_QUERY,
  UPDATE_COMPANY_MUTATION,
} from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import { Badge, Body, Button, Card, Heading, Screen } from "../../ui/components";
import { uploadImageWithPresignedUrl } from "../../utils/imageUpload";

export function CompanyAccountScreen() {
  const { me, switchMode, signOut, refreshMe } = useSession();
  const { theme, themeMode, toggleThemeMode } = useAppTheme();
  const companyQuery = useQuery(MY_COMPANIES_QUERY);
  const activeCompany = companyQuery.data?.myCompanies?.[0];
  const [createImageUploadUrl, { loading: uploadingLogo }] = useMutation(
    CREATE_IMAGE_UPLOAD_URL_MUTATION,
  );
  const [updateCompany, { loading: updatingCompany }] = useMutation(UPDATE_COMPANY_MUTATION, {
    onCompleted: async () => {
      await Promise.all([companyQuery.refetch(), refreshMe()]);
    },
  });

  const membershipCount = me?.companies?.length || 0;
  const canAccessAdmin = me?.role === "ADMIN";
  const [accountError, setAccountError] = useState(null);

  return (
    <Screen hideBack scroll>
      <Heading>Company account</Heading>
      <Body style={{ marginBottom: 12 }}>Switch modes, theme, or session.</Body>

      <Card>
        <Badge label="User" />
        <Heading style={{ fontSize: 22, marginTop: 10 }}>{me?.email || "No email"}</Heading>
        <Body>Memberships: {membershipCount}</Body>
      </Card>

      <Card>
        <Button
          label={uploadingLogo || updatingCompany ? "Updating logo..." : "Upload Company Logo"}
          variant="secondary"
          loading={uploadingLogo || updatingCompany}
          disabled={!activeCompany?.id}
          onPress={async () => {
            try {
              setAccountError(null);
              if (!activeCompany?.id) return;
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                setAccountError("Photo library permission is required to upload a logo.");
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
                folder: "companies/logos",
                createImageUploadUrl,
              });
              await updateCompany({
                variables: {
                  companyId: activeCompany.id,
                  logoUrl: uploadedUrl,
                },
              });
            } catch (nextError) {
              setAccountError(nextError?.message || "Unable to upload company logo right now.");
            }
          }}
        />
        <Button label="Switch to Contractor Mode" onPress={() => switchMode("worker")} />
        {canAccessAdmin ? (
          <Button label="Switch to Admin Mode" variant="secondary" onPress={() => switchMode("admin")} />
        ) : null}
        <Button
          label={themeMode === "dark" ? "Use Light Theme" : "Use Dark Theme"}
          variant="secondary"
          onPress={toggleThemeMode}
        />
        <Button label="Sign out" variant="secondary" onPress={signOut} />
        {accountError ? <Body style={{ color: theme.colors.danger, marginBottom: 0 }}>{accountError}</Body> : null}
      </Card>
    </Screen>
  );
}
