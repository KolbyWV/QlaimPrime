import { gql } from "@apollo/client";

import {
  ASSIGNMENT_SUMMARY_FRAGMENT,
  GIG_SUMMARY_FRAGMENT,
} from "./fragments";

export const GIG_QUERY = gql`
  query Gig($id: String!) {
    gig(id: $id) {
      ...GigSummary
      assignments {
        ...AssignmentSummary
      }
    }
  }
  ${GIG_SUMMARY_FRAGMENT}
  ${ASSIGNMENT_SUMMARY_FRAGMENT}
`;

export const GIGS_QUERY = gql`
  query Gigs($companyId: String, $status: GigStatus, $limit: Int, $offset: Int) {
    gigs(companyId: $companyId, status: $status, limit: $limit, offset: $offset) {
      ...GigSummary
    }
  }
  ${GIG_SUMMARY_FRAGMENT}
`;

export const CREATE_GIG_MUTATION = gql`
  mutation CreateGig(
    $companyId: String!
    $title: String!
    $description: String
    $type: GigType
    $locationId: String
    $startsAt: String
    $endsAt: String
    $payCents: Int
    $units: Int
    $basePriceCents: Int
    $bumpEverySeconds: Int
    $bumpCents: Int
    $maxBumps: Int
    $maxPriceCents: Int
    $baseStars: Int
    $starsBumpEverySeconds: Int
    $starsBumpAmount: Int
    $maxAgeBonusStars: Int
    $repostBonusPerRepost: Int
    $currentPriceCents: Int
    $requiredTier: MembershipTier
    $status: GigStatus
  ) {
    createGig(
      companyId: $companyId
      title: $title
      description: $description
      type: $type
      locationId: $locationId
      startsAt: $startsAt
      endsAt: $endsAt
      payCents: $payCents
      units: $units
      basePriceCents: $basePriceCents
      bumpEverySeconds: $bumpEverySeconds
      bumpCents: $bumpCents
      maxBumps: $maxBumps
      maxPriceCents: $maxPriceCents
      baseStars: $baseStars
      starsBumpEverySeconds: $starsBumpEverySeconds
      starsBumpAmount: $starsBumpAmount
      maxAgeBonusStars: $maxAgeBonusStars
      repostBonusPerRepost: $repostBonusPerRepost
      currentPriceCents: $currentPriceCents
      requiredTier: $requiredTier
      status: $status
    ) {
      ...GigSummary
    }
  }
  ${GIG_SUMMARY_FRAGMENT}
`;

export const UPDATE_GIG_MUTATION = gql`
  mutation UpdateGig(
    $gigId: String!
    $title: String
    $description: String
    $type: GigType
    $locationId: String
    $startsAt: String
    $endsAt: String
    $payCents: Int
    $units: Int
    $basePriceCents: Int
    $bumpEverySeconds: Int
    $bumpCents: Int
    $maxBumps: Int
    $maxPriceCents: Int
    $baseStars: Int
    $starsBumpEverySeconds: Int
    $starsBumpAmount: Int
    $maxAgeBonusStars: Int
    $repostBonusPerRepost: Int
    $currentPriceCents: Int
    $requiredTier: MembershipTier
  ) {
    updateGig(
      gigId: $gigId
      title: $title
      description: $description
      type: $type
      locationId: $locationId
      startsAt: $startsAt
      endsAt: $endsAt
      payCents: $payCents
      units: $units
      basePriceCents: $basePriceCents
      bumpEverySeconds: $bumpEverySeconds
      bumpCents: $bumpCents
      maxBumps: $maxBumps
      maxPriceCents: $maxPriceCents
      baseStars: $baseStars
      starsBumpEverySeconds: $starsBumpEverySeconds
      starsBumpAmount: $starsBumpAmount
      maxAgeBonusStars: $maxAgeBonusStars
      repostBonusPerRepost: $repostBonusPerRepost
      currentPriceCents: $currentPriceCents
      requiredTier: $requiredTier
    ) {
      ...GigSummary
    }
  }
  ${GIG_SUMMARY_FRAGMENT}
`;

export const UPDATE_GIG_STATUS_MUTATION = gql`
  mutation UpdateGigStatus($gigId: String!, $status: GigStatus!) {
    updateGigStatus(gigId: $gigId, status: $status) {
      ...GigSummary
    }
  }
  ${GIG_SUMMARY_FRAGMENT}
`;

export const DELETE_GIG_MUTATION = gql`
  mutation DeleteGig($gigId: String!) {
    deleteGig(gigId: $gigId)
  }
`;

export const CLAIM_GIG_MUTATION = gql`
  mutation ClaimGig($gigId: String!, $note: String) {
    claimGig(gigId: $gigId, note: $note) {
      ...AssignmentSummary
    }
  }
  ${ASSIGNMENT_SUMMARY_FRAGMENT}
`;

export const ADD_GIG_TO_WATCHLIST_MUTATION = gql`
  mutation AddGigToWatchlist($gigId: String!) {
    addGigToWatchlist(gigId: $gigId) {
      id
      gigId
      userId
      createdAt
    }
  }
`;

export const REMOVE_GIG_FROM_WATCHLIST_MUTATION = gql`
  mutation RemoveGigFromWatchlist($gigId: String!) {
    removeGigFromWatchlist(gigId: $gigId)
  }
`;
