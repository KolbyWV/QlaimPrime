import { gql } from "@apollo/client";

import { PRODUCT_SUMMARY_FRAGMENT } from "./fragments";

export const PRODUCT_QUERY = gql`
  query Product($id: String!) {
    product(id: $id) {
      ...ProductSummary
    }
  }
  ${PRODUCT_SUMMARY_FRAGMENT}
`;

export const PRODUCTS_QUERY = gql`
  query Products($category: ProductCategory, $tier: MembershipTier, $limit: Int, $offset: Int) {
    products(category: $category, tier: $tier, limit: $limit, offset: $offset) {
      ...ProductSummary
    }
  }
  ${PRODUCT_SUMMARY_FRAGMENT}
`;

export const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct(
    $category: ProductCategory!
    $tier: MembershipTier
    $title: String!
    $subtitle: String
    $starsCost: Int!
    $durationSeconds: Int
    $effectPct: Int
  ) {
    createProduct(
      category: $category
      tier: $tier
      title: $title
      subtitle: $subtitle
      starsCost: $starsCost
      durationSeconds: $durationSeconds
      effectPct: $effectPct
    ) {
      ...ProductSummary
    }
  }
  ${PRODUCT_SUMMARY_FRAGMENT}
`;

export const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct(
    $id: String!
    $category: ProductCategory
    $tier: MembershipTier
    $title: String
    $subtitle: String
    $starsCost: Int
    $durationSeconds: Int
    $effectPct: Int
  ) {
    updateProduct(
      id: $id
      category: $category
      tier: $tier
      title: $title
      subtitle: $subtitle
      starsCost: $starsCost
      durationSeconds: $durationSeconds
      effectPct: $effectPct
    ) {
      ...ProductSummary
    }
  }
  ${PRODUCT_SUMMARY_FRAGMENT}
`;
