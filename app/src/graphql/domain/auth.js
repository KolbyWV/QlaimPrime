import { gql } from "@apollo/client";

import {
  MEMBER_SUMMARY_FRAGMENT,
  PROFILE_SUMMARY_FRAGMENT,
} from "./fragments";

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      createdAt
      updatedAt
      profile {
        ...ProfileSummary
      }
      companies {
        ...MemberSummary
      }
    }
  }
  ${PROFILE_SUMMARY_FRAGMENT}
  ${MEMBER_SUMMARY_FRAGMENT}
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      refreshToken
      user {
        id
        email
        profile {
          ...ProfileSummary
        }
        companies {
          ...MemberSummary
        }
      }
    }
  }
  ${PROFILE_SUMMARY_FRAGMENT}
  ${MEMBER_SUMMARY_FRAGMENT}
`;

export const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      accessToken
      refreshToken
      user {
        id
        email
        profile {
          ...ProfileSummary
        }
        companies {
          ...MemberSummary
        }
      }
    }
  }
  ${PROFILE_SUMMARY_FRAGMENT}
  ${MEMBER_SUMMARY_FRAGMENT}
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      user {
        id
        email
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken)
  }
`;

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;
