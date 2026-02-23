export const typeDefs = `#graphql

 type Query {
    me: User
    user(id: String!): User
    profileByUsername(username: String!): Profile
    company(id: String!): Company
    companyMembers(companyId: String!): [Member]
    location(id: String!): Location
    locations(limit: Int, offset: Int): [Location]
    gig(id: String!): Gig
    gigReview(id: String!): GigReview
    gigReviewsForGig(gigId: String!, limit: Int, offset: Int): [GigReview]
    gigs(companyId: String, status: GigStatus, limit: Int, offset: Int): [Gig]
    gigAssignments(gigId: String!, limit: Int, offset: Int): [GigAssignment]
    myAssignments(limit: Int, offset: Int): [GigAssignment]
    assignmentHistory(userId: String, limit: Int, offset: Int): [GigAssignment]
    starsTransactions(contractorId: String, limit: Int, offset: Int): [StarsTransaction]
    moneyTransactions(contractorId: String, limit: Int, offset: Int): [MoneyTransaction]
    myStarsTransactions(limit: Int, offset: Int): [StarsTransaction]
    myMoneyTransactions(limit: Int, offset: Int): [MoneyTransaction]
    product(id: String!): Product
    products(category: ProductCategory, tier: MembershipTier, limit: Int, offset: Int): [Product]
    purchase(id: String!): Purchase
    purchases(contractorId: String, status: PurchaseStatus, limit: Int, offset: Int): [Purchase]
    myPurchases(status: PurchaseStatus, limit: Int, offset: Int): [Purchase]
    users: [User]
    companies: [Company]
    myCompanies: [Company]
    members: [Member]
 }

 type Mutation {
    refreshToken(refreshToken: String!): AuthPayload
    register(email: String!, password: String!): AuthPayload
    requestPasswordReset(email: String!): Boolean!
    resetPassword(token: String!, newPassword: String!): Boolean!
    deleteUser(id: String!): Boolean
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
    updateCompany(companyId: String!, name: String, logoUrl: String): Company
    deleteCompany(companyId: String!): Boolean
    addCompanyMember(companyId: String!, userId: String!, role: CompanyRole!): Member
    updateCompanyMemberRole(companyId: String!, userId: String!, role: CompanyRole!): Member
    removeCompanyMember(companyId: String!, userId: String!): Boolean
    leaveCompany(companyId: String!): Boolean
    createGig(
      companyId: String!
      title: String!
      description: String
      type: GigType
      locationId: String
      startsAt: String
      endsAt: String
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
      bonusStars: Int
      requiredTier: MembershipTier
      status: GigStatus
    ): Gig
    updateGig(
      gigId: String!
      title: String
      description: String
      type: GigType
      locationId: String
      startsAt: String
      endsAt: String
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
      bonusStars: Int
      requiredTier: MembershipTier
    ): Gig
    updateGigStatus(gigId: String!, status: GigStatus!): Gig
    deleteGig(gigId: String!): Boolean
    claimGig(gigId: String!, note: String): GigAssignment
    updateAssignmentStatus(assignmentId: String!, status: AssignmentStatus!, note: String): GigAssignment
    createGigReview(
      assignmentId: String!
      starsRating: Int!
      decision: ReviewDecision!
      comment: String
    ): GigReview
    createStarsTransaction(
      contractorId: String!
      delta: Int!
      reason: StarsReason!
      gigId: String
      assignmentId: String
      purchaseId: String
    ): StarsTransaction
    createMoneyTransaction(
      contractorId: String!
      amountCents: Int!
      reason: MoneyReason!
      gigId: String
      assignmentId: String
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
      id: String!
      category: ProductCategory
      tier: MembershipTier
      title: String
      subtitle: String
      starsCost: Int
      durationSeconds: Int
      effectPct: Int
    ): Product
    purchaseProduct(productId: String!, appliedToAssignmentId: String): Purchase
    consumePurchase(id: String!, appliedToAssignmentId: String): Purchase
    expirePurchase(id: String!): Purchase
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
      id: String!
      name: String
      address: String
      city: String
      state: String
      zipcode: String
      lat: Float
      lng: Float
    ): Location
    deleteLocation(id: String!): Boolean
    login(email: String!, password: String!): AuthPayload
    logout(refreshToken: String!): Boolean
 }

 type User{
    id: String
    email: String
    createdAt: String
    updatedAt: String

    profile: Profile
    companies: [Member]
    createdGigs: [Gig]
    assignments: [GigAssignment]
 }

 type AuthPayload {
    accessToken: String
    refreshToken: String
    user: User
 }

 type Profile {
    id: String
    userId: String
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

    createdAt: String
    updatedAt: String
 }

 type Company {
    id: String
    name: String
    logoUrl: String
    createdAt: String
    updatedAt: String

    members: [Member]
    gigs: [Gig]
 }

 type Member {
    id: String
    companyId: String
    userId: String

    company: Company
    user: User

    role: CompanyRole

    createdAt: String
    updatedAt: String
 }

 type Location {
    id: String
    name: String
    address: String
    city: String
    state: String
    zipcode: String
    lat: Float
    lng: Float
    createdAt: String
    updatedAt: String
 }

 type Gig {
    id: String
    companyId: String
    createdByUserId: String
    title: String
    description: String
    type: GigType
    locationId: String
    startsAt: String
    endsAt: String
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
    bonusStars: Int
    totalStarsReward: Int
    requiredTier: MembershipTier
    repostCount: Int
    escalationCount: Int
    lastEscalatedAt: String
    status: GigStatus
    createdAt: String
    updatedAt: String

    company: Company
    createdBy: User
    location: Location
    assignments: [GigAssignment]
 }

 type GigAssignment {
    id: String
    gigId: String
    userId: String
    status: AssignmentStatus
    note: String
    notes: String
    startImageUrl: String
    endImageUrl: String
    assignedAt: String
    claimedAt: String
    startedAt: String
    submittedAt: String
    reviewedAt: String
    acceptedAt: String
    completedAt: String
    createdAt: String
    updatedAt: String

    gig: Gig
    user: User
    review: GigReview
    purchases: [Purchase]
 }

 type GigReview {
    id: String
    assignmentId: String
    reviewerMemberId: String
    starsRating: Int
    comment: String
    decision: ReviewDecision
    createdAt: String

    assignment: GigAssignment
    reviewerMember: Member
 }

 type StarsTransaction {
    id: String
    contractorId: String
    delta: Int
    reason: StarsReason
    gigId: String
    assignmentId: String
    purchaseId: String
    createdAt: String

    contractor: Profile
    gig: Gig
    assignment: GigAssignment
 }

 type MoneyTransaction {
    id: String
    contractorId: String
    amountCents: Int
    reason: MoneyReason
    gigId: String
    assignmentId: String
    createdAt: String

    contractor: Profile
    gig: Gig
    assignment: GigAssignment
 }

 type Product {
    id: String
    category: ProductCategory
    tier: MembershipTier
    title: String
    subtitle: String
    starsCost: Int
    durationSeconds: Int
    effectPct: Int
    createdAt: String
    purchases: [Purchase]
 }

 type Purchase {
    id: String
    contractorId: String
    productId: String
    status: PurchaseStatus
    expiresAt: String
    consumedAt: String
    appliedToAssignmentId: String
    createdAt: String

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
