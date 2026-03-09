export const typeDefs = `#graphql

  scalar DateTime

  type Query {
    me: User
    user(id: ID!): User
    profileByUsername(username: String!): Profile
    company(id: ID!): Company
    companyDirectory(search: String, limit: Int, offset: Int): [Company]
    companyMembers(companyId: ID!): [Member]
    companyMembershipRequests(
      companyId: ID!
      status: MembershipRequestStatus
      limit: Int
      offset: Int
    ): [CompanyMembershipRequest]
    myCompanyMembershipRequests(
      status: MembershipRequestStatus
      limit: Int
      offset: Int
    ): [CompanyMembershipRequest]
    location(id: ID!): Location
    locations(limit: Int, offset: Int): [Location]
    gig(id: ID!): Gig
    gigReview(id: ID!): GigReview
    gigReviewsForGig(gigId: ID!, limit: Int, offset: Int): [GigReview]
    gigs(companyId: ID, status: GigStatus, limit: Int, offset: Int): [Gig]
    gigAssignments(gigId: ID!, limit: Int, offset: Int): [GigAssignment]
    myAssignments(limit: Int, offset: Int): [GigAssignment]
    assignmentHistory(userId: ID, limit: Int, offset: Int): [GigAssignment]
    starsTransactions(contractorId: ID, limit: Int, offset: Int): [StarsTransaction]
    moneyTransactions(contractorId: ID, limit: Int, offset: Int): [MoneyTransaction]
    myStarsTransactions(limit: Int, offset: Int): [StarsTransaction]
    myMoneyTransactions(limit: Int, offset: Int): [MoneyTransaction]
    product(id: ID!): Product
    products(category: ProductCategory, tier: MembershipTier, limit: Int, offset: Int): [Product]
    purchase(id: ID!): Purchase
    purchases(contractorId: ID, status: PurchaseStatus, limit: Int, offset: Int): [Purchase]
    myPurchases(status: PurchaseStatus, limit: Int, offset: Int): [Purchase]
    myWatchlist(limit: Int, offset: Int): [Watchlist]
    users(limit: Int, offset: Int): [User]
    companies(limit: Int, offset: Int): [Company]
    myCompanies: [Company]
    members(limit: Int, offset: Int): [Member]
  }

  type Mutation {
    refreshToken(refreshToken: String!): AuthPayload
    register(email: String!, password: String!): AuthPayload
    requestPasswordReset(email: String!): Boolean!
    resetPassword(token: String!, newPassword: String!): Boolean!
    deleteUser(id: ID!): Boolean
    createProfile(
      firstName: String!
      lastName: String!
      username: String!
      zipcode: String!
      avatarUrl: String
    ): Profile
    updateProfile(
      firstName: String
      lastName: String
      username: String
      zipcode: String
      avatarUrl: String
    ): Profile
    deleteProfile: Boolean
    createCompany(name: String!, logoUrl: String): Company
    updateCompany(companyId: ID!, name: String, logoUrl: String): Company
    deleteCompany(companyId: ID!): Boolean
    requestCompanyMembership(
      companyId: ID!
      requestedRole: CompanyRole
      note: String
    ): CompanyMembershipRequest
    approveCompanyMembershipRequest(requestId: ID!, role: CompanyRole): Member
    denyCompanyMembershipRequest(
      requestId: ID!
      reason: String
    ): CompanyMembershipRequest
    addCompanyMember(companyId: ID!, userId: ID!, role: CompanyRole!): Member
    updateCompanyMemberRole(companyId: ID!, userId: ID!, role: CompanyRole!): Member
    removeCompanyMember(companyId: ID!, userId: ID!): Boolean
    leaveCompany(companyId: ID!): Boolean
    createGig(
      companyId: ID!
      title: String!
      description: String
      type: GigType
      locationId: ID!
      startsAt: DateTime
      endsAt: DateTime
      payCents: Int
      units: Int
      basePriceCents: Int
      bumpEverySeconds: Int
      bumpCents: Int
      maxBumps: Int
      maxPriceCents: Int
      baseStars: Int
      starsBumpEverySeconds: Int
      starsBumpAmount: Int
      maxAgeBonusStars: Int
      repostBonusPerRepost: Int
      currentPriceCents: Int
      requiredTier: MembershipTier
      status: GigStatus
    ): Gig
    updateGig(
      gigId: ID!
      title: String
      description: String
      type: GigType
      locationId: ID
      startsAt: DateTime
      endsAt: DateTime
      payCents: Int
      units: Int
      basePriceCents: Int
      bumpEverySeconds: Int
      bumpCents: Int
      maxBumps: Int
      maxPriceCents: Int
      baseStars: Int
      starsBumpEverySeconds: Int
      starsBumpAmount: Int
      maxAgeBonusStars: Int
      repostBonusPerRepost: Int
      currentPriceCents: Int
      requiredTier: MembershipTier
    ): Gig
    updateGigStatus(gigId: ID!, status: GigStatus!): Gig
    deleteGig(gigId: ID!): Boolean
    claimGig(gigId: ID!, note: String): GigAssignment
    updateAssignmentStatus(
      assignmentId: ID!
      status: AssignmentStatus!
      note: String
      startImageUrls: [String!]
      endImageUrls: [String!]
    ): GigAssignment
    createImageUploadUrl(
      bucket: S3UploadBucket!
      mimeType: String!
      size: Int!
      folder: String
    ): PresignedUpload
    createGigReview(
      assignmentId: ID!
      starsRating: Int!
      decision: ReviewDecision!
      comment: String
    ): GigReview
    createStarsTransaction(
      contractorId: ID!
      delta: Int!
      reason: StarsReason!
      gigId: ID
      assignmentId: ID
      purchaseId: ID
    ): StarsTransaction
    createMoneyTransaction(
      contractorId: ID!
      amountCents: Int!
      reason: MoneyReason!
      gigId: ID
      assignmentId: ID
    ): MoneyTransaction
    createProduct(
      category: ProductCategory!
      tier: MembershipTier
      title: String!
      subtitle: String
      starsCost: Int!
      durationSeconds: Int
      effectPct: Int
    ): Product
    updateProduct(
      id: ID!
      category: ProductCategory
      tier: MembershipTier
      title: String
      subtitle: String
      starsCost: Int
      durationSeconds: Int
      effectPct: Int
    ): Product
    purchaseProduct(productId: ID!, appliedToAssignmentId: ID): Purchase
    consumePurchase(id: ID!, appliedToAssignmentId: ID): Purchase
    expirePurchase(id: ID!): Purchase
    addGigToWatchlist(gigId: ID!): Watchlist
    removeGigFromWatchlist(gigId: ID!): Boolean
    createLocation(
      name: String!
      address: String!
      city: String!
      state: String!
      zipcode: String!
      lat: Float
      lng: Float
    ): Location
    updateLocation(
      id: ID!
      name: String
      address: String
      city: String
      state: String
      zipcode: String
      lat: Float
      lng: Float
    ): Location
    deleteLocation(id: ID!): Boolean
    login(email: String!, password: String!): AuthPayload
    logout(refreshToken: String!): Boolean
  }

  type User {
    id: ID
    email: String
    role: UserRole
    createdAt: DateTime
    updatedAt: DateTime

    profile: Profile
    companies: [Member]
    createdGigs: [Gig]
    assignments: [GigAssignment]
    watchlistEntries: [Watchlist]
  }

  type AuthPayload {
    accessToken: String
    refreshToken: String
    user: User
  }

  type PresignedUpload {
    uploadUrl: String
    fileUrl: String
    bucket: String
    key: String
    mimeType: String
    size: Int
    uploadedByUserId: ID
    expiresIn: Int
  }

  enum S3UploadBucket {
    PUBLIC
    PRIVATE
  }

  type Profile {
    id: ID
    userId: ID
    firstName: String
    lastName: String
    username: String
    zipcode: String
    avatarUrl: String

    tier: MembershipTier
    starsBalance: Int

    ratingAvg: Float
    ratingCount: Int

    starsTransactions: [StarsTransaction]
    moneyTransactions: [MoneyTransaction]
    purchases: [Purchase]

    createdAt: DateTime
    updatedAt: DateTime
  }

  type Company {
    id: ID
    name: String
    logoUrl: String
    createdAt: DateTime
    updatedAt: DateTime

    members: [Member]
    gigs: [Gig]
  }

  type Member {
    id: ID
    companyId: ID
    userId: ID

    company: Company
    user: User

    role: CompanyRole

    createdAt: DateTime
    updatedAt: DateTime
  }

  type CompanyMembershipRequest {
    id: ID
    companyId: ID
    userId: ID

    company: Company
    user: User

    requestedRole: CompanyRole
    note: String
    status: MembershipRequestStatus
    resolvedByUserId: ID
    resolvedBy: User
    resolvedNote: String
    resolvedAt: DateTime

    createdAt: DateTime
    updatedAt: DateTime
  }

  type Location {
    id: ID
    name: String
    address: String
    city: String
    state: String
    zipcode: String
    lat: Float
    lng: Float
    createdAt: DateTime
    updatedAt: DateTime
  }

  type Gig {
    id: ID
    companyId: ID
    createdByUserId: ID
    title: String
    description: String
    type: GigType
    locationId: ID
    startsAt: DateTime
    endsAt: DateTime
    payCents: Int
    units: Int
    basePriceCents: Int
    bumpEverySeconds: Int
    bumpCents: Int
    maxBumps: Int
    maxPriceCents: Int
    baseStars: Int
    starsBumpEverySeconds: Int
    starsBumpAmount: Int
    maxAgeBonusStars: Int
    repostBonusPerRepost: Int
    currentPriceCents: Int
    ageBonusStars: Int
    repostBonusStars: Int
    bonusStars: Int @deprecated(reason: "Legacy persisted field; use ageBonusStars, repostBonusStars, or totalStarsReward instead.")
    totalStarsReward: Int
    requiredTier: MembershipTier
    repostCount: Int
    escalationCount: Int
    lastEscalatedAt: DateTime
    status: GigStatus
    createdAt: DateTime
    updatedAt: DateTime

    company: Company
    createdBy: User
    location: Location
    assignments: [GigAssignment]
    watchlistEntries: [Watchlist]
    watchlistCount: Int
  }

  type Watchlist {
    id: ID
    userId: ID
    gigId: ID
    createdAt: DateTime

    user: User
    gig: Gig
  }

  type GigAssignment {
    id: ID
    gigId: ID
    userId: ID
    status: AssignmentStatus
    note: String
    startImageUrl: String
    endImageUrl: String
    startImageUrls: [String!]
    endImageUrls: [String!]
    assignedAt: DateTime
    claimedAt: DateTime
    startedAt: DateTime
    submittedAt: DateTime
    reviewedAt: DateTime
    acceptedAt: DateTime
    completedAt: DateTime
    createdAt: DateTime
    updatedAt: DateTime

    gig: Gig
    user: User
    review: GigReview
    purchases: [Purchase]
  }

  type GigReview {
    id: ID
    assignmentId: ID
    reviewerMemberId: ID
    starsRating: Int
    comment: String
    decision: ReviewDecision
    createdAt: DateTime

    assignment: GigAssignment
    reviewerMember: Member
  }

  type StarsTransaction {
    id: ID
    contractorId: ID
    delta: Int
    reason: StarsReason
    gigId: ID
    assignmentId: ID
    purchaseId: ID
    createdAt: DateTime

    contractor: Profile
    gig: Gig
    assignment: GigAssignment
  }

  type MoneyTransaction {
    id: ID
    contractorId: ID
    amountCents: Int
    reason: MoneyReason
    gigId: ID
    assignmentId: ID
    createdAt: DateTime

    contractor: Profile
    gig: Gig
    assignment: GigAssignment
  }

  type Product {
    id: ID
    category: ProductCategory
    tier: MembershipTier
    title: String
    subtitle: String
    starsCost: Int
    durationSeconds: Int
    effectPct: Int
    createdAt: DateTime
    purchases: [Purchase]
  }

  type Purchase {
    id: ID
    contractorId: ID
    productId: ID
    status: PurchaseStatus
    expiresAt: DateTime
    consumedAt: DateTime
    appliedToAssignmentId: ID
    createdAt: DateTime

    contractor: Profile
    product: Product
    assignment: GigAssignment
  }

  enum CompanyRole {
    CREATOR
    APPROVER
    MANAGER
    OWNER
  }

  enum MembershipRequestStatus {
    PENDING
    APPROVED
    DENIED
  }

  enum UserRole {
    USER
    ADMIN
  }

  enum MembershipTier {
    COPPER
    BRONZE
    SILVER
    GOLD
    PLATINUM
    DIAMOND
  }

  enum GigStatus {
    DRAFT
    OPEN
    CLAIMED
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  enum GigType {
    STANDARD
    DELIVERY
    AUDIT
  }

  enum AssignmentStatus {
    CLAIMED
    ACCEPTED
    DECLINED
    STARTED
    SUBMITTED
    REVIEWED
    COMPLETED
    CANCELLED
  }

  enum ReviewDecision {
    APPROVED
    REJECTED
  }

  enum StarsReason {
    EARNED_FROM_REVIEW
    SPENT_ON_PRODUCT
    ADJUSTMENT
  }

  enum MoneyReason {
    PAYOUT
    ADJUSTMENT
  }

  enum PurchaseStatus {
    ACTIVE
    EXPIRED
    CONSUMED
  }

  enum ProductCategory {
    MEMBERSHIP_UPGRADE
    PAY_BONUS
  }

`;
