import { gql } from "@apollo/client";

import { REVIEW_SUMMARY_FRAGMENT } from "./fragments";

export const GIG_REVIEW_QUERY = gql`
  query GigReview($id: String!) {
    gigReview(id: $id) {
      ...ReviewSummary
    }
  }
  ${REVIEW_SUMMARY_FRAGMENT}
`;

export const GIG_REVIEWS_FOR_GIG_QUERY = gql`
  query GigReviewsForGig($gigId: String!, $limit: Int, $offset: Int) {
    gigReviewsForGig(gigId: $gigId, limit: $limit, offset: $offset) {
      ...ReviewSummary
    }
  }
  ${REVIEW_SUMMARY_FRAGMENT}
`;

export const CREATE_GIG_REVIEW_MUTATION = gql`
  mutation CreateGigReview(
    $assignmentId: String!
    $starsRating: Int!
    $decision: ReviewDecision!
    $comment: String
  ) {
    createGigReview(
      assignmentId: $assignmentId
      starsRating: $starsRating
      decision: $decision
      comment: $comment
    ) {
      ...ReviewSummary
    }
  }
  ${REVIEW_SUMMARY_FRAGMENT}
`;
