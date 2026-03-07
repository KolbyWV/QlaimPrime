import { gql } from "@apollo/client";

import { PROFILE_SUMMARY_FRAGMENT } from "./fragments";

export const PROFILE_BY_USERNAME_QUERY = gql`
  query ProfileByUsername($username: String!) {
    profileByUsername(username: $username) {
      ...ProfileSummary
    }
  }
  ${PROFILE_SUMMARY_FRAGMENT}
`;

export const CREATE_PROFILE_MUTATION = gql`
  mutation CreateProfile(
    $firstName: String!
    $lastName: String!
    $username: String!
    $zipcode: String!
    $avatarUrl: String
  ) {
    createProfile(
      firstName: $firstName
      lastName: $lastName
      username: $username
      zipcode: $zipcode
      avatarUrl: $avatarUrl
    ) {
      ...ProfileSummary
    }
  }
  ${PROFILE_SUMMARY_FRAGMENT}
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile(
    $firstName: String
    $lastName: String
    $username: String
    $zipcode: String
    $avatarUrl: String
  ) {
    updateProfile(
      firstName: $firstName
      lastName: $lastName
      username: $username
      zipcode: $zipcode
      avatarUrl: $avatarUrl
    ) {
      ...ProfileSummary
    }
  }
  ${PROFILE_SUMMARY_FRAGMENT}
`;

export const DELETE_PROFILE_MUTATION = gql`
  mutation DeleteProfile {
    deleteProfile
  }
`;
