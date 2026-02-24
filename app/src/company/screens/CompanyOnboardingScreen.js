import React, { useLayoutEffect, useState } from "react";
import { Pressable, Text } from "react-native";
import { useMutation, useQuery } from "@apollo/client/react";

import { useSession } from "../../auth/session";
import {
  COMPANY_DIRECTORY_QUERY,
  CREATE_COMPANY_MUTATION,
  MY_COMPANY_MEMBERSHIP_REQUESTS_QUERY,
  REQUEST_COMPANY_MEMBERSHIP_MUTATION,
} from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import { Body, Button, Card, Field, Heading, Screen } from "../../ui/components";

export function CompanyOnboardingScreen({ navigation }) {
  const { theme } = useAppTheme();
  const { me, refreshMe, signOut } = useSession();
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [search, setSearch] = useState("");
  const [createError, setCreateError] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [joinMessage, setJoinMessage] = useState(null);
  const normalizedSearch = search.trim();

  const companiesQuery = useQuery(COMPANY_DIRECTORY_QUERY, {
    variables: {
      search: normalizedSearch || null,
      limit: 25,
      offset: 0,
    },
  });
  const myRequestsQuery = useQuery(MY_COMPANY_MEMBERSHIP_REQUESTS_QUERY, {
    variables: {
      limit: 100,
      offset: 0,
    },
  });

  const [createCompany, { loading }] = useMutation(CREATE_COMPANY_MUTATION, {
    onCompleted: () => {
      refreshMe();
    },
    onError: (nextError) => {
      setCreateError(nextError.message || "Failed to create company.");
    },
  });
  const [requestMembership, { loading: requesting }] = useMutation(REQUEST_COMPANY_MEMBERSHIP_MUTATION, {
    onCompleted: async () => {
      setJoinError(null);
      setJoinMessage("Membership request submitted. An owner must approve or deny.");
      await myRequestsQuery.refetch();
    },
    onError: (nextError) => {
      setJoinError(nextError.message || "Failed to send membership request.");
    },
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={signOut} hitSlop={10}>
          <Text style={{ color: theme.colors.primary, fontSize: 15, fontWeight: "600" }}>Log out</Text>
        </Pressable>
      ),
    });
  }, [navigation, signOut, theme.colors.primary]);

  const onCreate = async () => {
    setCreateError(null);

    try {
      await createCompany({
        variables: {
          name,
          logoUrl: logoUrl || null,
        },
      });
    } catch {
      // handled by onError
    }
  };

  const onRequestMembership = async (companyId) => {
    if (!me?.id || !companyId) {
      return;
    }

    setJoinError(null);
    setJoinMessage(null);

    try {
      await requestMembership({
        variables: {
          companyId,
          requestedRole: "APPROVER",
        },
      });
    } catch {
      // handled by onError
    }
  };

  const companies = companiesQuery.data?.companyDirectory || [];
  const myCompanyIds = new Set((me?.companies || []).map((membership) => membership.companyId));
  const latestRequestByCompanyId = new Map();
  (myRequestsQuery.data?.myCompanyMembershipRequests || []).forEach((request) => {
    if (!latestRequestByCompanyId.has(request.companyId)) {
      latestRequestByCompanyId.set(request.companyId, request);
    }
  });

  return (
    <Screen scroll>
      <Heading>Join or create company</Heading>
      <Body style={{ marginBottom: 12 }}>
        Company mode requires membership. Create a company or request to join one.
      </Body>

      <Card>
        <Field label="Company name" value={name} onChangeText={setName} placeholder="Prime Staffing" />
        <Field
          label="Logo URL (optional)"
          value={logoUrl}
          onChangeText={setLogoUrl}
          placeholder="https://example.com/logo.png"
        />

        {createError ? <Text style={{ color: theme.colors.danger }}>{createError}</Text> : null}

        <Button label="Create company" onPress={onCreate} loading={loading} disabled={!name} />
      </Card>

      <Card>
        <Heading style={{ fontSize: 21 }}>Request membership</Heading>
        <Body style={{ marginBottom: 10 }}>
          Search a company and request access. Company owners can approve or deny in the Members tab.
        </Body>
        <Field
          label="Search company"
          value={search}
          onChangeText={setSearch}
          placeholder="Type company name"
        />

        {companiesQuery.error ? (
          <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>{companiesQuery.error.message}</Text>
        ) : null}
        {myRequestsQuery.error ? (
          <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>{myRequestsQuery.error.message}</Text>
        ) : null}
        {joinError ? (
          <Text style={{ color: theme.colors.danger, marginBottom: 10 }}>{joinError}</Text>
        ) : null}
        {joinMessage ? (
          <Text style={{ color: theme.colors.success, marginBottom: 10 }}>{joinMessage}</Text>
        ) : null}

        {companiesQuery.loading ? (
          <Body style={{ marginBottom: 10 }}>Loading companies...</Body>
        ) : null}

        {companies.map((company) => {
          const alreadyMember = myCompanyIds.has(company.id);
          const request = latestRequestByCompanyId.get(company.id);
          const requestStatus = request?.status || null;
          const pending = requestStatus === "PENDING";
          const denied = requestStatus === "DENIED";
          const approved = requestStatus === "APPROVED";

          return (
            <Card key={company.id} style={{ marginTop: 0 }}>
              <Heading style={{ fontSize: 19 }}>{company.name}</Heading>
              <Body style={{ marginBottom: 10 }}>ID: {company.id}</Body>
              {pending ? (
                <Body style={{ marginBottom: 10 }}>
                  Pending since {request.createdAt || "-"}.
                </Body>
              ) : denied ? (
                <Body style={{ marginBottom: 10 }}>
                  Last request was denied{request.resolvedNote ? `: ${request.resolvedNote}` : "."}
                </Body>
              ) : approved ? (
                <Body style={{ marginBottom: 10 }}>
                  Request approved. Tap "Check membership status" to refresh.
                </Body>
              ) : null}
              <Button
                label={
                  alreadyMember
                    ? "Already a member"
                    : pending
                      ? "Pending approval"
                      : denied
                        ? "Request again"
                        : approved
                          ? "Approved - refresh status"
                          : "Request membership"
                }
                variant="secondary"
                disabled={alreadyMember || pending || approved || requesting}
                loading={requesting}
                onPress={() => onRequestMembership(company.id)}
              />
            </Card>
          );
        })}

        {!companiesQuery.loading && !companies.length ? (
          <Body>No companies matched your search.</Body>
        ) : null}

        <Button
          label="Check membership status"
          variant="secondary"
          onPress={async () => {
            await Promise.all([refreshMe(), myRequestsQuery.refetch()]);
          }}
        />
      </Card>
    </Screen>
  );
}
