import { gql } from "@apollo/client";

import {
  MONEY_TRANSACTION_SUMMARY_FRAGMENT,
  STARS_TRANSACTION_SUMMARY_FRAGMENT,
} from "./fragments";

export const STARS_TRANSACTIONS_QUERY = gql`
  query StarsTransactions($contractorId: String, $limit: Int, $offset: Int) {
    starsTransactions(contractorId: $contractorId, limit: $limit, offset: $offset) {
      ...StarsTransactionSummary
    }
  }
  ${STARS_TRANSACTION_SUMMARY_FRAGMENT}
`;

export const MONEY_TRANSACTIONS_QUERY = gql`
  query MoneyTransactions($contractorId: String, $limit: Int, $offset: Int) {
    moneyTransactions(contractorId: $contractorId, limit: $limit, offset: $offset) {
      ...MoneyTransactionSummary
    }
  }
  ${MONEY_TRANSACTION_SUMMARY_FRAGMENT}
`;

export const MY_STARS_TRANSACTIONS_QUERY = gql`
  query MyStarsTransactions($limit: Int, $offset: Int) {
    myStarsTransactions(limit: $limit, offset: $offset) {
      ...StarsTransactionSummary
    }
  }
  ${STARS_TRANSACTION_SUMMARY_FRAGMENT}
`;

export const MY_MONEY_TRANSACTIONS_QUERY = gql`
  query MyMoneyTransactions($limit: Int, $offset: Int) {
    myMoneyTransactions(limit: $limit, offset: $offset) {
      ...MoneyTransactionSummary
    }
  }
  ${MONEY_TRANSACTION_SUMMARY_FRAGMENT}
`;

export const CREATE_STARS_TRANSACTION_MUTATION = gql`
  mutation CreateStarsTransaction(
    $contractorId: String!
    $delta: Int!
    $reason: StarsReason!
    $gigId: String
    $assignmentId: String
    $purchaseId: String
  ) {
    createStarsTransaction(
      contractorId: $contractorId
      delta: $delta
      reason: $reason
      gigId: $gigId
      assignmentId: $assignmentId
      purchaseId: $purchaseId
    ) {
      ...StarsTransactionSummary
    }
  }
  ${STARS_TRANSACTION_SUMMARY_FRAGMENT}
`;

export const CREATE_MONEY_TRANSACTION_MUTATION = gql`
  mutation CreateMoneyTransaction(
    $contractorId: String!
    $amountCents: Int!
    $reason: MoneyReason!
    $gigId: String
    $assignmentId: String
  ) {
    createMoneyTransaction(
      contractorId: $contractorId
      amountCents: $amountCents
      reason: $reason
      gigId: $gigId
      assignmentId: $assignmentId
    ) {
      ...MoneyTransactionSummary
    }
  }
  ${MONEY_TRANSACTION_SUMMARY_FRAGMENT}
`;
