import { gql } from "@apollo/client";

import { LOCATION_SUMMARY_FRAGMENT } from "./fragments";

export const LOCATIONS_QUERY = gql`
  query Locations($limit: Int, $offset: Int) {
    locations(limit: $limit, offset: $offset) {
      ...LocationSummary
    }
  }
  ${LOCATION_SUMMARY_FRAGMENT}
`;

export const LOCATION_QUERY = gql`
  query Location($id: String!) {
    location(id: $id) {
      ...LocationSummary
    }
  }
  ${LOCATION_SUMMARY_FRAGMENT}
`;

export const CREATE_LOCATION_MUTATION = gql`
  mutation CreateLocation(
    $name: String!
    $address: String!
    $city: String!
    $state: String!
    $zipcode: String!
    $lat: Float
    $lng: Float
  ) {
    createLocation(
      name: $name
      address: $address
      city: $city
      state: $state
      zipcode: $zipcode
      lat: $lat
      lng: $lng
    ) {
      ...LocationSummary
    }
  }
  ${LOCATION_SUMMARY_FRAGMENT}
`;

export const UPDATE_LOCATION_MUTATION = gql`
  mutation UpdateLocation(
    $id: String!
    $name: String
    $address: String
    $city: String
    $state: String
    $zipcode: String
    $lat: Float
    $lng: Float
  ) {
    updateLocation(
      id: $id
      name: $name
      address: $address
      city: $city
      state: $state
      zipcode: $zipcode
      lat: $lat
      lng: $lng
    ) {
      ...LocationSummary
    }
  }
  ${LOCATION_SUMMARY_FRAGMENT}
`;

export const DELETE_LOCATION_MUTATION = gql`
  mutation DeleteLocation($id: String!) {
    deleteLocation(id: $id)
  }
`;
