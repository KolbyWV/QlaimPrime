import { gql } from "@apollo/client";

export const PROFILE_SUMMARY_FRAGMENT = gql`
  fragment ProfileSummary on Profile {
    id
    userId
    firstName
    lastName
    username
    zipcode
    avatarUrl
    tier
    starsBalance
    ratingAvg
    ratingCount
    createdAt
    updatedAt
  }
`;

export const COMPANY_SUMMARY_FRAGMENT = gql`
  fragment CompanySummary on Company {
    id
    name
    logoUrl
    createdAt
    updatedAt
  }
`;

export const MEMBER_SUMMARY_FRAGMENT = gql`
  fragment MemberSummary on Member {
    id
    companyId
    userId
    role
    createdAt
    updatedAt
    user {
      id
      email
    }
    company {
      ...CompanySummary
    }
  }
  ${COMPANY_SUMMARY_FRAGMENT}
`;

export const COMPANY_MEMBERSHIP_REQUEST_SUMMARY_FRAGMENT = gql`
  fragment CompanyMembershipRequestSummary on CompanyMembershipRequest {
    id
    companyId
    userId
    requestedRole
    status
    note
    resolvedByUserId
    resolvedNote
    resolvedAt
    createdAt
    updatedAt
    company {
      ...CompanySummary
    }
    user {
      id
      email
    }
    resolvedBy {
      id
      email
    }
  }
  ${COMPANY_SUMMARY_FRAGMENT}
`;

export const LOCATION_SUMMARY_FRAGMENT = gql`
  fragment LocationSummary on Location {
    id
    name
    address
    city
    state
    zipcode
    lat
    lng
  }
`;

export const GIG_SUMMARY_FRAGMENT = gql`
  fragment GigSummary on Gig {
    id
    companyId
    createdByUserId
    title
    description
    type
    locationId
    startsAt
    endsAt
    payCents
    units
    basePriceCents
    bumpEverySeconds
    bumpCents
    maxBumps
    maxPriceCents
    baseStars
    starsBumpEverySeconds
    starsBumpAmount
    maxAgeBonusStars
    repostBonusPerRepost
    currentPriceCents
    ageBonusStars
    repostBonusStars
    totalStarsReward
    requiredTier
    repostCount
    escalationCount
    lastEscalatedAt
    status
    createdAt
    updatedAt
    company {
      ...CompanySummary
    }
    location {
      ...LocationSummary
    }
  }
  ${COMPANY_SUMMARY_FRAGMENT}
  ${LOCATION_SUMMARY_FRAGMENT}
`;

export const ASSIGNMENT_SUMMARY_FRAGMENT = gql`
  fragment AssignmentSummary on GigAssignment {
    id
    gigId
    userId
    status
    note
    startImageUrl
    endImageUrl
    assignedAt
    claimedAt
    startedAt
    submittedAt
    reviewedAt
    acceptedAt
    completedAt
    createdAt
    updatedAt
    user {
      id
      email
    }
    gig {
      ...GigSummary
    }
    review {
      id
      starsRating
      decision
    }
  }
  ${GIG_SUMMARY_FRAGMENT}
`;

export const REVIEW_SUMMARY_FRAGMENT = gql`
  fragment ReviewSummary on GigReview {
    id
    assignmentId
    reviewerMemberId
    starsRating
    comment
    decision
    createdAt
    assignment {
      id
      gigId
      userId
      status
    }
  }
`;

export const PRODUCT_SUMMARY_FRAGMENT = gql`
  fragment ProductSummary on Product {
    id
    category
    tier
    title
    subtitle
    starsCost
    durationSeconds
    effectPct
    createdAt
  }
`;

export const PURCHASE_SUMMARY_FRAGMENT = gql`
  fragment PurchaseSummary on Purchase {
    id
    contractorId
    productId
    status
    expiresAt
    consumedAt
    appliedToAssignmentId
    createdAt
    product {
      ...ProductSummary
    }
  }
  ${PRODUCT_SUMMARY_FRAGMENT}
`;

export const STARS_TRANSACTION_SUMMARY_FRAGMENT = gql`
  fragment StarsTransactionSummary on StarsTransaction {
    id
    contractorId
    delta
    reason
    gigId
    assignmentId
    purchaseId
    createdAt
  }
`;

export const MONEY_TRANSACTION_SUMMARY_FRAGMENT = gql`
  fragment MoneyTransactionSummary on MoneyTransaction {
    id
    contractorId
    amountCents
    reason
    gigId
    assignmentId
    createdAt
  }
`;
