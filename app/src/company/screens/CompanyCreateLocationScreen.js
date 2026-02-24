import React, { useState } from "react";
import { Text } from "react-native";
import { useMutation, useQuery } from "@apollo/client/react";

import { useSession } from "../../auth/session";
import {
  CREATE_LOCATION_MUTATION,
  MY_COMPANIES_QUERY,
} from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import { Body, Button, Card, Field, Heading, LoadingState, Screen } from "../../ui/components";

const LOCATION_CREATOR_ROLES = new Set(["CREATOR", "MANAGER", "OWNER"]);

async function geocodeAddress({ address, city, state, zipcode }) {
  const query = [address, city, state, zipcode, "USA"]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");

  if (!query) {
    return null;
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Unable to geocode address right now.");
  }

  const payload = await response.json();
  const match = Array.isArray(payload) ? payload[0] : null;

  if (!match?.lat || !match?.lon) {
    return null;
  }

  const lat = Number(match.lat);
  const lng = Number(match.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

export function CompanyCreateLocationScreen({ navigation }) {
  const { theme } = useAppTheme();
  const { me } = useSession();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [error, setError] = useState(null);

  const companyQuery = useQuery(MY_COMPANIES_QUERY);
  const activeCompanyId = companyQuery.data?.myCompanies?.[0]?.id;
  const activeMemberRole = me?.companies?.find(
    (member) => member?.companyId === activeCompanyId,
  )?.role;
  const canCreateLocation = activeCompanyId && LOCATION_CREATOR_ROLES.has(activeMemberRole);

  const [createLocation, { loading }] = useMutation(CREATE_LOCATION_MUTATION, {
    onCompleted: () => {
      navigation.goBack();
    },
    onError: (nextError) => {
      setError(nextError.message || "Unable to create location.");
    },
  });

  if (companyQuery.loading) {
    return (
      <Screen>
        <LoadingState label="Loading create-location form..." />
      </Screen>
    );
  }

  const onCreate = async () => {
    if (!canCreateLocation) {
      return;
    }
    if (!name.trim() || !address.trim() || !city.trim() || !state.trim() || !zipcode.trim()) {
      setError("Name, address, city, state, and zipcode are required.");
      return;
    }

    setError(null);

    try {
      let resolvedLat = null;
      let resolvedLng = null;

      // Best-effort geocode: if provider is unavailable, do not block location creation.
      try {
        const coords = await geocodeAddress({
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zipcode: zipcode.trim(),
        });
        if (coords) {
          resolvedLat = coords.lat;
          resolvedLng = coords.lng;
        }
      } catch {
        resolvedLat = null;
        resolvedLng = null;
      }

      await createLocation({
        variables: {
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zipcode: zipcode.trim(),
          lat: resolvedLat,
          lng: resolvedLng,
        },
      });
    } catch (nextError) {
      setError(nextError.message || "Unable to create location.");
    }
  };

  return (
    <Screen scroll>
      <Heading>Create location</Heading>
      <Body style={{ marginBottom: 12 }}>
        Add a reusable location for future gigs.
      </Body>

      {!activeCompanyId ? (
        <Card>
          <Body>Join or create a company to add locations.</Body>
        </Card>
      ) : !canCreateLocation ? (
        <Card>
          <Body>
            Your role is {activeMemberRole || "UNKNOWN"}. Only CREATOR, MANAGER, or OWNER can create locations.
          </Body>
        </Card>
      ) : (
        <Card>
          <Field label="Name" value={name} onChangeText={setName} placeholder="Warehouse A" />
          <Field label="Address" value={address} onChangeText={setAddress} placeholder="123 Main St" />
          <Field label="City" value={city} onChangeText={setCity} placeholder="Austin" />
          <Field label="State" value={state} onChangeText={setState} placeholder="TX" />
          <Field label="Zipcode" value={zipcode} onChangeText={setZipcode} placeholder="78701" />
          <Body style={{ marginBottom: 10 }}>
            Latitude and longitude are resolved automatically in the background from address details.
          </Body>

          {companyQuery.error ? (
            <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>{companyQuery.error.message}</Text>
          ) : null}
          {error ? (
            <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>{error}</Text>
          ) : null}

          <Button
            label="Create location"
            loading={loading}
            disabled={!name.trim() || !address.trim() || !city.trim() || !state.trim() || !zipcode.trim()}
            onPress={onCreate}
          />
        </Card>
      )}
    </Screen>
  );
}
