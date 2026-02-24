import { gql } from "@apollo/client";

import {
  COMPANY_SUMMARY_FRAGMENT,
  MEMBER_SUMMARY_FRAGMENT,
} from "./fragments";

export const COMPANIES_QUERY = gql`
  query Companies {
    companies {
      ...CompanySummary
    }
  }
  ${COMPANY_SUMMARY_FRAGMENT}
`;

export const COMPANY_DIRECTORY_QUERY = gql`
  query CompanyDirectory($search: String, $limit: Int, $offset: Int) {
    companyDirectory(search: $search, limit: $limit, offset: $offset) {
      ...CompanySummary
    }
  }
  ${COMPANY_SUMMARY_FRAGMENT}
`;

export const MY_COMPANIES_QUERY = gql`
  query MyCompanies {
    myCompanies {
      ...CompanySummary
    }
  }
  ${COMPANY_SUMMARY_FRAGMENT}
`;

export const COMPANY_QUERY = gql`
  query Company($id: String!) {
    company(id: $id) {
      ...CompanySummary
      members {
        ...MemberSummary
      }
    }
  }
  ${COMPANY_SUMMARY_FRAGMENT}
  ${MEMBER_SUMMARY_FRAGMENT}
`;

export const CREATE_COMPANY_MUTATION = gql`
  mutation CreateCompany($name: String!, $logoUrl: String) {
    createCompany(name: $name, logoUrl: $logoUrl) {
      ...CompanySummary
    }
  }
  ${COMPANY_SUMMARY_FRAGMENT}
`;

export const UPDATE_COMPANY_MUTATION = gql`
  mutation UpdateCompany($companyId: String!, $name: String, $logoUrl: String) {
    updateCompany(companyId: $companyId, name: $name, logoUrl: $logoUrl) {
      ...CompanySummary
    }
  }
  ${COMPANY_SUMMARY_FRAGMENT}
`;

export const DELETE_COMPANY_MUTATION = gql`
  mutation DeleteCompany($companyId: String!) {
    deleteCompany(companyId: $companyId)
  }
`;
