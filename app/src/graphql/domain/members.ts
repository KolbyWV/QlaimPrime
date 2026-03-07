import { gql } from "@apollo/client";

import { MEMBER_SUMMARY_FRAGMENT } from "./fragments";

export const MEMBERS_QUERY = gql`
  query Members {
    members {
      ...MemberSummary
    }
  }
  ${MEMBER_SUMMARY_FRAGMENT}
`;

export const COMPANY_MEMBERS_QUERY = gql`
  query CompanyMembers($companyId: ID!) {
    companyMembers(companyId: $companyId) {
      ...MemberSummary
    }
  }
  ${MEMBER_SUMMARY_FRAGMENT}
`;

export const ADD_COMPANY_MEMBER_MUTATION = gql`
  mutation AddCompanyMember($companyId: ID!, $userId: ID!, $role: CompanyRole!) {
    addCompanyMember(companyId: $companyId, userId: $userId, role: $role) {
      ...MemberSummary
    }
  }
  ${MEMBER_SUMMARY_FRAGMENT}
`;

export const UPDATE_COMPANY_MEMBER_ROLE_MUTATION = gql`
  mutation UpdateCompanyMemberRole($companyId: ID!, $userId: ID!, $role: CompanyRole!) {
    updateCompanyMemberRole(companyId: $companyId, userId: $userId, role: $role) {
      ...MemberSummary
    }
  }
  ${MEMBER_SUMMARY_FRAGMENT}
`;

export const REMOVE_COMPANY_MEMBER_MUTATION = gql`
  mutation RemoveCompanyMember($companyId: ID!, $userId: ID!) {
    removeCompanyMember(companyId: $companyId, userId: $userId)
  }
`;

export const LEAVE_COMPANY_MUTATION = gql`
  mutation LeaveCompany($companyId: ID!) {
    leaveCompany(companyId: $companyId)
  }
`;
