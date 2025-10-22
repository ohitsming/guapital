# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Guapital** is a modern, privacy-first financial application for Gen Z wealth builders (ages 24-35) to track net worth across traditional and modern assets. Targets users with $50K-$500K net worth who hold a mix of traditional investments, cryptocurrency, and emerging assets.

**Core Value Proposition:** Single, reliable source of truth for net worth calculation across all asset classes - without budget shame, sync failures, or feature bloat.

**Key Differentiators:**
- Wealth-building mindset (not penny-pinching budgeting)
- First-class crypto/DeFi wallet integration
- Gamified percentile rankings (anonymous, opt-in)
- Beautiful, mobile-first UX for daily engagement
- Privacy-first monetization (paid subscriptions, never selling data)

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS v4
- **Database & Auth:** Supabase (RLS enabled)
- **Deployment:** AWS Amplify
- **Financial Data:** Plaid (account aggregation), Alchemy (crypto tracking)
- **Charting:** Recharts
- **Additional:** Stripe, Framer Motion, date-fns, axios

## Development Commands

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run lint             # Run ESLint
npm run test             # Run Jest tests
```

## Architecture Overview

### Directory Structure (Complete)

```
/
├── documentations/
│   ├── API_COST_ANALYSIS.md              # Detailed API cost breakdown and projections
│   ├── PERCENTILE_RANKING_SPEC.md        # Original spec for percentile feature
│   ├── PERCENTILE_DATA_STRATEGY.md       # Hybrid data strategy documentation
│   ├── PERCENTILE_DEPLOYMENT_GUIDE.md    # Production deployment checklist
│   ├── PERCENTILE_IMPLEMENTATION_COMPLETE.md  # Implementation summary
│   └── research.md                        # Market research and competitor analysis
├── scripts/
│   ├── process-scf-data.py               # SCF data transformation script
│   ├── scf_seed_data.json                # Federal Reserve Survey of Consumer Finances seed data
│   ├── generate-test-snapshots.sql       # Testing utility
│   └── cleanup-duplicate-plaid-accounts.sql  # Database maintenance
├── supabase/
│   └── migrations/
│       ├── 001_create_guapital_schema.sql         # Core database schema
│       ├── 002_add_manual_entry_types.sql         # Manual asset types
│       ├── 002_add_subscription_tier.sql          # Subscription system
│       ├── 003_add_mortgage_category.sql          # Mortgage support
│       ├── 004_add_snapshot_recording.sql         # Net worth snapshots
│       ├── 004_add_unique_constraints_plaid.sql   # Plaid data integrity
│       ├── 005_percentile_ranking.sql             # Percentile feature (main)
│       ├── 005_percentile_ranking_CONSOLIDATED.sql # Consolidated version
│       ├── 006_fix_user_demographics_rls.sql      # RLS policy fixes
│       ├── 007_create_opt_in_function.sql         # Percentile opt-in
│       ├── 008_fix_age_bracket_trigger.sql        # Age bracket automation
│       ├── 009_fix_percentile_ambiguous_column.sql # Query optimization
│       ├── 010_fix_percentile_calculation.sql     # Calculation improvements
│       ├── 011_add_consent_timestamp.sql          # Privacy compliance
│       └── README_PERCENTILE.md                   # Percentile migration guide
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── assets/
│   │   │   │   ├── [id]/route.ts          # Update/delete specific asset
│   │   │   │   └── route.ts               # Create/list manual assets
│   │   │   ├── cashflow/
│   │   │   │   └── monthly/route.ts       # Monthly cash flow calculation
│   │   │   ├── crypto/
│   │   │   │   ├── sync-wallet/route.ts   # Alchemy wallet sync
│   │   │   │   └── wallets/route.ts       # CRUD crypto wallets
│   │   │   ├── founding-members/
│   │   │   │   └── remaining/route.ts     # Founding member slots counter
│   │   │   ├── networth/
│   │   │   │   ├── history/route.ts       # Historical net worth data
│   │   │   │   ├── snapshot/route.ts      # Daily snapshot recording
│   │   │   │   └── route.ts               # Current net worth calculation
│   │   │   ├── percentile/
│   │   │   │   ├── distribution/route.ts  # Age bracket distribution data
│   │   │   │   ├── opt-in/route.ts        # Opt in/out of percentile tracking
│   │   │   │   └── route.ts               # Get user's percentile rank
│   │   │   ├── plaid/
│   │   │   │   ├── accounts/route.ts      # Fetch Plaid accounts
│   │   │   │   ├── create-link-token/route.ts # Plaid Link initialization
│   │   │   │   ├── exchange-token/route.ts # Exchange public token
│   │   │   │   ├── sync-accounts/route.ts  # Sync account balances
│   │   │   │   ├── sync-transactions/route.ts # Sync transactions
│   │   │   │   └── transactions/route.ts   # Fetch transaction history
│   │   │   └── supabase/
│   │   │       ├── auth/
│   │   │       │   ├── callback/route.ts  # OAuth callback handler
│   │   │       │   └── oauth/route.ts     # OAuth initiation
│   │   │       ├── general/
│   │   │       │   ├── interests/route.ts # User interests
│   │   │       │   └── onboarding-status/route.ts # Onboarding state
│   │   │       └── settings/
│   │   │           ├── business-profile/route.ts
│   │   │           ├── profile/route.ts
│   │   │           ├── update-profile/route.ts
│   │   │           ├── user-profiles/route.ts
│   │   │           └── user-settings/route.ts
│   │   ├── about/page.tsx                 # About page
│   │   ├── auth/
│   │   │   ├── auth-code-error/page.tsx   # Auth error handler
│   │   │   └── confirm/
│   │   │       ├── success/page.tsx       # Email confirmation success
│   │   │       └── update-password/page.tsx # Password reset
│   │   ├── contact/page.tsx               # Contact page
│   │   ├── dashboard/
│   │   │   ├── accounts/page.tsx          # Accounts management page
│   │   │   ├── budget/page.tsx            # Budget/cash flow insights
│   │   │   ├── reports/page.tsx           # Advanced reports (Premium)
│   │   │   ├── transactions/page.tsx      # Transaction history (Premium)
│   │   │   ├── layout.tsx                 # Dashboard layout wrapper
│   │   │   └── page.tsx                   # Main dashboard
│   │   ├── login/
│   │   │   ├── forgot-password/page.tsx   # Password reset
│   │   │   └── page.tsx                   # Login page
│   │   ├── pricing/page.tsx               # Pricing page
│   │   ├── privacy/page.tsx               # Privacy policy
│   │   ├── signup/
│   │   │   ├── check-email/page.tsx       # Email verification prompt
│   │   │   └── page.tsx                   # Signup page
│   │   ├── terms/page.tsx                 # Terms of service
│   │   ├── layout.tsx                     # Root layout
│   │   ├── not-found.tsx                  # 404 page
│   │   └── page.tsx                       # Landing page
│   ├── components/
│   │   ├── accounts/
│   │   │   ├── AccountsPageContent.tsx    # Accounts page main component
│   │   │   └── AccountsList.tsx           # List of accounts
│   │   ├── assets/
│   │   │   ├── AddAssetButton.tsx         # Add manual asset button
│   │   │   ├── AddAssetModal.tsx          # Add asset modal form
│   │   │   ├── AssetsList.tsx             # List of assets
│   │   │   ├── EditAssetModal.tsx         # Edit asset modal
│   │   │   └── ManualAssetsSection.tsx    # Unified accounts panel (Plaid + manual + crypto)
│   │   ├── business-onboarding/           # Legacy business onboarding
│   │   │   ├── BusinessOnboardingStep1.tsx
│   │   │   ├── BusinessOnboardingStep2.tsx
│   │   │   └── BusinessOnboardingStep3.tsx
│   │   ├── budget/
│   │   │   ├── BudgetPageContent.tsx      # Budget page main component
│   │   │   └── CashFlowInsights.tsx       # Monthly cash flow analysis
│   │   ├── crypto/
│   │   │   ├── AddWalletButton.tsx        # Add wallet button
│   │   │   ├── AddWalletModal.tsx         # Add crypto wallet modal
│   │   │   └── WalletsList.tsx            # List of crypto wallets
│   │   ├── dashboard/
│   │   │   ├── AssetBreakdownPanel.tsx    # Asset breakdown chart
│   │   │   ├── DashboardContent.tsx       # Main dashboard layout
│   │   │   ├── DashboardHeader.tsx        # Dashboard header
│   │   │   ├── DashboardNav.tsx           # Dashboard navigation
│   │   │   ├── EmptyState.tsx             # Empty state component
│   │   │   ├── GetStartedView.tsx         # Onboarding view for new users
│   │   │   ├── HeroNetWorthCard.tsx       # Net worth card with trend chart
│   │   │   ├── LiabilityBreakdownPanel.tsx # Liability breakdown chart
│   │   │   ├── ManualAssetsPanel.tsx      # Manual assets panel
│   │   │   ├── MonthlyCashFlowPanel.tsx   # Cash flow panel
│   │   │   └── RecentTransactionsPanel.tsx # Recent transactions
│   │   ├── earner-onboarding/             # Legacy earner onboarding
│   │   │   ├── EarnerOnboardingReview.tsx
│   │   │   ├── EarnerOnboardingStep1.tsx
│   │   │   ├── EarnerOnboardingStep2.tsx
│   │   │   ├── EarnerOnboardingStep3.tsx
│   │   │   ├── EarnerOnboardingStep4.tsx
│   │   │   ├── EarnerOnboardingStep5.tsx
│   │   │   └── EarnerOnboardingStep6.tsx
│   │   ├── percentile/
│   │   │   ├── PercentileLearnMoreModal.tsx # Data transparency modal
│   │   │   ├── PercentileOptInModal.tsx    # Opt-in onboarding modal
│   │   │   └── PercentileRankCard.tsx      # Percentile rank display card
│   │   ├── plaid/
│   │   │   └── PlaidLinkButton.tsx        # Plaid Link integration
│   │   ├── pricing/
│   │   │   ├── FoundingMemberBanner.tsx   # Founding member promo banner
│   │   │   ├── PricingCard.tsx            # Pricing tier card
│   │   │   └── PricingSection.tsx         # Pricing section component
│   │   ├── reports/
│   │   │   └── ReportsPageContent.tsx     # Reports page main component
│   │   ├── settings/
│   │   │   ├── AccountSettings.tsx        # Account settings
│   │   │   ├── BillingSettings.tsx        # Billing settings
│   │   │   └── BusinessProfileSettings.tsx # Business profile
│   │   ├── toast/
│   │   │   ├── Toast.tsx                  # Toast notification component
│   │   │   └── ToastProvider.tsx          # Toast context provider
│   │   ├── transactions/
│   │   │   └── TransactionsPageContent.tsx # Transactions page main component
│   │   ├── ui/
│   │   │   ├── AddAccountDropdown.tsx     # Unified add account dropdown
│   │   │   └── Dropdown.tsx               # Generic dropdown component
│   │   ├── AnimatedText.tsx               # Text animation component
│   │   ├── AppSidebar.tsx                 # App sidebar navigation
│   │   ├── Blockquote.tsx                 # Blockquote component
│   │   ├── Border.tsx                     # Border component
│   │   ├── Button.tsx                     # Button component
│   │   ├── ContactSection.tsx             # Contact section
│   │   ├── Container.tsx                  # Container wrapper
│   │   ├── CriteriaDisplay.tsx            # Criteria display
│   │   ├── EmailSignupForm.tsx            # Email signup form
│   │   ├── FadeIn.tsx                     # Fade-in animation
│   │   ├── FaqSection.tsx                 # FAQ section
│   │   ├── FeatureSection.tsx             # Feature section
│   │   ├── Footer.tsx                     # Footer component
│   │   ├── GrayscaleTransitionImage.tsx   # Image transition effect
│   │   ├── GridList.tsx                   # Grid list component
│   │   ├── GridPattern.tsx                # Grid pattern background
│   │   ├── Hero3DAnimation.tsx            # 3D hero animation
│   │   ├── HeroInteractive.tsx            # Interactive hero
│   │   ├── InfoTooltip.tsx                # Tooltip component
│   │   ├── LetterAvatar.tsx               # Avatar component
│   │   ├── List.tsx                       # List component
│   │   ├── LoadingOverlay.tsx             # Loading overlay
│   │   ├── Logo.tsx                       # Logo component
│   │   ├── LoginForm.tsx                  # Login form
│   │   ├── MDXComponents.tsx              # MDX components
│   │   ├── Modal.tsx                      # Modal component
│   │   ├── Offices.tsx                    # Offices component
│   │   ├── PageIntro.tsx                  # Page intro
│   │   ├── PageLinks.tsx                  # Page links
│   │   ├── RatingInput.tsx                # Rating input
│   │   ├── RootLayout.tsx                 # Root layout wrapper
│   │   ├── SectionIntro.tsx               # Section intro
│   │   ├── SelectField.tsx                # Select field
│   │   ├── SharedDashboardLayout.tsx      # Shared dashboard layout
│   │   ├── SidebarLinkGroup.tsx           # Sidebar link group
│   │   ├── SignupForm.tsx                 # Signup form
│   │   ├── SocialMedia.tsx                # Social media links
│   │   ├── StatList.tsx                   # Stat list
│   │   ├── StylizedImage.tsx              # Stylized image
│   │   ├── SurveyModeSelector.tsx         # Survey mode selector
│   │   ├── Tabs.tsx                       # Tabs component
│   │   ├── TagList.tsx                    # Tag list
│   │   ├── Testimonial.tsx                # Testimonial component
│   │   └── TextField.tsx                  # Text field
│   ├── fonts/
│   │   └── Mona-Sans.var.woff2            # Custom font
│   ├── images/
│   │   ├── screenshots/                   # App screenshots
│   │   └── [various image assets]         # Marketing images
│   ├── lib/
│   │   ├── context/
│   │   │   ├── CampaignFormContext.tsx    # Campaign form context
│   │   │   └── SubscriptionContext.tsx    # Subscription tier context
│   │   ├── interfaces/
│   │   │   ├── account.ts                 # Account interfaces
│   │   │   ├── asset.ts                   # Asset interfaces
│   │   │   ├── budget.ts                  # Budget interfaces
│   │   │   ├── businessStats.ts           # Business stats
│   │   │   ├── criteria.ts                # Criteria interfaces
│   │   │   ├── crypto.ts                  # Crypto interfaces
│   │   │   ├── earner.ts                  # Earner interfaces
│   │   │   ├── earnerTask.ts              # Earner task interfaces
│   │   │   ├── networth.ts                # Net worth interfaces
│   │   │   ├── percentile.ts              # Percentile interfaces
│   │   │   ├── plaid.ts                   # Plaid interfaces
│   │   │   ├── recentTask.ts              # Recent task interfaces
│   │   │   ├── stat.ts                    # Stat interfaces
│   │   │   ├── subscription.ts            # Subscription interfaces
│   │   │   ├── survey.ts                  # Survey interfaces
│   │   │   └── task.ts                    # Task interfaces
│   │   ├── mock-data/
│   │   │   └── dashboard.ts               # Mock dashboard data
│   │   ├── stripe/
│   │   │   └── stripeCalculator.ts        # Stripe pricing calculator
│   │   ├── types/
│   │   │   ├── common.ts                  # Common types
│   │   │   └── earner-onboarding.ts       # Earner onboarding types
│   │   ├── constant.ts                    # App constants (WEB_NAME, URLs)
│   │   ├── env.ts                         # Environment variable validation
│   │   ├── featureFlags.ts                # Feature flags
│   │   ├── formatDate.ts                  # Date formatting
│   │   ├── mdx.ts                         # MDX utilities
│   │   ├── permissions.ts                 # Feature access by tier
│   │   ├── quota.ts                       # Usage quotas
│   │   └── supabaseClient.ts              # Supabase client instance
│   ├── styles/
│   │   ├── base.css                       # Base styles
│   │   └── typography.css                 # Typography styles
│   └── utils/
│       ├── supabase/
│       │   ├── client.ts                  # Client-side Supabase
│       │   └── server.ts                  # Server-side Supabase
│       ├── avatarUtils.ts                 # Avatar utilities
│       ├── formatters.ts                  # Currency, date formatting
│       └── timeUtils.ts                   # Time utilities
├── .eslintrc.json                         # ESLint configuration
├── jest.config.js                         # Jest configuration
├── next.config.mjs                        # Next.js configuration
├── package.json                           # Dependencies
├── postcss.config.js                      # PostCSS configuration
├── prettier.config.js                     # Prettier configuration
├── tsconfig.json                          # TypeScript configuration
└── CLAUDE.md                              # This file
```

### Database Schema

**Core Tables:**
- `plaid_items`, `plaid_accounts`, `plaid_transactions` - Plaid integration
- `crypto_wallets`, `crypto_holdings` - Crypto tracking
- `manual_assets`, `manual_asset_history` - Manual entry
- `net_worth_snapshots` - Daily historical tracking
- `user_demographics`, `user_settings` - User data & preferences
- `percentile_seed_data` - Federal Reserve SCF 2022 benchmark data (49 records)
- `percentile_snapshots` - Daily percentile calculations per user
- `percentile_milestones` - Achievement tracking (Top 50%, 25%, 10%, etc.)

**Security:** RLS enabled on all tables, users can only access their own data

### Authentication Pattern

**API Route Pattern:**
```typescript
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    // Query logic here
}
```

**Client Usage:**
- Server Components/API Routes: `createClient()` from `@/utils/supabase/server`
- Client Components: `createClient()` from `@/utils/supabase/client`

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`
- `ALCHEMY_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### Styling & Design

- **Primary Color:** Dark Teal (#004D40, hover: #00695C)
- **Accent Color:** Vibrant Gold/Amber (#FFC107)
- **Backgrounds:** Off-white (#F7F9F9), Near-black (#12181B)
- Tailwind CSS v4 with Framer Motion animations
- Custom components: Button, TextField, SelectField, Dropdown

## Ideal Customer Profile (ICP)

**Primary Target:** Tech-savvy wealth builders, ages 24-35
- Income: $75K-$200K/year (tech workers, consultants, entrepreneurs)
- Net Worth: $50K-$500K (sweet spot: $100K-$300K)
- Asset Mix: 401(k), brokerage, crypto (1-3 wallets), HYSA, some RSUs
- "I'm building wealth, not surviving paycheck to paycheck"
- Willing to pay $15-25/mo for quality tools that work reliably

## Implementation Status

**Phase 1 MVP Completion: ~95%**

| Feature | Status | Priority | Details |
|---------|--------|----------|---------|
| **Project Foundation** | ✅ Done | - | Database schema with RLS, TypeScript interfaces, subscription tiers |
| **Account Aggregation (Plaid)** | ✅ Done | - | Fully integrated in unified Accounts panel |
| **Manual Asset Entry** | ✅ Done | - | Complete CRUD for real estate, vehicles, collectibles, liabilities |
| **Net Worth Dashboard** | ✅ Done | - | Hero card, asset/liability breakdowns, real-time calculation |
| **Subscription Tiers** | ✅ Done | - | Free/Premium tiers with feature gating ($79/$99 annually) |
| **Unified Accounts UI** | ✅ Done | - | Single panel showing Plaid + manual + crypto entries |
| **Historical Snapshots** | ✅ Done | - | Daily cron job, trend chart with ghost state |
| **Sidebar Navigation** | ✅ Done | - | Dashboard, Accounts, Transactions (Premium+), Reports (Premium+) |
| **Transaction History** | ✅ Done | - | Filters, search, sync, AI categorization (Premium+) |
| **Advanced Reports** | ✅ Done | - | Net worth trends, breakdowns with charts (Premium+) |
| **Crypto Wallet Tracking** | ✅ Done | - | Multi-chain support (Ethereum, Polygon, Base, Arbitrum, Optimism) |
| **Pricing & Subscription** | ✅ Done | - | Founding member offer, Stripe integration |
| **Percentile Ranking** | ✅ Done | **#1** | **THE killer feature** - Hybrid SCF + real user data, opt-in modal, percentile card, distribution charts |
| **FIRE Calculator** | ❌ Not Started | **#2** | Years to FI, required net worth, withdrawal scenarios - Aligns with wealth-building positioning |

### Key Recent Updates (October 2025)

- **Percentile Ranking** ✅ - Complete implementation with hybrid SCF data strategy
  - Backend: 3 new database tables, daily cron job, percentile calculation function
  - API: 3 endpoints (percentile, opt-in, distribution)
  - Frontend: Opt-in modal, percentile rank card, learn more modal
  - Data: Federal Reserve SCF 2022 seed data (49 records across 7 age brackets)
  - Integration: Seamlessly integrated into dashboard with auto-prompt after 2 seconds
- **Dashboard simplified** - Removed tabs for single-view design
- **Transactions page** - Complete with filters, stats, sync (Premium+)
- **Reports page** - Historical trends, breakdowns (Premium+)
- **Premium gate fixes** - Loading state prevents flashing banner bug
- **Crypto integration** - Unified UI with AddAccountDropdown
- **Pricing overhaul** - 2-tier structure, founding member offer ($79/year)
- **Historical snapshots** - Ghost chart empty state, smart single-point display

### Next Steps

**Critical Priorities (Week 1):**
1. **FIRE Calculator** (2-3 days) - Aligns with wealth-building positioning
   - Years to Financial Independence calculator
   - Required net worth for FI
   - Withdrawal rate scenarios (4% rule, etc.)
   - Progress visualization

**Secondary Priorities (Week 2):**
2. Mobile responsiveness testing (2-3 days)
3. End-to-end user flow testing (2-3 days)
4. Performance optimization (1-2 days)

**Pre-Production Deployment:**
5. Apply percentile migrations to production Supabase (30 minutes)
6. Enable pg_cron extension (10 minutes)
7. Create test users and verify percentile calculations (1-2 hours)
8. Configure Stripe production products (1 hour)
9. Social OAuth production URL configuration (1 hour)

**On Hold:**
- Budgeting features (not core differentiator vs. Monarch - revisit post-launch)
- Social sharing for percentile milestones (Phase 2)
- Milestone achievement badges (Phase 2)

**Estimated Time to Launch-Ready MVP:** 5-7 days

**Major Milestone Achieved:** Percentile ranking is complete! This is THE killer feature that differentiates us from Monarch Money.

## Project Roadmap

### Phase 1: MVP (Months 1-6)

**Goal:** Prove product-market fit with 1,000 paying users

**Core Features:**

1. **Account Aggregation (Plaid)** - Traditional accounts (checking, savings, credit, loans, investments) with reliable sync
2. **Crypto Wallet Tracking** - Read-only balances via Alchemy (Ethereum, Polygon, Base)
3. **Manual Asset Entry** - Real estate, vehicles, private equity, collectibles
4. **Net Worth Dashboard** - Big number, trend charts (30/90/365 days), asset/liability breakdowns
5. **Percentile Ranking** - "You're in the top X% of users in your age group" (viral loop for screenshots)
6. **FIRE Calculator** - Calculate years to Financial Independence, required net worth for FI, withdrawal rate scenarios, progress visualization

**Explicitly NOT Included in Phase 1:**
- ❌ Budgeting features (conflicts with "wealth-building, not penny-pinching" positioning)
- ❌ Budget goals or envelope systems (YNAB/Monarch already excel here)
- Note: Passive spending insights (Cash Flow panel) already built but de-emphasized in navigation

**Success Metrics (12-Month Goals):**
- 5,000 total users, 1,000 paying (20% conversion)
- $240K ARR, <5% monthly churn

### Phase 2: Feature Expansion (Months 7-18)

**Focus:** Expand based on user feedback, improve retention

**Planned Features:**
- Multi-aggregator redundancy (Yodlee backup)
- Advanced DeFi tracking (staking, LP tokens)
- Investment performance analytics
- Tax export (CSV/PDF)
- Shared accounts for partners
- Referral program
- Mobile app

**Reconsidered if User Demand Exists:**
- Passive spending insights (no budget goals, just "where money went")
- Only if 20%+ of users request it
- Frame as "Spending Insights" not "Budgeting"
- Never include budget shame mechanics

**Success Metrics:** 25,000 users, 5,000 paying, $1.2M ARR

### Phase 3: Scale (Months 19-36)

- Advanced tax optimization
- Financial advisor integrations
- API access for power users
- White-label solutions

**Success Metrics:** 100,000+ users, 20,000+ paying, $5M+ ARR

## Pricing Strategy

**AGGRESSIVE GROWTH STRATEGY:** 2-tier pricing to undercut competitors. First 1,000 users lock in founding member pricing forever.

### Free Tier
- Unlimited manual entry (no auto-sync)
- Up to 2 crypto wallets (auto-sync via Alchemy)
- 30-day history
- Percentile ranking preview
- FIRE calculator with basic features

### Premium Tier
**Price:**
- **Founding Members (First 1,000):** $79/year forever
- **Regular Pricing:** $99/year

**Features (UNLIMITED EVERYTHING):**
- Unlimited Plaid accounts, crypto wallets, manual assets
- Full 365-day history
- Full percentile ranking + leaderboard
- Advanced FIRE calculator with scenarios
- AI transaction categorization
- Complete transaction history
- Advanced reports and analytics
- CSV export

**Competitive Positioning:**
- 45% cheaper than Monarch Money ($180/year)
- 9% cheaper than YNAB ($109/year)
- Only app with UNLIMITED crypto wallets at this price

### Pricing Rationale

- **Annual-only pricing** reduces churn, improves cash flow
- **Founding member strategy** creates urgency, builds loyal community
- **Value-based pricing:** Users save 2-5 hours/month (worth $50-200 at their hourly rate)
- **Target:** 1,000 paying = $99K ARR (Year 1), 5,000 paying = $495K ARR (Year 2)

## Financial Projections & Unit Economics

### API & Infrastructure Costs

**Detailed Cost Breakdown (per user/month):**

| Service | Cost Structure | Monthly Cost (5K users) | Per User |
|---------|---------------|-------------------------|----------|
| **Plaid** | $0.60/account + $0.50/transaction | $4,500 | $0.90 |
| **Alchemy** | 100M compute units free, then $199/mo | $0 (within free tier) | $0 |
| **CoinGecko** | Free tier (50 calls/min) | **$0** | $0 |
| **Supabase Pro** | $25/mo | $25 | $0.005 |
| **Claude Max** | $351/mo (developer) | $351 | $0.07 |
| **AWS Amplify** | ~$0-20/mo | $10 | $0.002 |
| **Stripe** | 2.9% + $0.30/transaction | $1,290 | $0.26 |
| **Total** | - | **$6,166** | **$1.23** |

**Important Notes:**
- **CoinGecko actual cost: $0/month** - Currently only pricing native tokens (ETH, MATIC), well within free tier limits
- **Limitation:** ERC20 tokens show $0 USD value (known limitation, acceptable for MVP)
- **Stripe optimization:** Annual billing = 3.20% effective rate vs 4.93% for monthly
- **Alchemy scaling:** Crypto tracking remains free up to ~5K users with moderate usage

**Cost per User by Scale:**
- **1,000 users:** $1.33/user/month (including Stripe)
- **5,000 users:** $1.23/user/month
- **25,000 users:** $1.09/user/month (economies of scale)

### Realistic Profit Projections

**Important:** The 87.9% gross margin is **API/infrastructure costs only**. Real-world net margins after operating expenses:

**Operating Expenses Not Yet Included:**
- Founder compensation (bootstrapped: $0-5K/mo depending on runway)
- Customer support (scales with users: ~$500-2K/mo at 5K users)
- Marketing/Customer Acquisition Cost (~$50-100 CAC)
- Legal, accounting, design (~$500-1K/mo)

**Realistic Net Margin: 15-25%** (similar to profitable SaaS competitors)

**Profit Projections at Different Scales:**

| Users | Monthly Revenue | Gross Profit (87.9%) | Operating Expenses | **Net Profit/Mo** | **Annual Net Profit** | **Net Margin** |
|-------|----------------|----------------------|-------------------|-------------------|----------------------|----------------|
| 1,000 | $9,950 | $8,624 | ~$5,000 | **$3,600** | **$43K** | **36%** |
| 5,000 | $47,880 | $41,714 | ~$20,000 | **$21,700** | **$260K** | **45%** |
| 15,000 | $142,140 | $124,110 | ~$53,000 | **$71,000** | **$850K** | **50%** |
| 25,000 | $237,660 | $209,972 | ~$95,000 | **$115,000** | **$1.38M** | **48%** |

**Assumptions:**
- Blended pricing: 60% annual ($99), 30% annual founding ($79), 10% monthly-to-annual conversions
- Operating expenses: 2 founders @ $2.5K/mo initially, scaling to small team (5-10 people) at 25K users
- Marketing spend: $50-100 CAC, organic growth focus (Reddit, Twitter, Product Hunt)
- Customer support: Initially founder-led, scaling to part-time then full-time at 10K+ users

**Key Insight:** With disciplined cost control, Guapital can achieve 40-50% net margins at scale - significantly better than most SaaS businesses (typical 15-25%).

**Break-Even Analysis:**
- **50 paying users** covers all infrastructure costs ($1,326/mo)
- **500 users** supports 2 founders at ramen profitability (~$5K/mo take-home)
- **1,000 users** = sustainable indie business ($43K/year profit + founder salaries)
- **5,000 users** = comfortable lifestyle business ($260K/year profit)

## Competitor Profitability Analysis

Understanding competitor economics validates our pricing strategy and reveals market opportunities.

### YNAB (You Need A Budget)

**Business Metrics:**
- **Annual Revenue:** ~$49M (2024)
- **Paying Subscribers:** ~350,000-400,000
- **Employees:** 254
- **Pricing:** $14.99/mo or $109/year
- **Business Model:** 100% subscription, bootstrapped (no VC)

**Profitability:**
- **Gross Margin:** 75-80% (estimated, typical SaaS with API costs)
- **Net Profit Margin:** 15-25% (mature, profitable company)
- **Estimated Net Profit:** $7-12M/year

**Key Insights:**
- Bootstrapped and profitable for years
- Optimizes for profit over growth
- Strong retention (budget-focused users are sticky)
- Similar cost structure to Guapital (~$1-2/user/month API costs)

---

### Monarch Money

**Business Metrics:**
- **Annual Revenue:** $50-100M (estimated, 2024-2025)
  - Revenue grew 6x in 2024
  - $850M valuation suggests $70-100M ARR (8-12x ARR typical for growth SaaS)
- **Paying Subscribers:** 500K-1M (estimated)
- **Employees:** 100-200 (estimated)
- **Pricing:** $14.99/mo or $99/year
- **Business Model:** 100% subscription (no free tier)
- **Funding:** $75M Series B (May 2025)

**Profitability:**
- **Gross Margin:** 75-80% (estimated)
- **Net Profit Margin:** -10% to +5% (growth mode, burning cash)
- **Estimated Net Profit:** -$5M to +$5M/year (break-even or slightly negative)

**Key Insights:**
- **Prioritizing growth over profitability** (just raised $75M)
- Heavy marketing spend to capture Mint refugees (20x subscriber growth in 2024)
- Valued at $850M but not yet profitable
- Will need exit (acquisition/IPO) to return investor capital

**Strategic Implication for Guapital:** Monarch has NO defensible moat beyond brand/market share. They're burning cash to grow. A superior product feature (percentile ranking) can capture market share.

---

### Copilot Money

**Business Metrics:**
- **Annual Revenue:** $15-20M (estimated)
- **Paying Subscribers:** 100,000+ (March 2024)
- **Employees:** 10-20 ("deeply disciplined small team")
- **Pricing:** ~$14.99/mo or $95/year
- **Business Model:** 100% subscription
- **Funding:** $6M Series A (March 2024) - raised AFTER becoming profitable

**Profitability:**
- **Gross Margin:** 80-85% (small team, efficient operations)
- **Net Profit Margin:** 15-20% (PROFITABLE since 2023)
- **Estimated Net Profit:** $3-4M/year

**Key Insights:**
- **The model Guapital should emulate**
- Small team, laser-focused product (iOS-first)
- Profitable BEFORE raising VC money
- Grew "more in last 4 months than first 4 years" (Mint shutdown tailwind)
- Raised $6M to accelerate growth, not to survive

**Strategic Implication:** This proves the indie-to-scale path works. Stay lean, get profitable, then raise if/when needed.

---

### Empower Personal Wealth

**Business Metrics:**
- **Total Empower Revenue:** $973M (2024, entire company)
- **Personal Wealth Segment:** Revenue split unclear
- **Business Model:** Freemium app + wealth management fees (0.49-0.89% AUM)
- **Profitability:** 25-30% net margin, 16% ROE (entire Empower business)

**Key Insights:**
- Different business model (wealth management fees, not pure SaaS)
- Very profitable but not directly comparable to Guapital
- Free app is lead generation for high-margin advisory services

---

### Competitive Profit Comparison Table

| Competitor | Revenue | Net Margin | Est. Net Profit | Business Stage | Team Size |
|------------|---------|------------|-----------------|----------------|-----------|
| **YNAB** | $49M | 15-25% | $7-12M/year | Mature, profitable, bootstrapped | 254 |
| **Monarch** | $75M* | -10% to +5% | -$5M to +$5M | Growth mode, burning $75M | 100-200 |
| **Copilot** | $18M | 15-20% | $3-4M/year | Efficient, profitable, scaled | 10-20 |
| **Empower** | $973M** | 25-30% | $250-300M | Very profitable (diff. model) | Large |
| **Guapital (Projected)** | $1.2M*** | **45%*** | $260K/year | Pre-launch (5K users) | 1-2 |

*Estimated
**Entire Empower business
***Projected at 5,000 paying users with lean team

---

### Strategic Takeaways

**1. Copilot's Playbook is the Winning Strategy:**
- Get to profitability with small team (Copilot: 10-20 people, $3-4M profit)
- Guapital can match Copilot's profit at just **15,000 users** ($850K/year net profit)
- Stay indie or raise small round ($1-3M) AFTER proving profitability

**2. Monarch's Weakness is Our Opportunity:**
- They're burning cash for growth with no defensible moat
- No unique features beyond "Mint replacement"
- Without percentile ranking, we can't compete. WITH it, we can steal market share.

**3. Realistic Path to $1M+ Annual Profit:**
- **Year 1 (1,000 users):** $43K profit = ramen profitability
- **Year 2 (5,000 users):** $260K profit = sustainable lifestyle business
- **Year 3 (15,000 users):** $850K profit = comfortable living + reinvestment
- **Year 4 (25,000 users):** $1.4M profit = generational wealth builder

**4. Exit Opportunity:**
- At 25,000 users: $2.4M ARR (blended pricing)
- 10-15x ARR valuation = **$24-36M acquisition potential**
- Comparable: Monarch valued at $850M on ~$75M ARR (11x multiple)

## Competitive Strategy

### Why Users Don't Switch (Current State)

**Brutal Honesty:** As of today, there is NO compelling reason for a Monarch user to switch to Guapital.

**Feature Parity:**
- ✅ Net worth dashboard (Monarch has this)
- ✅ Account aggregation via Plaid (Monarch has this)
- ✅ Transaction history (Monarch has this)
- ✅ Crypto wallet tracking (Monarch has this)
- ✅ Historical trends (Monarch has this)

**Switching Costs:**
- Re-linking all bank accounts (friction)
- Learning new UI (cognitive overhead)
- Losing historical data (perceived loss aversion)
- $79-99/year vs $99-180/year (price difference not compelling enough alone)

**Conclusion:** Price alone won't drive switching. We need a killer feature Monarch doesn't have.

---

### The Killer Feature: Percentile Ranking

**Why This Works:**
1. **Gamification Psychology:** "You're in the top 15% of 28-year-olds" is screenshot-worthy
2. **Social Proof:** Users WILL share this on Twitter/Reddit/Instagram
3. **Viral Loop:** Every share = free marketing + social proof
4. **Impossible to Copy Quickly:** Requires critical mass of users to be meaningful
5. **Network Effects:** More users = more accurate percentiles = more valuable to existing users

**Competitive Moat:**
- Monarch would need 6-12 months to build this (product cycles, privacy/legal review)
- By then, we have first-mover advantage and data advantage
- Percentile rankings get MORE valuable as user base grows (network effects)

**See PERCENTILE_RANKING_SPEC.md for full implementation details.**

---

### The Secondary Feature: FIRE Calculator

**Why This Works:**
1. **Target Audience Alignment:** Gen Z wealth builders care about Financial Independence
2. **Emotional Connection:** "You'll reach FI in 8.3 years" is motivating
3. **Differentiation:** Monarch/YNAB focus on budgeting, not wealth building
4. **Sticky Feature:** Users check progress monthly (retention driver)

**Competitive Advantage:**
- Positions Guapital as wealth-building tool, not budget tracker
- Appeals to r/Fire, r/leanfire communities (organic growth channels)
- Complements percentile ranking ("Top 20% + 8 years to FI" = powerful combo)

---

### Launch Strategy

**Minimum Viable Differentiation:**
1. ✅ Reliable net worth tracking (table stakes)
2. ✅ Crypto integration (nice-to-have)
3. **⚠️ Percentile ranking (MUST HAVE for launch)**
4. **⚠️ FIRE calculator (strongly recommended for launch)**

**Without percentile ranking:** We're just another Monarch clone with lower prices. Not enough to drive switching.

**With percentile ranking:** We're the ONLY app that gamifies wealth building. This is the viral hook.

**Launch Positioning:**
- "The net worth tracker that shows you where you stand (and celebrates your wins)"
- "Finally, a wealth app that makes you feel GOOD about your progress"
- "Stop budget shaming, start wealth building"

## Go-to-Market Strategy

### Phase 0: Pre-Launch (Months 1-3)
- Build in public (Twitter thread, weekly updates)
- Email waitlist landing page (Goal: 200-500 subscribers)
- Private beta with 50-100 users (friends, family, Reddit)

### Phase 1: Public Launch (Months 4-6)
- Product Hunt launch (Top 5 of the day)
- Reddit organic posts (r/PersonalFinance, r/Fire, r/CryptoCurrency)
- Twitter/X launch thread with founder story
- Indie Hacker / Hacker News
- **Goal:** 500 signups, 100 paying users

### Phase 2: Content & Community (Months 7-12)
- Blog SEO content, YouTube tutorials, TikTok/Instagram Reels
- Discord/Slack community
- Finance YouTuber affiliate deals (10-20% rev share)
- **Goal:** 2,000 users, 400 paying

### Phase 3: Scale (Months 13-24)
- Facebook/Instagram ads (target: $50-100 CAC)
- Google Search ads
- Referral program
- **Goal:** 10,000 users, 2,000 paying ($480K ARR)

## Development Priorities & Scope Discipline

**Golden Rule:** Ship fast, iterate faster. Focus on core value prop (reliable net worth tracking), not feature bloat.

### Always Prioritize:
1. Reliability over features
2. Mobile-first design
3. Speed & performance
4. Beautiful UX
5. Privacy & security

### Decision Framework: "Should we build this?"

1. Does this help users track net worth more accurately?
2. Does this reduce friction in onboarding/sync?
3. Does this increase viral sharing?
4. Can we ship it in <2 weeks?

If "No" to all four → **Don't build it yet.**

### Scope Creep Red Flags (Push to Phase 2 or Avoid):
- **Budgeting features** (conflicts with positioning, YNAB already dominates)
  - Budget goals or limits
  - Envelope systems
  - Budget vs. actual comparisons
  - Budget shame mechanics
- Investment performance tracking
- Solana NFT tracking
- Financial advisor sharing
- Bill pay integration
- Credit score monitoring

### Never Compromise On:
- Data encryption (at rest and in transit)
- Secure authentication (OAuth for banks)
- Database backups and disaster recovery
- User data privacy (no selling data, ever)

## Setup Instructions

### 1. Database Setup
```bash
# Go to Supabase Dashboard → SQL Editor
# Run: supabase/migrations/001_create_guapital_schema.sql
```

### 2. Environment Variables
```bash
cp .env.example .env.local
# Fill in Supabase, Plaid, Alchemy, Stripe keys
```

### 3. Development
```bash
npm install
npm run dev  # Visit http://localhost:3000
```

### 4. Testing
- **Plaid:** Use `user_good` / `pass_good` in sandbox
- **Crypto:** Add any valid Ethereum address
- **Jest:** `npm run test`

## Architecture Decisions

### Unified Accounts Panel
**Decision:** Merge Plaid + manual + crypto into single "Accounts" panel

**Rationale:**
- Single source of truth reduces cognitive load
- Free users: unlimited manual tracking; Premium: auto-sync via Plaid
- Visual badges distinguish "Plaid" (emerald), "Manual" (amber), "Crypto" (purple)

**Implementation:**
- `ManualAssetsSection.tsx` fetches all sources in parallel
- Transforms to common `UnifiedEntry` interface
- Separate database tables maintained (`plaid_accounts`, `manual_assets`, `crypto_wallets`)

### Subscription Tier Architecture
**Implementation:**
- `SubscriptionContext.tsx` provides `hasAccess()` function
- `permissions.ts` central config for tier features
- Dev mode override: all features enabled in development
- Free/Premium tiers (Pro tier eliminated for simplicity)

### Historical Snapshots
**Decision:** Real-data-only approach with progressive UX

**Implementation:**
- Daily cron job (`pg_cron`) at midnight UTC
- API `/api/networth/history` fetches snapshots with smart fallbacks
- Ghost/preview chart for new users (educational, passive design)
- Single-point display (Day 1): gold dot labeled "Today"
- Full trend line (Day 2+): historical + today's live calculation

**Key Design:** No backfill/synthetic data - maintains user trust

## Key API Routes

**Net Worth & Assets:**
- `/api/networth` - Current net worth from all sources
- `/api/networth/history` - Historical snapshots with fallback
- `/api/networth/snapshot` - Record daily snapshot (cron job)
- `/api/assets` - CRUD for manual assets
- `/api/assets/[id]` - Update/delete specific asset

**Plaid Integration:**
- `/api/plaid/create-link-token` - Initialize Plaid Link
- `/api/plaid/exchange-token` - Exchange public token for access token
- `/api/plaid/accounts` - Fetch Plaid accounts (Premium+)
- `/api/plaid/sync-accounts` - Sync account balances
- `/api/plaid/transactions` - Transaction history (Premium+)
- `/api/plaid/sync-transactions` - Sync transactions

**Crypto Integration:**
- `/api/crypto/wallets` - Crypto wallet management
- `/api/crypto/sync-wallet` - Sync wallet via Alchemy

**Percentile Ranking:**
- `/api/percentile` - Get user's current percentile rank
- `/api/percentile/opt-in` - POST: Opt into percentile tracking, DELETE: Opt out
- `/api/percentile/distribution` - Get age bracket distribution data for charts

**Other:**
- `/api/cashflow/monthly` - Monthly cash flow (Premium+)
- `/api/founding-members/remaining` - Founding member slots remaining

## Key Components

**Dashboard:**
- `DashboardContent.tsx` - Main dashboard layout
- `HeroNetWorthCard.tsx` - Net worth card with trend chart
- `GetStartedView.tsx` - Onboarding view for new users
- `AssetBreakdownPanel.tsx` - Asset breakdown chart
- `LiabilityBreakdownPanel.tsx` - Liability breakdown chart
- `RecentTransactionsPanel.tsx` - Recent transactions panel
- `MonthlyCashFlowPanel.tsx` - Cash flow panel

**Accounts & Assets:**
- `ManualAssetsSection.tsx` - Unified accounts panel (Plaid + manual + crypto)
- `AccountsPageContent.tsx` - Accounts page main component
- `AddAccountDropdown.tsx` - Unified dropdown for Plaid/crypto/manual
- `AddAssetModal.tsx` - Add manual asset modal
- `EditAssetModal.tsx` - Edit asset modal
- `PlaidLinkButton.tsx` - Plaid Link integration

**Crypto:**
- `AddWalletModal.tsx` - Add crypto wallet modal
- `WalletsList.tsx` - List of crypto wallets

**Percentile Ranking:**
- `PercentileRankCard.tsx` - Percentile rank display card (THE killer feature)
- `PercentileOptInModal.tsx` - Opt-in onboarding modal
- `PercentileLearnMoreModal.tsx` - Data transparency modal

**Pages:**
- `TransactionsPageContent.tsx` - Transaction history (Premium+)
- `ReportsPageContent.tsx` - Advanced analytics (Premium+)
- `BudgetPageContent.tsx` / `CashFlowInsights.tsx` - Budget/cash flow page

**Pricing & Subscription:**
- `PricingCard.tsx` / `PricingSection.tsx` - Pricing components
- `FoundingMemberBanner.tsx` - Founding member promo banner
- `SubscriptionContext.tsx` - Tier-based access control

**Shared UI:**
- `Modal.tsx` - Generic modal component
- `Toast.tsx` / `ToastProvider.tsx` - Toast notifications
- `Dropdown.tsx` - Generic dropdown component
- `Button.tsx`, `TextField.tsx`, `SelectField.tsx` - Form components

## Pre-Launch Checklist

**Database & Backend:**
- [ ] Apply core database migrations to production Supabase (001-004)
- [ ] Apply percentile migrations to production (005-011)
- [ ] Enable pg_cron extension in Supabase
- [ ] Verify percentile seed data loaded (49 records)
- [ ] Verify daily cron job scheduled (1am UTC)

**Integrations:**
- [ ] Configure Plaid production account
- [ ] Set up Stripe products ($79 founding, $99 regular)
- [ ] Configure Stripe webhook for subscription events
- [ ] Verify Alchemy API key for production
- [ ] Social OAuth production URL configuration

**Testing:**
- [ ] Create 10 test users with varying net worth
- [ ] Test percentile opt-in flow end-to-end
- [ ] Verify percentile calculations are accurate
- [ ] Test founding member tracking (remaining slots API)
- [ ] End-to-end user flow testing (signup → add accounts → see dashboard)
- [ ] Mobile responsiveness testing (iOS Safari, Android Chrome)
- [ ] Performance optimization (Lighthouse score >90)

**Documentation:**
- [ ] Verify all API endpoints documented
- [ ] Update environment variable setup guide
- [ ] Prepare deployment runbook

## Strategic Context

**Target Market:** Gen Z wealth builders ($50K-$500K net worth) over HNWIs ($2M+)

**Timeline:**
- ✅ Percentile ranking complete (3 days as planned)
- Launch-ready MVP: 5-7 days (FIRE calculator + testing + deployment)
- First 1,000 users (ramen profitability): 6-9 months
- 5,000 users (lifestyle business): 12-18 months

**Business Model:** Follow Copilot's playbook
- Sustainable lifestyle business ($260K-$1.4M profit/year at 5K-25K users)
- Bootstrap to profitability FIRST, raise small round ($1-3M) if/when needed
- NOT venture-scale unicorn (avoiding Monarch's burn-to-grow trap)

**Competitive Positioning:**
- **Price:** 45% cheaper than Monarch ($79-99/year vs $180/year)
- **Differentiation:** Percentile ranking (viral hook) ✅ + FIRE calculator (wealth-building focus)
- **Moat:** Network effects (more users = more valuable percentile data)

**Key Success Metrics:**
- **50 users:** Infrastructure break-even
- **500 users:** Ramen profitability for 2 founders
- **1,000 users:** $99K ARR, sustainable indie business
- **5,000 users:** $495K ARR, $260K net profit (lifestyle business)
- **15,000 users:** $1.5M ARR, $850K net profit (exit opportunity territory)

**Exit Opportunity (if desired):**
- 25,000 users = $2.4M ARR
- 10-15x ARR valuation = **$24-36M acquisition**
- Or stay indie and generate $1.4M/year profit indefinitely

**Philosophy:**
- Build for 1,000 users first, not 1,000,000
- Optimize for profit margins (40-50%) over growth at all costs
- Small team (1-10 people), high efficiency
- Feature discipline: Every feature must drive viral growth or retention

**Critical Success Factor:** ✅ Percentile ranking is COMPLETE! This is the viral hook that drives organic growth and differentiates us from Monarch.

## Additional Documentation

For detailed documentation on specific features and strategies, see:
- `documentations/research.md` - Detailed market analysis and competitor research
- `documentations/API_COST_ANALYSIS.md` - Complete financial modeling and unit economics
- `documentations/PERCENTILE_RANKING_SPEC.md` - Original percentile feature specification
- `documentations/PERCENTILE_DATA_STRATEGY.md` - Hybrid data strategy (SCF + real users)
- `documentations/PERCENTILE_IMPLEMENTATION_COMPLETE.md` - Implementation summary and deployment guide
- `documentations/PERCENTILE_DEPLOYMENT_GUIDE.md` - Production deployment checklist
- `supabase/migrations/README_PERCENTILE.md` - Database migration guide for percentile feature
