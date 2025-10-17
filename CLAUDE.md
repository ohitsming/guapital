# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Guapital** is a modern, privacy-first financial application designed to help Gen Z wealth builders (ages 24-35) track their net worth across traditional and modern assets. The project focuses on wealth generation rather than simple budgeting, targeting users with $50K-$500K net worth who hold a mix of traditional investments, cryptocurrency, and emerging assets.

**Core Value Proposition:** The single, reliable source of truth for net worth calculation across all asset classes - without the budget shame, sync failures, or feature bloat of existing tools.

**Key Differentiators:**
- Wealth-building mindset (not penny-pinching budgeting)
- First-class crypto/DeFi wallet integration
- Gamified percentile rankings (anonymous, opt-in)
- Beautiful, mobile-first UX designed for daily engagement
- Privacy-first monetization (paid subscriptions, never selling data)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database & Auth:** Supabase
- **Deployment:** AWS Amplify
- **Additional:** MDX support for content, Stripe integration, Framer Motion for animations

## Development Commands

```bash
# Development
npm run dev              # Start development server

# Building
npm run build            # Production build
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run test             # Run Jest tests

# Git Hooks
npm run prepare          # Setup Husky git hooks
```

## Architecture Overview

### Directory Structure

```
src/
├── app/                          # Next.js App Router pages & API routes
│   ├── api/supabase/            # All Supabase API endpoints
│   │   ├── auth/                # Authentication callbacks & OAuth
│   │   ├── general/             # General endpoints (interests, onboarding status)
│   │   └── settings/            # User profile & settings management
│   ├── auth/                    # Auth-related pages (callbacks, confirmations)
│   ├── login/                   # Login & password reset pages
│   ├── signup/                  # Signup flow pages
│   └── [other-pages]/           # Marketing pages (about, pricing, terms, etc.)
├── components/                   # React components
│   ├── business-onboarding/     # Business onboarding flow
│   ├── earner-onboarding/       # Earner onboarding flow
│   ├── settings/                # Settings-related components
│   └── toast/                   # Toast notification system
├── lib/                         # Core utilities & business logic
│   ├── interfaces/              # TypeScript interfaces for domain models
│   ├── types/                   # TypeScript type definitions
│   ├── context/                 # React Context providers
│   ├── stripe/                  # Stripe-related utilities
│   ├── constant.ts              # App-wide constants (WEB_NAME, URLs, etc.)
│   ├── featureFlags.ts          # Feature flag management
│   └── quota.ts                 # Quota management logic
└── utils/                       # Utility functions
    ├── supabase/                # Supabase client factories
    │   ├── client.ts            # Browser client creation
    │   └── server.ts            # Server-side client creation
    ├── avatarUtils.ts
    └── timeUtils.ts
```

### Authentication & Database Pattern

**Supabase Client Creation:**
- Use `createClient()` from `@/utils/supabase/server` in Server Components and API Routes
- Use `createClient()` from `@/utils/supabase/client` in Client Components
- Both use `@supabase/ssr` package for proper cookie handling

**API Route Pattern:**
```typescript
// Standard pattern for protected API routes
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

### Key Configuration Files

- **next.config.mjs:** Complex MDX configuration with Shiki syntax highlighting, custom remark/rehype plugins
- **tsconfig.json:** Path alias `@/*` maps to `./src/*`
- **jest.config.js:** Jest configured with ts-jest preset, `@/` alias support
- **middleware.ts:** Currently disabled (empty matcher array)

### Important Constants

Located in `src/lib/constant.ts`:
- `WEB_NAME`: "Guapital"
- `WEB_DESC`: "Track your guap, build your wealth."
- `URL`: Environment-based URL (defaults to https://guapital.com)
- Email addresses for info and support

### MDX Integration

The project has extensive MDX support configured for blog/work content:
- Custom Typography wrapper for markdown content
- Shiki syntax highlighting with CSS variables theme
- Image import optimization via recma-import-images
- Conditional layouts based on content location (blog vs work)

## Environment Variables

Required environment variables (in `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `NEXT_PUBLIC_ENV_URL`: Public-facing URL (optional, defaults to https://guapital.com)

## Development Guidelines

### Component Organization
- Reusable UI components live in `src/components/`
- Feature-specific components are grouped in subdirectories (e.g., `business-onboarding/`, `settings/`)
- Use the established pattern of FadeIn animations and Border components for visual consistency

### State Management
- React Context for form state (see `src/lib/context/CampaignFormContext.tsx`)
- Custom Toast notification system (`src/components/toast/`)
- Server-side state via Supabase queries in API routes

### Styling
- Tailwind CSS v4 with PostCSS
- Custom animations using Framer Motion
- Utility-first approach with custom components for common patterns (Button, TextField, SelectField)

## Ideal Customer Profile (ICP)

**Primary Target:** Tech-savvy wealth builders, ages 24-35

**Demographics:**
- Income: $75K-$200K/year (tech workers, consultants, entrepreneurs)
- Net Worth: $50K-$500K (sweet spot: $100K-$300K)
- Location: Urban/suburban, tech hubs preferred

**Asset Mix:**
- Traditional: 401(k), brokerage account (Robinhood/Fidelity), HYSA
- Modern: Cryptocurrency (1-3 wallets), some may have RSUs
- Emerging: Side business income, rental property (minority)

**Psychographic Profile:**
- "I'm building wealth, not just surviving paycheck to paycheck"
- Tired of YNAB-style budget shame and micromanagement
- Wants to see net worth line go up (dopamine-driven engagement)
- Willing to pay $15-25/mo for quality tools that work reliably
- Privacy-conscious but not paranoid
- Shares financial wins anonymously on social media

**Anti-ICP (Avoid Initially):**
- Traditional budgeters who need envelope systems
- People with <$10K net worth (product won't resonate yet)
- Ultra-wealthy ($5M+) who need complex tax optimization
- Active traders needing real-time portfolio analytics

## Project Roadmap

### Phase 1: Simple, Lovable, Complete MVP (Months 1-6)

**Timeline:** 4-6 months to launch
**Goal:** Prove product-market fit with 1,000 paying users

**Core Features (What We Build):**

1. **Account Aggregation (Plaid Only)**
   - Traditional accounts: checking, savings, credit cards, loans
   - Investment accounts: Robinhood, Fidelity, Vanguard, etc.
   - Focus on reliability - one aggregator done exceptionally well
   - Smart error handling with clear user communication
   - Build time: 6-8 weeks

2. **Crypto Wallet Tracking**
   - Read-only wallet balance via Alchemy/Moralis API
   - Support: Ethereum, Polygon, Base (where most Gen Z holds assets)
   - Display: Total balance in USD, top 5 holdings by value
   - Build time: 3-4 weeks

3. **Manual Asset Entry**
   - Simple form: Asset name, current value, category
   - Categories: Real estate, vehicles, private equity, collectibles, "other"
   - Timestamp + basic edit history (who changed what when)
   - Build time: 1-2 weeks

4. **Net Worth Dashboard**
   - Big number at top: Total net worth
   - Trend chart: Last 30/90/365 days
   - Breakdown: Assets vs Liabilities (pie/bar charts)
   - Category breakdown (cash, investments, crypto, real estate, etc.)
   - Mobile-first, gorgeous design (key differentiator)
   - Build time: 3-4 weeks

5. **Percentile Ranking (Gamification)**
   - "You're in the top X% of Guapital users in your age group"
   - Filter by: Age bracket only (keep it simple)
   - Anonymized, opt-in feature
   - **This is our viral loop** - users will screenshot and share
   - Build time: 2-3 weeks

6. **Basic Budgeting (Lite)**
   - Simple monthly spending by category (auto-categorized via Plaid)
   - AI categorization with confidence scores
   - "Guilt-free spending" toggle to hide certain categories from budget view
   - Build time: 2-3 weeks

**What We DON'T Build (Phase 1):**
- ❌ Multi-aggregator redundancy (add later if Plaid reliability becomes issue)
- ❌ Advanced DeFi tracking (staking, LP tokens, yield farming)
- ❌ Tax optimization features
- ❌ Investment performance analytics (IRR, XIRR calculations)
- ❌ Bill pay integrations
- ❌ Shared accounts / partner features
- ❌ Advanced security certifications (SOC 2) - just good security hygiene
- ❌ Native mobile apps (PWA is sufficient for MVP)

**Success Metrics (12-Month Goals):**
- 5,000 total users
- 1,000 paying users (20% conversion rate)
- $240K ARR ($20K MRR average)
- <5% monthly churn
- 99% upfront sync reliability (Plaid integration)

### Phase 2: Feature Expansion & Retention (Months 7-18)

**Focus:** Expand features based on user feedback, improve retention

**Planned Features:**
- Multi-aggregator redundancy (add Yodlee as backup)
- Advanced DeFi tracking (staking, LP tokens)
- Investment performance analytics (time-weighted returns)
- Tax export (CSV/PDF for accountants)
- Shared accounts for partners/spouses
- Referral program ("Give $10, get $10")
- Mobile app (React Native or similar)

**Success Metrics:**
- 25,000 total users
- 5,000 paying users
- $1.2M ARR
- <3% monthly churn

### Phase 3: Scale & Upsell (Months 19-36)

**Focus:** Scale acquisition, add premium features, potentially pivot upmarket

**Planned Features:**
- Advanced tax optimization tools
- Financial advisor integrations
- API access for power users
- White-label solutions for fintech companies
- "Grow with your users" - as Gen Z users age into complexity ($500K-$2M net worth), add features they need

**Success Metrics:**
- 100,000+ total users
- 20,000+ paying users
- $5M+ ARR
- Path to acquisition or sustainable lifestyle business

## Pricing Strategy

### Free Tier (Lead Generation & Viral Growth)
**Price:** $0/month

**Features:**
- Manual entry only (no account sync)
- Up to 3 connected accounts
- Net worth dashboard + 30-day history
- No percentile ranking
- Basic transaction categorization

**Purpose:**
- Let users try before they buy
- SEO/viral growth mechanism
- Convert to paid when users need automation

---

### Premium Tier (Target: 80% of paying users)
**Price:** $19/month or $180/year (15% discount)

**Features:**
- Unlimited connected accounts (Plaid integration)
- Full traditional account sync (checking, savings, credit, investments)
- Crypto wallet tracking (up to 5 wallets)
- 365-day history + trend analysis
- Percentile ranking + community features
- AI transaction categorization with confidence scores
- "Guilt-free spending" budget toggles
- Email support (48-hour response time)

**Value Proposition:** "Automate your wealth tracking for less than a daily coffee"

---

### Pro Tier (Target: 20% of paying users)
**Price:** $49/month or $470/year (20% discount)

**Features:**
- Everything in Premium
- Unlimited crypto wallets
- Manual asset tracking (real estate, private equity, collectibles)
- Advanced DeFi tracking (future: staking, LP tokens)
- Priority support (24-hour response time)
- CSV export for tax time
- API access (future feature)
- Early access to new features

**Value Proposition:** "For serious wealth builders managing complex portfolios"

---

### Pricing Rationale
- **Value-based pricing:** Users save 2-5 hours/month of manual tracking (worth $50-200 at their hourly rate)
- **Anxiety reduction:** Knowing exact net worth reduces financial stress (hard to quantify, but real)
- **Competitive positioning:** More expensive than Monarch ($8/mo) but less than wealth management tools ($100+/mo)
- **LTV optimization:** Annual plans reduce churn and improve cash flow

## Go-to-Market Strategy

### Phase 0: Pre-Launch (Months 1-3)

**Build in Public:**
- Twitter thread: "I'm building the net worth tracker I wish existed"
- Weekly updates with screenshots (build anticipation)
- Start email waitlist landing page
- Goal: 200-500 email subscribers

**Private Beta (50-100 users):**
- Friends, family, personal network
- Reddit communities (r/PersonalFinance, r/Fire)
- Get brutal feedback on onboarding flow
- Fix critical bugs before public launch
- Goal: 50 active beta users giving weekly feedback

---

### Phase 1: Public Launch (Months 4-6)

**Launch Week Strategy:**

1. **Product Hunt** (aim for Top 5 of the day)
   - Prepare: Great demo video, founder story, early user testimonials
   - Coordinate: Ask beta users to upvote/comment on launch day
   - Offer: Special launch pricing ($15/mo instead of $19 for first 100 users)

2. **Reddit** (organic posts, not ads yet)
   - r/PersonalFinance: "I built a tool to track net worth across crypto and traditional assets [Tool]"
   - r/financialindependence: Share tool in "self-promotion" threads
   - r/CryptoCurrency: Focus on wallet tracking angle
   - r/Fire: "How I track my progress to FI with this tool"
   - Value-first approach: Share helpful content, tool is secondary

3. **Twitter/X Launch**
   - Founder story thread: Personal journey building the tool
   - Tag fintech influencers for retweets
   - "Here's how I hit $100K net worth at 27" type threads showcasing the tool
   - Daily updates during launch week

4. **Indie Hacker / Hacker News**
   - "Show HN: I built a net worth tracker for Gen Z wealth builders"
   - Focus on technical architecture and privacy-first approach

**Goal:** 500 total signups, 100 paying users ($2K MRR) by end of Month 6

---

### Phase 2: Content & Community (Months 7-12)

**Content Marketing:**
- **Blog (SEO-focused):**
  - "How to track your net worth in 2025" (long-form guide)
  - "Best crypto portfolio trackers compared"
  - "Net worth milestones by age: Where do you stand?"
- **YouTube:**
  - "Net worth tracker tutorial"
  - "I tracked my net worth for 6 months - here's what happened"
- **TikTok/Instagram Reels:**
  - Quick "I just hit $X net worth!" celebration videos
  - User-generated content from customers

**Community Building:**
- Discord or Slack for power users
- Monthly "net worth growth wins" thread (viral on Twitter)
- User spotlight features
- Anonymous leaderboard for friendly competition

**Partnerships:**
- Affiliate deals with finance YouTubers (10-20% rev share)
  - Target: Graham Stephan, Andrei Jikh, Meet Kevin audience
- Guest posts on finance blogs (NerdWallet, The Penny Hoarder)
- Podcast sponsorships (Choose FI, BiggerPockets Money)

**Goal:** 2,000 total users, 400 paying ($8K MRR) by end of Month 12

---

### Phase 3: Scale & Optimize (Months 13-24)

**Paid Acquisition:**
- Facebook/Instagram ads with demo video (target: $50-100 CAC)
- Reddit ads in finance subreddits
- Google Search ads (target: "net worth tracker", "personal finance app")

**Growth Experiments:**
- Referral program: "Give $10 off, get $10 credit"
- Annual plan push: "Save 15% by going annual"
- Lifetime deal on AppSumo (one-time acquisition experiment)

**SEO Content Machine:**
- Target long-tail keywords
- "Net worth tracking for [specific profession]"
- Location-based content for local SEO

**Product-Led Growth:**
- Improve onboarding based on drop-off data
- In-app prompts to upgrade to Premium
- Email nurture sequences for free users

**Goal:** 10,000 total users, 2,000 paying ($40K MRR = $480K ARR)

## Testing

- Jest configured with ts-jest
- Tests should be co-located with source files or in a `__tests__` directory
- Use the `@/` alias for imports in tests

## Development Priorities & Scope Discipline

**Golden Rule:** Ship fast, iterate faster. Focus on core value prop (reliable net worth tracking), not feature bloat.

### Always Prioritize:
1. **Reliability over features** - One aggregator working perfectly > two working poorly
2. **Mobile-first design** - Gen Z lives on their phones
3. **Speed & performance** - Fast load times, instant sync feedback
4. **Beautiful UX** - Design is a competitive advantage in fintech
5. **Privacy & security** - Non-negotiable for financial data

### Decision Framework: "Should we build this?"

Ask these questions:
1. Does this help users track their net worth more accurately? (Core value prop)
2. Does this reduce friction in the onboarding/sync process? (Reliability)
3. Does this increase viral sharing? (Growth loop)
4. Can we ship it in <2 weeks? (Speed)

If "No" to all four → **Don't build it yet.**

### Scope Creep Red Flags:

**User Requests to Push Back On (Phase 1):**
- "Can you add investment performance tracking?" → Phase 2
- "I need to track my Solana NFTs" → Phase 2 (start with basic wallet balances)
- "Can I share my dashboard with my financial advisor?" → Phase 2
- "Add budgeting goals and envelope system" → Not our core value prop
- "Support for [obscure European bank]" → Start with US banks, expand later

**Features That Sound Good But Aren't (Yet):**
- Bill pay integration (massive scope, low differentiation)
- Credit score monitoring (commoditized, not unique)
- Investment recommendations (requires licensing, regulatory hell)
- Spending alerts/notifications (YNAB territory, not our niche)

### When to Say "Yes" to Scope Expansion:

Only add features if:
- ✅ 10+ users request the same thing unprompted
- ✅ It's a clear competitive advantage vs Monarch/Empower
- ✅ It aligns with "wealth building" positioning (not budget micromanagement)
- ✅ We can build it without compromising reliability

### Technical Debt Management:

**Acceptable Shortcuts (MVP):**
- Basic error handling (don't need perfect retry logic yet)
- Simple manual asset form (no complex valuation models)
- PWA instead of native app
- Email support instead of live chat

**Never Compromise On:**
- Data encryption (at rest and in transit)
- Secure authentication (OAuth for banks, no password storage)
- Database backups and disaster recovery
- User data privacy (no selling data, ever)

## Notes

- The project is transitioning from "LocalMoco" (survey platform) to "Guapital" (net worth tracker) - actively removing legacy code
- Middleware is currently disabled but infrastructure exists for future route protection
- Feature flags system in place for gradual rollout
- Toast notification system available globally via ToastProvider
- **Bootstrap Philosophy:** Build for 1,000 users first, not 1,000,000. Optimize for learning speed over scale.

## Strategic Context

See `research.md` for detailed market analysis and competitive landscape research. Key takeaways:
- Target Gen Z wealth builders ($50K-$500K net worth) over HNWIs ($2M+)
- Prioritize speed to market (4-6 months) over feature completeness
- Focus on reliability and crypto integration as key differentiators
- Build sustainable lifestyle business ($500K-$2M ARR) not venture-scale unicorn
