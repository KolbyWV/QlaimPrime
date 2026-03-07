FRONTEND_PLAN.md
Qlaim Prime Frontend Plan (Expo RN + Web)
This plan breaks the frontend into systems (like we did for the server), defines the navigation + screen map for two distinct user experiences, and outlines a phased refactor/build plan starting at Phase 2 (because Phase 1 + some Phase 2 already happened).
We are not using UI Kitten / Eva.
1) Goals
Product Goals
Contractor app: find gigs, watchlist gigs, claim gigs, complete gigs, earn money + stars, buy perks/upgrades.
Company app: create gigs, manage gigs, review work, manage members, see history.
Engineering Goals
One Expo RN codebase that runs:
iOS / Android
Web via react-native-web
Clean theming + design system (Option 1)
Separate Contractor/Company experiences without “if role then…” scattered everywhere.
2) Platform Strategy
Approach
Expo + React Native for all platforms.
Web support as a first-class target (no “mobile-only assumptions”).
Web Rules
Avoid native-only modules unless they have web fallbacks.
Keep layouts flexible (no brittle absolute positioning).
Prefer scroll + responsive cards instead of fixed-height screens.
3) Key Decisions (Locked In)
Login Strategy: Option A
Mode select first → user picks Contractor or Company → separate auth flow.
Design System Strategy: Option 1
Token-based theming + custom primitives + domain components.
4) Frontend Systems Breakdown
Think of these as “modules” we build and wire together.
System A — App Shell
Expo config, routing, nav structure
Environment/config loader (API URL, feature flags)
Error boundary + global toasts
System B — Design System
Theme tokens (light/dark ready even if we start with one)
UI primitives (Text, Button, Input, Card, Screen, etc.)
Domain components (GigCard, UserSummaryCard, StarShop cards)
System C — Auth + Session
Mode selection (Contractor vs Company)
Login / Register / Forgot / Reset
Token storage + refresh flow
Logout
System D — Contractor Experience
Gig Feed
Gig Details
Claim + assignment lifecycle
Watchlist
StarShop
Profile + settings
System E — Company Experience
Company Dashboard
Manage Gigs (list + detail)
Create/Edit Gig
Review assignments
Company settings + members
System F — Data Layer
Apollo Client setup (GraphQL)
Query/mutation hooks
Cache rules
Pagination helpers
5) Navigation Architecture
Root Navigator (single source of truth)
Root decides where the user goes based on:
auth status
chosen mode (contractor/company)
Routes
ModeSelect
ContractorAuthStack
CompanyAuthStack
ContractorTabs
CompanyTabs
Contractor Tabs
Home (Gig Feed)
Watchlist
StarMarket
Profile
Company Tabs
Dashboard
Gigs
Reviews (or “Assignments”)
Settings
Rule: Contractor and Company navigators do not share tab stacks.
6) Screen Map
Shared (Pre-auth)
ModeSelectScreen
“I’m a Contractor” / “I’m a Company”
Sets roleIntent in session context (not the backend role)
Optional: About / Marketing (web-friendly)
Contractor Auth Stack
ContractorLogin
ContractorRegister
ContractorForgotPassword
ContractorResetPassword (if deep link flow exists)
Company Auth Stack
CompanyLogin
CompanyRegister (optional: company creation step)
CompanyForgotPassword
CompanyResetPassword
Contractor App Screens
Home (Gig Feed)
GigFeedScreen
list of gigs
filters (later)
quick “save/watch” toggle
Gig Details
GigDetailScreen
price, location, time window, type
stars reward (base + computed bonuses)
countdown timer (if endsAt)
CTA: Claim
Assignment Flow
MyAssignmentsScreen
AssignmentDetailScreen
Update status actions: STARTED → SUBMITTED → REVIEWED/COMPLETED
Watchlist
WatchlistScreen
search box
saved gigs
StarShop
StarShopScreen
Membership upgrades
Cash bonuses / boosts
PurchaseConfirmModal (later)
Profile
ProfileScreen
rating, tier, stars balance
AccountSettings
sign out
edit avatar (later)
change password (later)
Transactions
StarsTransactionList
MoneyTransactionList
Purchases
active/expired/consumed
Company App Screens
Dashboard
CompanyDashboardScreen
high level: open gigs, claimed gigs, pending reviews
Gigs
CompanyGigsListScreen
CompanyGigDetailScreen
CreateGigScreen
EditGigScreen
Reviews / Assignments
CompanyAssignmentsScreen (by gig or global)
ReviewAssignmentScreen (stars rating + approve/reject + comment)
Settings
CompanySettingsScreen
MembersScreen
MemberDetailScreen
AddMemberScreen (owner-only)
RoleManagementScreen (owner-only)
7) UX & Visual Style Notes
Based on your screenshots:
“Card-forward” layouts (simple, clean, readable)
Strong primary CTA button
Clear hierarchy (big title + muted subtitle + action area)
Bottom tab nav
A consistent “summary card” at the top for profile/stars/tier
We’ll codify that into:
UserSummaryCard
GigCard
SectionHeader
ListEmptyState
8) Theming Plan
Theme baseline (recommended)
Start with a single theme (light) but implement in a way that supports dark later.
Tokens cover:
background, surface, text, brand, status, border
spacing, radius, typography
Styling rules
No hardcoded colors in screens.
No random font sizes in screens.
Screens should read like layout glue, not a paint studio.
9) Phased Execution Plan (Starting at Phase 2)
Phase 2A — Refactor Foundations (now)
Goal: get the project into a stable architecture shape.
Deliverables:
Remove UI Kitten/Eva usage entirely
Normalize navigation to RootNavigator
Implement auth mode selection (Option A)
Create theme token scaffolding + minimal primitives (even stubbed)
Exit criteria:
App boots on iOS/Android/Web
ModeSelect → Auth → placeholder app screens
No UI Kitten imports remain
Phase 2B — Design System Core
Goal: primitives + tokens become the only way to build UI.
Deliverables:
tokens + theme provider
primitives: Text/Button/Input/Card/Screen
patterns: loading states, empty states, error states
Exit criteria:
A few screens migrated cleanly (Login, Profile stub)
Styling consistency is obvious
Phase 2C — Screen Migration (“refactor the refactor”)
Goal: convert existing screens to new primitives + domain components.
Deliverables:
Contractor: Login + Home + Watchlist + Profile using primitives
Company: Login + Dashboard stub
Exit criteria:
No legacy UI components driving styling
Screens are lean
Phase 3 — Contractor MVP (connected)
Goal: Contractor experience functional end-to-end with backend.
Deliverables:
Auth wired to GraphQL
Gig feed query + pagination
Gig detail query
Claim gig mutation
My assignments query
Exit criteria:
Contractor can login → view gigs → claim → see assignment
Phase 4 — Company MVP (connected)
Goal: Company can create gigs and review.
Deliverables:
Company login
Create/update gig
View gig assignments
Review assignment + approval
Exit criteria:
Company can post gig → contractor claims → company reviews
10) Codex Ticket Format
When we feed tasks into Codex, each ticket should include:
Goal
Files likely touched
Acceptance criteria
Notes about tokens/primitives rules
Example ticket title style:
NAV-001 RootNavigator with ModeSelect + Dual Auth
DS-002 Implement Button primitive (variants + loading)
WORK-101 GigFeed wired to gigs query
11) Immediate “Next 10 Tickets” (Phase 2A Starter Pack)
NAV-001 RootNavigator + ModeSelect + ContractorAuthStack + CompanyAuthStack
AUTH-001 Auth context scaffolding (roleIntent, tokens, status)
CLEAN-001 Remove UI Kitten/Eva dependencies + imports + dead theme files
THEME-001 Token scaffold (tokens/light/dark + ThemeProvider)
DS-001 Screen primitive (safe area + padding + background)
DS-002 Text primitive (variants)
DS-003 Button primitive (variants + loading)
DS-004 Input primitive (label + error + icon slot)
AUTH-002 ContractorLogin screen rebuilt using primitives
AUTH-003 CompanyLogin screen rebuilt using primitives
12) Definition of Done
A feature is “done” when:
Uses design tokens + primitives
Works on iOS + Android + Web
Navigation is role-separated (no role conditionals scattered)
No UI Kitten/Eva remnants