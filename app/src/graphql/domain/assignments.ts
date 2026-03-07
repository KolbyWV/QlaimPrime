import { gql } from "@apollo/client";

import { ASSIGNMENT_SUMMARY_FRAGMENT } from "./fragments";

export const GIG_ASSIGNMENTS_QUERY = gql`
  query GigAssignments($gigId: ID!, $limit: Int, $offset: Int) {
    gigAssignments(gigId: $gigId, limit: $limit, offset: $offset) {
      ...AssignmentSummary
    }
  }
  ${ASSIGNMENT_SUMMARY_FRAGMENT}
`;

export const MY_ASSIGNMENTS_QUERY = gql`
  query MyAssignments($limit: Int, $offset: Int) {
    myAssignments(limit: $limit, offset: $offset) {
      ...AssignmentSummary
    }
  }
  ${ASSIGNMENT_SUMMARY_FRAGMENT}
`;

export const ASSIGNMENT_HISTORY_QUERY = gql`
  query AssignmentHistory($userId: ID, $limit: Int, $offset: Int) {
    assignmentHistory(userId: $userId, limit: $limit, offset: $offset) {
      ...AssignmentSummary
    }
  }
  ${ASSIGNMENT_SUMMARY_FRAGMENT}
`;

export const UPDATE_ASSIGNMENT_STATUS_MUTATION = gql`
  mutation UpdateAssignmentStatus(
    $assignmentId: ID!
    $status: AssignmentStatus!
    $note: String
    $startImageUrls: [String!]
    $endImageUrls: [String!]
  ) {
    updateAssignmentStatus(
      assignmentId: $assignmentId
      status: $status
      note: $note
      startImageUrls: $startImageUrls
      endImageUrls: $endImageUrls
    ) {
      ...AssignmentSummary
    }
  }
  ${ASSIGNMENT_SUMMARY_FRAGMENT}
`;
