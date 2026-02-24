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
  query CompanyMembers($companyId: String!) {
    companyMembers(companyId: $companyId) {
      ...MemberSummary
    }
  }
  ${MEMBER_SUMMARY_FRAGMENT}
`;

export const ADD_COMPANY_MEMBER_MUTATION = gql`
  mutation AddCompanyMember($companyId: String!, $userId: String!, $role: CompanyRole!) {
    addCompanyMember(companyId: $companyId, userId: $userId, role: $role) {
      ...MemberSummary
    }
  }
  ${MEMBER_SUMMARY_FRAGMENT}
`;

export const UPDATE_COMPANY_MEMBER_ROLE_MUTATION = gql`
  mutation UpdateCompanyMemberRole($companyId: String!, $userId: String!, $role: CompanyRole!) {
    updateCompanyMemberRole(companyId: $companyId, userId: $userId, role: $role) {
      ...MemberSummary
    }
  }
  ${MEMBER_SUMMARY_FRAGMENT}
`;

export const REMOVE_COMPANY_MEMBER_MUTATION = gql`
  mutation RemoveCompanyMember($companyId: String!, $userId: String!) {
    removeCompanyMember(companyId: $companyId, userId: $userId)
  }
`;

export const LEAVE_COMPANY_MUTATION = gql`
  mutation LeaveCompany($companyId: String!) {
    leaveCompany(companyId: $companyId)
  }
`;
