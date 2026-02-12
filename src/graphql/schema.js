export const typeDefs = `#graphql

 type Query {
    me: User
    user(id: String!): User
    profileByUsername(username: String!): Profile
    company(id: String!): Company
    companyMembers(companyId: String!): [Member]
    users: [User]
    companies: [Company]
    myCompanies: [Company]
    members: [Member]
 }

 type Mutation {
    refreshToken(refreshToken: String!): AuthPayload
    register(email: String!, password: String!): AuthPayload
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

`;
