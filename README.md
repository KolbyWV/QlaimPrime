# Qlaim Prime

Qlaim Prime is the earlier beta-tested version of Qlaim, a mobile workforce platform designed around structured assignments, member progression, and retail field execution.

This repository is preserved as a **portfolio case study and historical beta build**. It is not the current Qlaim architecture, but it demonstrates the product, backend, mobile, and infrastructure work required to move an idea from concept into real beta testing.

## Project Status

- Reached beta testing
- Superseded by a newer Qlaim architecture
- Maintained publicly as an engineering case study
- Not intended for production deployment without additional review and configuration

## What This Build Demonstrates

Qlaim Prime combines a cross-platform mobile application with a GraphQL backend and relational data model.

The project demonstrates experience with:

- Designing multi-role application workflows
- Building a mobile client with React Native and Expo
- Creating GraphQL schemas, resolvers, and authenticated operations
- Modeling users, profiles, companies, members, and assignments with Prisma
- Managing secure sessions and protected client storage
- Uploading assignment evidence through AWS S3
- Preparing mobile builds with Expo Application Services
- Adding API rate limiting, DataLoader, seed validation, and smoke testing
- Iterating from an initial product concept through beta feedback

## Architecture

```text
QlaimPrime/
├── app/       React Native and Expo mobile client
└── server/    Node.js, TypeScript, GraphQL, Prisma, and PostgreSQL API
```

## Mobile Application

The mobile client was built with:

- React Native
- Expo
- TypeScript
- Apollo Client
- React Navigation
- Expo SecureStore
- Expo ImagePicker
- Expo Application Services

The client supports authenticated navigation, secure token storage, role-aware experiences, image selection, and communication with the GraphQL API.

## Backend

The backend was built with:

- Node.js
- TypeScript
- Express 5
- Apollo Server 5
- GraphQL
- Prisma ORM
- PostgreSQL
- JSON Web Tokens
- Argon2 password hashing
- DataLoader
- Express rate limiting
- AWS S3 and presigned uploads

The server also includes seed-integrity checks, API smoke testing, and data backfill scripts used as the model evolved.

## Product Workflows

This beta explored workflows involving:

- Account registration and authentication
- Separate user and member profiles
- Company and workforce relationships
- Assignment discovery and participation
- Progression and performance systems
- Photo-based assignment evidence
- Role-specific mobile experiences

The current Qlaim product has continued to evolve beyond the implementation in this repository.

## Running Locally

This historical build contains separate application and server packages.

### Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Database setup and environment values are required for PostgreSQL, authentication, and AWS integrations.

Useful backend commands include:

```bash
npm run dev
npm run seed
npm test
npm run test:smoke:api
```

### Mobile App

```bash
cd app
npm install
npm start
```

Additional Expo configuration may be required to run native development builds.

## Engineering Lessons

Qlaim Prime was valuable because it moved beyond a static prototype. Reaching beta testing required more than building screens—it required coordinating authentication, data modeling, mobile navigation, backend workflows, file uploads, error handling, deployment configuration, and tester feedback.

The beta also exposed areas where the product model and architecture needed to evolve. Those lessons informed the newer version of Qlaim.

## Security and Deployment Notice

This repository represents an earlier beta implementation. Before using any portion in production, review:

- Environment and secret management
- Authentication and authorization rules
- Storage permissions and upload validation
- Input validation and error handling
- Database migrations and data retention
- Logging, monitoring, and incident response
- Current dependency and platform requirements

No production credentials should be committed to this repository.

## Author

Built by [Kolby Kinsey](https://github.com/GFKolby) as part of the Qlaim product development process.
