import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useMutation, useQuery } from "@apollo/client/react";

import { useSession } from "../../auth/session";
import {
  CREATE_GIG_MUTATION,
  LOCATIONS_QUERY,
  MY_COMPANIES_QUERY,
} from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import {
  Badge,
  Body,
  Button,
  Card,
  Field,
  Heading,
  LoadingState,
  Screen,
} from "../../ui/components";

const GIG_CREATOR_ROLES = new Set(["CREATOR", "MANAGER", "OWNER"]);

const PAY_TIER_BANDS = [
  { max: 50, minimumTier: "COPPER", allowedTiers: ["COPPER"] },
  { max: 100, minimumTier: "BRONZE", allowedTiers: ["COPPER", "BRONZE"] },
  { max: 200, minimumTier: "SILVER", allowedTiers: ["COPPER", "BRONZE", "SILVER"] },
  { max: 350, minimumTier: "GOLD", allowedTiers: ["COPPER", "BRONZE", "SILVER", "GOLD"] },
  { max: 500, minimumTier: "PLATINUM", allowedTiers: ["COPPER", "BRONZE", "SILVER", "GOLD", "PLATINUM"] },
  { max: Number.POSITIVE_INFINITY, minimumTier: "DIAMOND", allowedTiers: ["COPPER", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"] },
];

function shiftDate(date, { minutes = 0, hours = 0, days = 0 } = {}) {
  return new Date(date.getTime() + minutes * 60000 + hours * 3600000 + days * 86400000);
}

function formatDateTime(date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CompanyCreateGigScreen({ navigation }) {
  const { theme } = useAppTheme();
  const { me } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payDollars, setPayDollars] = useState("");
  const [units, setUnits] = useState("");
  const [startsAt, setStartsAt] = useState(() => {
    const initial = new Date();
    initial.setSeconds(0, 0);
    initial.setMinutes(0);
    return shiftDate(initial, { hours: 1 });
  });
  const [endsAt, setEndsAt] = useState(() => shiftDate(new Date(), { hours: 5 }));
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [error, setError] = useState(null);

  const companyQuery = useQuery(MY_COMPANIES_QUERY);
  const locationsQuery = useQuery(LOCATIONS_QUERY, {
    variables: { limit: 25, offset: 0 },
  });

  const activeCompanyId = companyQuery.data?.myCompanies?.[0]?.id;
  const activeMemberRole = me?.companies?.find(
    (member) => member?.companyId === activeCompanyId,
  )?.role;
  const canCreateGig = activeCompanyId && GIG_CREATOR_ROLES.has(activeMemberRole);
  const locations = locationsQuery.data?.locations || [];

  const [createGig, { loading }] = useMutation(CREATE_GIG_MUTATION, {
    onCompleted: () => {
      navigation.goBack();
    },
    onError: (nextError) => {
      setError(nextError.message || "Unable to create gig.");
    },
  });

  const selectedLocationLabel = useMemo(() => {
    if (!selectedLocationId) {
      return "No location selected";
    }
    const selected = locations.find((item) => item.id === selectedLocationId);
    if (!selected) {
      return selectedLocationId;
    }
    return `${selected.name} (${selected.city}, ${selected.state})`;
  }, [locations, selectedLocationId]);

  if (companyQuery.loading || locationsQuery.loading) {
    return (
      <Screen>
        <LoadingState label="Loading create-gig form..." />
      </Screen>
    );
  }

  const parseCents = () => {
    if (!payDollars.trim()) {
      return null;
    }
    const parsed = Number(payDollars);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Error("Pay must be a valid positive number.");
    }
    return Math.round(parsed * 100);
  };

  const payCentsPreview = (() => {
    try {
      return parseCents();
    } catch {
      return null;
    }
  })();
  const payTierBand = (() => {
    if (payCentsPreview == null) {
      return PAY_TIER_BANDS[0];
    }
    const payDollarsValue = payCentsPreview / 100;
    return PAY_TIER_BANDS.find((band) => payDollarsValue <= band.max) || PAY_TIER_BANDS[PAY_TIER_BANDS.length - 1];
  })();

  const parseUnits = () => {
    if (!units.trim()) {
      return null;
    }
    const parsed = Number(units);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error("Units must be a whole number greater than 0.");
    }
    return parsed;
  };

  const onCreate = async (status) => {
    if (!activeCompanyId || !canCreateGig) {
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setError(null);

    try {
      if (endsAt <= startsAt) {
        throw new Error("End time must be after start time.");
      }

      await createGig({
        variables: {
          companyId: activeCompanyId,
          title: title.trim(),
          description: description.trim() || null,
          type: "STANDARD",
          locationId: selectedLocationId || null,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          payCents: parseCents(),
          units: parseUnits(),
          status,
        },
      });
    } catch (nextError) {
      setError(nextError.message || "Unable to create gig.");
    }
  };

  const updateStart = (nextStart) => {
    setStartsAt(nextStart);
    if (endsAt <= nextStart) {
      setEndsAt(shiftDate(nextStart, { hours: 2 }));
    }
  };

  return (
    <Screen scroll>
      <Heading>Create gig</Heading>
      <Body style={{ marginBottom: 12 }}>
        Create work for {companyQuery.data?.myCompanies?.[0]?.name || "your company"}.
      </Body>

      {!activeCompanyId ? (
        <Card>
          <Body>Join or create a company to publish gigs.</Body>
        </Card>
      ) : !canCreateGig ? (
        <Card>
          <Body>
            Your role is {activeMemberRole || "UNKNOWN"}. Only CREATOR, MANAGER, or OWNER can create gigs.
          </Body>
        </Card>
      ) : (
        <Card>
          <Field
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Stock shelves at Main Street store"
          />
          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Optional details for assignees"
          />
          <Field
            label="Pay (USD)"
            value={payDollars}
            onChangeText={setPayDollars}
            placeholder="e.g. 45.00"
          />
          <Body style={{ marginBottom: 10 }}>
            Server tiering from pay: {payTierBand.allowedTiers.join(" + ")} (minimum {payTierBand.minimumTier})
          </Body>
          <Field
            label="Units"
            value={units}
            onChangeText={setUnits}
            placeholder="e.g. 3"
          />

          <Heading style={{ fontSize: 18 }}>Starts at</Heading>
          <Body style={{ marginBottom: 8 }}>{formatDateTime(startsAt)}</Body>
          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Button label="-1 hr" variant="secondary" onPress={() => updateStart(shiftDate(startsAt, { hours: -1 }))} />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Button label="+1 hr" variant="secondary" onPress={() => updateStart(shiftDate(startsAt, { hours: 1 }))} />
            </View>
          </View>
          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Button label="-1 day" variant="secondary" onPress={() => updateStart(shiftDate(startsAt, { days: -1 }))} />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Button label="+1 day" variant="secondary" onPress={() => updateStart(shiftDate(startsAt, { days: 1 }))} />
            </View>
          </View>
          <Button
            label="Set start to now"
            variant="secondary"
            onPress={() => {
              const now = new Date();
              now.setSeconds(0, 0);
              updateStart(now);
            }}
          />

          <Heading style={{ fontSize: 18 }}>Ends at</Heading>
          <Body style={{ marginBottom: 8 }}>{formatDateTime(endsAt)}</Body>
          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Button label="-1 hr" variant="secondary" onPress={() => setEndsAt((prev) => shiftDate(prev, { hours: -1 }))} />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Button label="+1 hr" variant="secondary" onPress={() => setEndsAt((prev) => shiftDate(prev, { hours: 1 }))} />
            </View>
          </View>
          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Button label="2 hrs after start" variant="secondary" onPress={() => setEndsAt(shiftDate(startsAt, { hours: 2 }))} />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Button label="8 hrs after start" variant="secondary" onPress={() => setEndsAt(shiftDate(startsAt, { hours: 8 }))} />
            </View>
          </View>

          <Heading style={{ fontSize: 18 }}>Location</Heading>
          <Body style={{ marginBottom: 8 }}>Selected: {selectedLocationLabel}</Body>
          <Button
            label="No location"
            variant={selectedLocationId ? "secondary" : "primary"}
            onPress={() => setSelectedLocationId(null)}
          />
          {locationsQuery.error ? (
            <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>
              {locationsQuery.error.message}
            </Text>
          ) : null}
          {locations.map((location) => (
            <Card key={location.id} style={{ marginTop: 0 }}>
              <Badge label={location.id === selectedLocationId ? "Selected" : "Location"} />
              <Heading style={{ fontSize: 17, marginTop: 10 }}>{location.name}</Heading>
              <Body>{location.address}</Body>
              <Body>
                {location.city}, {location.state} {location.zipcode}
              </Body>
              <Button
                label={location.id === selectedLocationId ? "Keep selected" : "Use this location"}
                variant={location.id === selectedLocationId ? "primary" : "secondary"}
                onPress={() => setSelectedLocationId(location.id)}
              />
            </Card>
          ))}

          {error ? (
            <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>{error}</Text>
          ) : null}

          <Button
            label="Create as Draft"
            loading={loading}
            disabled={!title.trim()}
            onPress={() => onCreate("DRAFT")}
          />
          <Button
            label="Create & Open"
            variant="secondary"
            loading={loading}
            disabled={!title.trim()}
            onPress={() => onCreate("OPEN")}
          />
        </Card>
      )}
    </Screen>
  );
}
