import React, { useState } from "react";
import { Text } from "react-native";
import { useMutation, useQuery } from "@apollo/client/react";

import { useSession } from "../../auth/session";
import {
  APPROVE_COMPANY_MEMBERSHIP_REQUEST_MUTATION,
  COMPANY_MEMBERSHIP_REQUESTS_QUERY,
  COMPANY_MEMBERS_QUERY,
  DENY_COMPANY_MEMBERSHIP_REQUEST_MUTATION,
  MY_COMPANIES_QUERY,
} from "../../graphql/domain";
import { useAppTheme } from "../../ui/theme";
import { Body, Button, Card, Heading, LoadingState, Screen } from "../../ui/components";

export function CompanyMembersScreen() {
  const { theme } = useAppTheme();
  const { me, refreshMe } = useSession();
  const [actionError, setActionError] = useState(null);
  const companyQuery = useQuery(MY_COMPANIES_QUERY);

  const companyId = companyQuery.data?.myCompanies?.[0]?.id;
  const myRole = me?.companies?.find((item) => item?.companyId === companyId)?.role;
  const canModerate = myRole === "OWNER";

  const membersQuery = useQuery(COMPANY_MEMBERS_QUERY, {
    variables: { companyId },
    skip: !companyId,
  });
  const requestsQuery = useQuery(COMPANY_MEMBERSHIP_REQUESTS_QUERY, {
    variables: {
      companyId,
      status: "PENDING",
      limit: 100,
      offset: 0,
    },
    skip: !companyId || !canModerate,
  });

  const [approveRequest, { loading: approving }] = useMutation(APPROVE_COMPANY_MEMBERSHIP_REQUEST_MUTATION, {
    onCompleted: async () => {
      setActionError(null);
      await Promise.all([membersQuery.refetch(), requestsQuery.refetch(), refreshMe()]);
    },
    onError: (nextError) => {
      setActionError(nextError.message || "Unable to approve request.");
    },
  });
  const [denyRequest, { loading: denying }] = useMutation(DENY_COMPANY_MEMBERSHIP_REQUEST_MUTATION, {
    onCompleted: async () => {
      setActionError(null);
      await Promise.all([membersQuery.refetch(), requestsQuery.refetch(), refreshMe()]);
    },
    onError: (nextError) => {
      setActionError(nextError.message || "Unable to deny request.");
    },
  });

  if (companyQuery.loading || membersQuery.loading || requestsQuery.loading) {
    return (
      <Screen>
        <LoadingState label="Loading members..." />
      </Screen>
    );
  }

  const members = membersQuery.data?.companyMembers || [];
  const pendingRequests = requestsQuery.data?.companyMembershipRequests || [];

  return (
    <Screen scroll>
      <Heading>Members</Heading>
      <Body style={{ marginBottom: 12 }}>
        Membership requests and active company members.
      </Body>
      <Body style={{ marginBottom: 12 }}>Your role: {myRole || "UNKNOWN"}</Body>

      {companyQuery.error ? <Text style={{ color: theme.colors.danger }}>{companyQuery.error.message}</Text> : null}
      {membersQuery.error ? <Text style={{ color: theme.colors.danger }}>{membersQuery.error.message}</Text> : null}
      {canModerate && requestsQuery.error ? <Text style={{ color: theme.colors.danger }}>{requestsQuery.error.message}</Text> : null}
      {actionError ? <Text style={{ color: theme.colors.danger }}>{actionError}</Text> : null}

      {canModerate ? (
        <>
          <Card>
            <Heading style={{ fontSize: 20 }}>Pending requests</Heading>
            <Body style={{ marginBottom: 8 }}>
              Owner review queue for incoming membership requests.
            </Body>
          </Card>

          {pendingRequests.map((request) => (
            <Card key={request.id}>
              <Heading style={{ fontSize: 20 }}>{request.user?.email || request.userId}</Heading>
              <Body>Requested role: {request.requestedRole}</Body>
              <Body>Requested: {request.createdAt || "-"}</Body>
              {request.note ? <Body>Note: {request.note}</Body> : null}
              <Button
                label="Approve as Approver"
                loading={approving}
                onPress={() =>
                  approveRequest({
                    variables: {
                      requestId: request.id,
                      role: "APPROVER",
                    },
                  })
                }
              />
              <Button
                label="Approve as Manager"
                variant="secondary"
                loading={approving}
                onPress={() =>
                  approveRequest({
                    variables: {
                      requestId: request.id,
                      role: "MANAGER",
                    },
                  })
                }
              />
              <Button
                label="Deny request"
                variant="secondary"
                loading={denying}
                onPress={() =>
                  denyRequest({
                    variables: {
                      requestId: request.id,
                    },
                  })
                }
              />
            </Card>
          ))}

          {!pendingRequests.length ? (
            <Card>
              <Body>No pending membership requests.</Body>
            </Card>
          ) : null}
        </>
      ) : (
        <Card>
          <Body>Only owners can view and process pending requests.</Body>
        </Card>
      )}

      <Card>
        <Heading style={{ fontSize: 20 }}>Current members</Heading>
      </Card>

      {members.map((member) => (
        <Card key={member.id}>
          <Heading style={{ fontSize: 20 }}>{member.user?.email || member.userId}</Heading>
          <Body>Role: {member.role}</Body>
          <Body>Joined: {member.createdAt || "-"}</Body>
        </Card>
      ))}

      {!members.length ? (
        <Card>
          <Body>No members in this company yet.</Body>
        </Card>
      ) : null}
    </Screen>
  );
}
