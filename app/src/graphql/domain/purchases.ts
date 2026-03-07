import { gql } from "@apollo/client";

import { PURCHASE_SUMMARY_FRAGMENT } from "./fragments";

export const PURCHASE_QUERY = gql`
  query Purchase($id: ID!) {
    purchase(id: $id) {
      ...PurchaseSummary
    }
  }
  ${PURCHASE_SUMMARY_FRAGMENT}
`;

export const PURCHASES_QUERY = gql`
  query Purchases($contractorId: ID, $status: PurchaseStatus, $limit: Int, $offset: Int) {
    purchases(contractorId: $contractorId, status: $status, limit: $limit, offset: $offset) {
      ...PurchaseSummary
    }
  }
  ${PURCHASE_SUMMARY_FRAGMENT}
`;

export const MY_PURCHASES_QUERY = gql`
  query MyPurchases($status: PurchaseStatus, $limit: Int, $offset: Int) {
    myPurchases(status: $status, limit: $limit, offset: $offset) {
      ...PurchaseSummary
    }
  }
  ${PURCHASE_SUMMARY_FRAGMENT}
`;

export const PURCHASE_PRODUCT_MUTATION = gql`
  mutation PurchaseProduct($productId: ID!, $appliedToAssignmentId: ID) {
    purchaseProduct(productId: $productId, appliedToAssignmentId: $appliedToAssignmentId) {
      ...PurchaseSummary
    }
  }
  ${PURCHASE_SUMMARY_FRAGMENT}
`;

export const CONSUME_PURCHASE_MUTATION = gql`
  mutation ConsumePurchase($id: ID!, $appliedToAssignmentId: ID) {
    consumePurchase(id: $id, appliedToAssignmentId: $appliedToAssignmentId) {
      ...PurchaseSummary
    }
  }
  ${PURCHASE_SUMMARY_FRAGMENT}
`;

export const EXPIRE_PURCHASE_MUTATION = gql`
  mutation ExpirePurchase($id: ID!) {
    expirePurchase(id: $id) {
      ...PurchaseSummary
    }
  }
  ${PURCHASE_SUMMARY_FRAGMENT}
`;
