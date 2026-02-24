import { gql } from "@apollo/client";

import {
  COMPANY_MEMBERSHIP_REQUEST_SUMMARY_FRAGMENT,
  MEMBER_SUMMARY_FRAGMENT,
} from "./fragments";

export const COMPANY_MEMBERSHIP_REQUESTS_QUERY = gql`
  query CompanyMembershipRequests(
    $companyId: String!
    $status: MembershipRequestStatus
    $limit: Int
    $offset: Int
  ) {
    companyMembershipRequests(
      companyId: $companyId
      status: $status
      limit: $limit
      offset: $offset
    ) {
      ...CompanyMembershipRequestSummary
    }
  }
  ${COMPANY_MEMBERSHIP_REQUEST_SUMMARY_FRAGMENT}
`;

export const MY_COMPANY_MEMBERSHIP_REQUESTS_QUERY = gql`
  query MyCompanyMembershipRequests(
    $status: MembershipRequestStatus
    $limit: Int
    $offset: Int
  ) {
    myCompanyMembershipRequests(status: $status, limit: $limit, offset: $offset) {
      ...CompanyMembershipRequestSummary
    }
  }
  ${COMPANY_MEMBERSHIP_REQUEST_SUMMARY_FRAGMENT}
`;

export const REQUEST_COMPANY_MEMBERSHIP_MUTATION = gql`
  mutation RequestCompanyMembership(
    $companyId: String!
    $requestedRole: CompanyRole
    $note: String
  ) {
    requestCompanyMembership(
      companyId: $companyId
      requestedRole: $requestedRole
      note: $note
    ) {
      ...CompanyMembershipRequestSummary
    }
  }
  ${COMPANY_MEMBERSHIP_REQUEST_SUMMARY_FRAGMENT}
`;

export const APPROVE_COMPANY_MEMBERSHIP_REQUEST_MUTATION = gql`
  mutation ApproveCompanyMembershipRequest($requestId: String!, $role: CompanyRole) {
    approveCompanyMembershipRequest(requestId: $requestId, role: $role) {
      ...MemberSummary
    }
  }
  ${MEMBER_SUMMARY_FRAGMENT}
`;

export const DENY_COMPANY_MEMBERSHIP_REQUEST_MUTATION = gql`
  mutation DenyCompanyMembershipRequest($requestId: String!, $reason: String) {
    denyCompanyMembershipRequest(requestId: $requestId, reason: $reason) {
      ...CompanyMembershipRequestSummary
    }
  }
  ${COMPANY_MEMBERSHIP_REQUEST_SUMMARY_FRAGMENT}
`;
