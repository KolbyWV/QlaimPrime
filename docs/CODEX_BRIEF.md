CODEX_BRIEF.md
Project: Qlaim Prime Frontend
This document defines the architecture, constraints, and development rules for the Qlaim Prime frontend. Codex must treat this file as the source of truth when implementing changes.
1. Project Overview
Qlaim Prime is a dual-mode platform connecting:
Contractors (gig contractors earning money + stars)
Companies (businesses posting and managing gigs)
This is a single Expo React Native codebase targeting:
iOS
Android
Web (via react-native-web)
We are NOT using UI Kitten or Eva.
We are using a custom design system (Option 1) driven by theme tokens.
2. Core Architectural Principles
One codebase.
Two experiences.
Strict separation between:
Theme tokens
UI primitives
Domain components
Screens
Screens do NOT define new visual systems.
No hardcoded colors in screens.
No UI libraries like UI Kitten or NativeBase.
All styling must derive from theme tokens.
3. Authentication Strategy (Option A)
We use separate login experiences for Contractor and Company.
Flow:
Root
├── ModeSelectScreen
├── ContractorAuthStack
├── CompanyAuthStack
├── ContractorAppNavigator
└── CompanyAppNavigator
User chooses mode BEFORE login.
Auth context stores:
{
  user: User | null,
  token: string | null,
  role: 'contractor' | 'company' | null,
  status: 'loading' | 'authenticated' | 'unauthenticated'
}
After successful login:
If role === 'contractor' → ContractorAppNavigator
If role === 'company' → CompanyAppNavigator
There must be no conditional rendering scattered throughout screens. Routing logic lives only in navigation.
4. Navigation Structure
Contractor App Tabs
Home (Gig feed)
Watchlist
StarShop (store)
Profile
Company App Tabs
Dashboard
Manage Gigs
Applicants / Contractors
Company Settings
Each app has its own Tab Navigator.
Do not mix Contractor and Company screens in the same tab navigator.
5. Design System Strategy (Option 1)
We use a custom token-based design system.
Folder Structure
src/
  theme/
    tokens.ts
    light.ts
    dark.ts
    index.ts

  components/
    ui/
      Text.tsx
      Button.tsx
      Input.tsx
      Card.tsx
      Screen.tsx
      Row.tsx
      Spacer.tsx

    domain/
      GigCard.tsx
      UserSummaryCard.tsx
      StarUpgradeCard.tsx
      WatchlistItem.tsx
6. Theme Tokens
All visual values must come from tokens.
Required Tokens
Colors
background.primary
background.secondary
surface.1
surface.2

text.primary
text.secondary
text.muted

brand.primary
brand.accent

status.success
status.warning
status.error

border.default
Spacing
xs
sm
md
lg
xl
Radius
sm
md
lg
pill
Typography
h1
h2
h3
body
caption
label
No hardcoded font sizes in screens.
7. UI Primitives (Required)
Codex must implement these before modifying screens:
Text (variant-based)
Button (primary, secondary, ghost, destructive, loading)
Input (label, error, optional icon)
Card
Screen (safe area + background + padding)
Spacer (optional utility)
Row (horizontal layout helper)
All screens must use these components.
8. Domain Components
These are reusable business components built from primitives:
GigCard
UserSummaryCard
MembershipUpgradeCard
BonusCard
WatchlistCard
These must not contain raw styling outside tokens.
9. Refactor Rules
We are currently refactoring the refactor.
Required Cleanup
Remove any UI Kitten imports.
Remove legacy router if it exists.
Ensure only one navigation entry (RootNavigator).
Remove unused theme.json or Eva artifacts.
No duplicate navigation structures.
10. Contractor Experience Guidelines
Contractor screens should emphasize:
Earnings first
Stars as gamification layer
Clear CTA buttons (green = primary action)
Card-based gig layout
Gig detail screen must support:
Price
Stars reward
Countdown timer
Claim button
11. Company Experience Guidelines
Company UI should feel:
Structured
Data-oriented
Slightly more dashboard-like
Reuse UI primitives but adjust layout density.
12. Web Compatibility Rules
Avoid native-only APIs without web fallback.
Use platform-safe styling.
Avoid absolute positioning unless necessary.
Test tab navigation on web.
13. Phase Execution Plan
Phase 2A
Clean navigation
Remove UI Kitten
Finalize RootNavigator
Implement mode-based routing
Phase 2B
Implement theme tokens
Implement UI primitives
Phase 2C
Convert existing screens to use primitives
Phase 3
Wire Contractor flow to backend
Gig feed
Gig detail
Claim action
Phase 4
Company dashboard
Gig creation
Applicant management
14. Code Discipline Rules
No inline styles in screens beyond layout exceptions.
No magic numbers.
No direct color strings.
No duplicated components.
Every new component must use theme tokens.
15. Definition of Done
A feature is complete when:
Uses primitives only
Uses theme tokens only
Works on iOS, Android, Web
No UI Kitten imports exist
Navigation flows correctly by role
End of brief.