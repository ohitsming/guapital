# CLAUDE.md

## Project Overview

**Guapital** - Privacy-first net worth tracker for young adults (24-35) with $50K-$500K net worth. Targets tech workers who hold traditional investments, crypto, and emerging assets.

**Core Value:** Single source of truth for net worth across all asset classes - no budget shame, sync failures, or feature bloat.

**Key Differentiators:**
- Wealth-building mindset (not budgeting)
- First-class crypto/DeFi integration
- **Gamified percentile rankings** (THE killer feature - anonymous, opt-in)
- Mobile-first UX
- Privacy-first (paid subscriptions, never sell data)

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion
- **Database/Auth:** Supabase (RLS enabled), pg_cron
- **Deployment:** AWS Amplify
- **Integrations:** Plaid (Transactions only), Alchemy (crypto), Stripe, Sentry
- **Charting:** Recharts

```bash
npm run dev              # Development
npm run build            # Production
npm run lint/test        # QA
```

## Architecture

### Database Schema (Supabase + RLS)

**Core Tables:**
- `plaid_items`, `plaid_accounts`, `plaid_transactions` - Plaid integration
- `webhook_event_log` - Plaid webhook audit trail (30-day retention)
- `crypto_wallets`, `crypto_holdings` - Multi-chain crypto
- `manual_assets`, `manual_asset_history` - Manual entries
- `net_worth_snapshots` - Daily historical tracking
- `user_demographics`, `user_settings` - User data
- `percentile_seed_data` - Federal Reserve SCF 2022 (49 records)
- `percentile_snapshots` - Daily percentile calculations
- `percentile_milestones` - Achievement tracking
- `rate_limit_attempts` - Rate limiting (IP/user-based)

### Auth Pattern

```typescript
import { createClient } from '@/utils/supabase/server'; // API/Server
import { createClient } from '@/utils/supabase/client'; // Client

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Query logic
}
```

### API Utilities

Use `apiFetch()` wrapper for automatic rate limit handling:

```typescript
import { apiGet, apiPost } from '@/utils/api';

const response = await apiGet('/api/networth');
// Auto-displays toast on 429: "Rate limit exceeded. Try again in X seconds."
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Integrations
PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV
ALCHEMY_API_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

# Monitoring
NEXT_PUBLIC_SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN
```

### Design System

- **Colors:** Dark Teal (#004D40), Gold/Amber (#FFC107), Off-white (#F7F9F9)
- **Components:** Button, TextField, SelectField, Dropdown, Modal

## Implementation Status

**Phase 1 MVP: 100% COMPLETE** ✅

All features shipped: Plaid integration (Transactions product only), crypto tracking (Ethereum/Polygon/Base/Arbitrum/Optimism), manual asset CRUD, net worth dashboard with historical snapshots, subscription tiers (Free/Premium), **percentile ranking** (hybrid SCF + real user data), transactions/reports pages (Premium).

**Recent Updates (Jan 2025):**
- Plaid production fix (removed Auth product requirement)
- Percentile ranking complete (3 tables, 3 APIs, opt-in modal, distribution charts)
- Dashboard simplified (removed tabs)
- Premium gates fixed
- **Plaid webhook implementation** (70% cost reduction, real-time sync)
- **Auto-convert Plaid→Manual on downgrade** (preserves tracking data)

**Pre-Launch (2-3 days):**
1. Mobile testing
2. E2E user flow testing
3. Performance optimization
4. Register Plaid webhook URL in dashboard
5. **Testing complete:** 130/168 tests passing (77%), including 19 integration tests ✅

**Pre-Production (3-4 hours):**
1. Apply migrations to production Supabase (001-020)
2. Enable pg_cron, verify cron jobs (snapshots, rate limit cleanup)
3. Configure Stripe ($79 founding, $99 regular)
4. Social OAuth production URLs
5. Register Plaid webhook URL: `https://your-domain.com/api/plaid/webhook`

**Phase 2:** FIRE calculator, social sharing, milestone badges, partner/household finance tracking

## Pricing Strategy

**2-tier pricing:** Undercut competitors, founding member pricing (first 1,000 users).

### Free Tier
- Unlimited manual entry (no auto-sync)
- Up to 2 crypto wallets (auto-sync)
- 30-day history
- Percentile preview

### Premium Tier
- **Monthly:** $12.99/mo (13% cheaper than Monarch $14.99)
- **Annual:** $99/yr (same as Monarch, 36% off monthly)
- **Founding (First 1,000):** $79/yr forever (49% off monthly)

**Features:** Unlimited Plaid/crypto/manual, 365-day history, full percentile ranking, AI categorization, transactions/reports, CSV export.

## Financial Model

### Unit Economics (5K users)

| Service | Monthly Cost | Per User | Notes |
|---------|--------------|----------|-------|
| Plaid | $1,656 | $0.33 | **70% reduction via webhooks** ✅ |
| Alchemy/CoinGecko | $0 | $0 | Free tier |
| Supabase Pro | $25 | $0.005 | |
| Claude Max | $351 | $0.07 | |
| AWS Amplify | $10 | $0.002 | |
| Stripe | $1,290 | $0.26 | |
| **Total** | **$3,332** | **$0.67** | **Was $1.30, saved $0.63/user** |

### Profit Projections (Updated with $12.99/mo + Webhook Savings)

| Users | Monthly Revenue | Net Profit/Mo | Annual Net | Net Margin |
|-------|----------------|---------------|------------|------------|
| 1,000 | $9,246 | $4,495 | $53.9K | 49% |
| 5,000 | $45,360 | $28,695 | $344.3K | **63%** ✅ |
| 15,000 | $133,470 | $90,534 | $1.09M | 68% |
| 25,000 | $222,450 | $146,026 | $1.75M | 66% |

**Break-even:** 48 users covers infrastructure, 400 = ramen profitability

**Key Insight:** **63-68% net margins at scale** with $12.99/mo pricing + webhook optimization

## Competitive Strategy

### Why Users Don't Switch (Without Percentile Ranking)

Monarch has feature parity: net worth dashboard, Plaid, crypto, transactions, historical trends. Switching costs high (re-linking accounts, learning new UI, losing history). Price difference alone ($79-99 vs $99-180) insufficient.

**Conclusion:** Need killer feature Monarch doesn't have.

### The Killer Feature: Percentile Ranking

**Why it works:**
1. Gamification: "Top 15% of 28-year-olds" is screenshot-worthy
2. Social proof: Users share on Twitter/Reddit/Instagram
3. Viral loop: Every share = free marketing
4. Hard to copy: Requires critical mass + 6-12 months dev time
5. Network effects: More users = more valuable

**Competitive moat:** First-mover advantage + data advantage. Monarch would need 6-12 months to build. By then, we have network effects.

### Launch Positioning

- "The net worth tracker that shows you where you stand (and celebrates your wins)"
- "Finally, a wealth app that makes you feel GOOD about your progress"
- "Stop budget shaming, start wealth building"

## Go-to-Market

**Phase 0 (Months 1-3):** Build in public, waitlist (200-500), private beta (50-100)

**Phase 1 (Months 4-6):** Product Hunt, Reddit (r/PersonalFinance, r/Fire), Twitter, Indie Hackers. Goal: 500 signups, 100 paying.

**Phase 2 (Months 7-12):** SEO content, YouTube, Discord community, YouTuber affiliates. Goal: 2,000 users, 400 paying.

**Phase 3 (Months 13-24):** FB/IG ads ($50-100 CAC), Google ads, referral program. Goal: 10,000 users, 2,000 paying ($480K ARR).

## Business Model (Follow Copilot's Playbook)

- **Target:** Sustainable lifestyle business ($215K-$1.125M profit at 5K-25K users)
- **Strategy:** Bootstrap to profitability FIRST, raise small round ($1-3M) if/when needed
- **NOT:** Venture-scale unicorn (avoid Monarch's burn-to-grow trap)
- **Philosophy:** Build for 1,000 users first, optimize for 40-50% margins, small team (1-10), feature discipline

**Exit opportunity:** 25K users = $2.58M ARR → $25-39M acquisition (10-15x multiple)

## Competitor Analysis

| Competitor | Revenue | Net Margin | Team | Business Stage |
|------------|---------|------------|------|----------------|
| YNAB | $49M | 15-25% | 254 | Bootstrapped, profitable |
| Monarch | $75M* | -10% to +5% | 100-200 | Burning $75M, growth mode |
| Copilot | $18M | 15-20% | 10-20 | **Profitable, lean (our model)** |
| Guapital (5K) | $544K | **63%** ✅ | 1-2 | Pre-launch |

**Strategic takeaway:** Copilot's playbook works. Stay lean, get profitable (Copilot: 10-20 people, $3-4M profit). Monarch has no moat beyond brand. Percentile ranking is our wedge. **$12.99/mo pricing + webhook optimization gives us best-in-class margins (63% vs industry 15-25%).**

## Key Milestones

- **48 users:** Infrastructure break-even
- **400 users:** Ramen profitability (2 founders)
- **1,000 users:** $111K ARR, sustainable indie business
- **5,000 users:** $544K ARR, $344K net profit (lifestyle business)
- **15,000 users:** $1.60M ARR, $1.09M net profit (exit territory)

## Development Priorities

**Golden Rule:** Ship fast, iterate faster. Reliable net worth tracking > feature bloat.

**Always prioritize:** Reliability, mobile-first, speed, beautiful UX, privacy/security

**Code style:** Do not use emojis in code (log messages, comments, etc.). Keep code professional and clean.

**Decision framework:** Does this help track net worth / reduce friction / increase viral sharing / ship in <2 weeks? If no → Don't build yet.

**Scope creep red flags (Phase 2+):**
- Budgeting features (conflicts with positioning - YNAB dominates)
- Investment performance tracking
- Solana NFT tracking
- Financial advisor sharing
- Credit score monitoring

**Never compromise:** Data encryption, secure auth, backups, user privacy

## Security & Monitoring

### Rate Limiting (Supabase-based)

**Categories:**
- **auth:** 5 req/15min (login, signup)
- **api:** 300 req/min (dashboard = ~7-9 calls, React Strict Mode 2x)
- **expensive:** 10 req/hour (Plaid/crypto sync)

**How:** Middleware intercepts `/api/*`, checks `user:{id}` or `ip:{addr}`, returns 429 with `X-RateLimit-*` headers. Fails open if Supabase down.

### Security Headers (next.config.mjs)

X-Frame-Options (DENY), HSTS (1yr), CSP (whitelisted: Plaid, Stripe, Supabase, Alchemy, Sentry), Permissions-Policy (camera for Plaid only)

**Pending:** Plaid token encryption, audit logging, Zod validation, GDPR export

## Key API Routes

**Net Worth:** `/api/networth`, `/api/networth/history`, `/api/networth/snapshot`, `/api/assets`, `/api/assets/[id]`

**Plaid:** `/api/plaid/create-link-token`, `/api/plaid/exchange-token`, `/api/plaid/accounts`, `/api/plaid/sync-accounts`, `/api/plaid/transactions`, `/api/plaid/sync-transactions`, `/api/plaid/webhook` (webhook receiver), `/api/plaid/convert-to-manual` (downgrade handler)

**Crypto:** `/api/crypto/wallets`, `/api/crypto/sync-wallet`

**Percentile (THE killer feature):** `/api/percentile`, `/api/percentile/opt-in`, `/api/percentile/distribution`

**Other:** `/api/cashflow/monthly`, `/api/founding-members/remaining`

## Key Components

**Dashboard:** `DashboardContent.tsx`, `HeroNetWorthCard.tsx`, `GetStartedView.tsx`, `AssetBreakdownPanel.tsx`, `LiabilityBreakdownPanel.tsx`, `RecentTransactionsPanel.tsx`, `MonthlyCashFlowPanel.tsx`

**Accounts:** `ManualAssetsSection.tsx` (unified panel: Plaid + manual + crypto), `AccountsPageContent.tsx`, `AddAccountDropdown.tsx`, `AddAssetModal.tsx`, `EditAssetModal.tsx`, `PlaidLinkButton.tsx`

**Crypto:** `AddWalletModal.tsx`, `WalletsList.tsx`

**Percentile (THE killer feature):** `PercentileRankCard.tsx`, `PercentileOptInModal.tsx`, `PercentileLearnMoreModal.tsx`

**Pages:** `TransactionsPageContent.tsx` (Premium), `ReportsPageContent.tsx` (Premium), `BudgetPageContent.tsx`

**Pricing:** `PricingCard.tsx`, `PricingSection.tsx`, `FoundingMemberBanner.tsx`, `SubscriptionContext.tsx`

**UI:** `Modal.tsx`, `Dropdown.tsx`, `Button.tsx`, `TextField.tsx`, `SelectField.tsx`

## Architecture Decisions

### Unified Accounts Panel
Merge Plaid + manual + crypto into single panel. Reduces cognitive load. Free: unlimited manual + 2 crypto. Premium: unlimited Plaid auto-sync. Visual badges: Plaid (emerald), Manual (amber), Crypto (purple). `ManualAssetsSection.tsx` fetches parallel, transforms to `UnifiedEntry` interface.

### Subscription Tiers
`SubscriptionContext.tsx` + `permissions.ts`. Dev mode: all features enabled. Production: Free/Premium only (Pro eliminated).

### Historical Snapshots
Real-data-only (no backfill/synthetic). Daily cron (`pg_cron`) midnight UTC. Ghost chart (preview) for new users. Day 1: single gold dot "Today". Day 2+: full trend line. Maintains trust.

### Plaid Webhook Architecture
**Event-driven sync** replaces polling. Webhooks fire on transaction/balance changes → auto-sync accounts. Reduces API calls by 70% (4/month → 1.2/month per account). Implementation: `webhook-sync.ts` handles `DEFAULT_UPDATE`, `INITIAL_UPDATE`, `TRANSACTIONS_REMOVED` events. Logs to `webhook_event_log` table for debugging.

### Premium Downgrade Flow
**Seamless data preservation.** On subscription cancellation, Stripe webhook triggers auto-conversion: Plaid accounts → manual assets. `convertPlaidAccountsToManual()` creates manual entries with current balances, calls Plaid `itemRemove()` API to stop charges, soft-deletes accounts (`is_active = false`). Transaction history preserved for reporting. User continues tracking without interruption.

## Pre-Launch Checklist

**Database:** Apply migrations 001-020, enable pg_cron, verify seed data (49 records), verify cron jobs (1am snapshots, 3am cleanup, webhook log cleanup)

**Security:** Configure Sentry, test rate limits, verify headers, test error capture, verify sensitive data filtering

**Integrations:**
- Plaid production (Transactions only)
- **Register webhook URL in Plaid Dashboard:** `https://your-domain.com/api/plaid/webhook`
- **Subscribe to events:** `DEFAULT_UPDATE`, `INITIAL_UPDATE`, `TRANSACTIONS_REMOVED`, `ITEM_ERROR`
- Stripe products ($79/$99), webhook config
- Alchemy production, social OAuth URLs

**Testing:**
- **Automated tests:** 130/168 passing (77% coverage) ✅
  - 111 unit tests (core routes: networth, assets, crypto, percentile)
  - 42 Plaid webhook tests (includes 8 integration tests)
  - 33 Stripe tests (includes 11 integration tests)
- **Integration tests validate:**
  - Webhook lifecycle flows (cost optimization verified)
  - Subscription lifecycle flows
  - Race condition handling
  - Error recovery patterns
  - Multi-user scenarios
- **Manual testing:**
  - 10 test users, percentile opt-in E2E
  - **Test Plaid webhook flow:** Link account → verify webhook fires → check auto-sync
  - **Test downgrade flow:** Cancel subscription → verify accounts convert to manual
  - Verify transaction history preserved after downgrade
  - E2E signup flow, mobile responsive (iOS/Android)
  - Lighthouse >90, load testing

## Directory Structure (Abbreviated)

```
/
├── __tests__/               # Test suite (168 tests, 77% passing, includes 19 integration tests)
├── documentations/          # API costs, percentile specs, deployment guides, research
├── scripts/                 # SCF data processing, test utilities
├── supabase/migrations/     # 001-020 (schema, subscriptions, percentile, rate limiting, webhooks)
├── src/
│   ├── app/
│   │   ├── api/             # assets, cashflow, crypto, networth, percentile, plaid, supabase
│   │   ├── dashboard/       # accounts, budget, reports, transactions, main
│   │   └── auth/login/signup/pricing/privacy/terms
│   ├── components/
│   │   ├── dashboard/       # DashboardContent, HeroNetWorthCard, breakdowns
│   │   ├── assets/          # ManualAssetsSection, AddAssetModal, EditAssetModal
│   │   ├── percentile/      # PercentileRankCard, OptInModal, LearnMoreModal
│   │   ├── plaid/crypto/transactions/reports/pricing
│   │   └── ui/              # Modal, Dropdown, Button, TextField
│   ├── lib/
│   │   ├── interfaces/      # account, asset, crypto, networth, percentile, plaid
│   │   ├── context/         # SubscriptionContext
│   │   └── plaid/           # webhook-sync, convert-to-manual
│   └── utils/
│       ├── supabase/        # client, server
│       ├── api.ts           # apiFetch wrapper (rate limit handling)
│       └── formatters.ts    # currency, date
└── next.config.mjs, tsconfig.json, package.json
```

## Additional Documentation

See `documentations/` for:
- `research.md` - Market/competitor analysis
- `API_COST_ANALYSIS.md` - Financial modeling
- `PERCENTILE_RANKING_SPEC.md` - Feature spec
- `PERCENTILE_DATA_STRATEGY.md` - Hybrid SCF strategy
- `PERCENTILE_IMPLEMENTATION_COMPLETE.md` - Deployment guide
- `PERCENTILE_DEPLOYMENT_GUIDE.md` - Production checklist

See `__tests__/` for:
- `TEST_SUMMARY.md` - Complete test suite documentation (168 tests, 77% passing, 19 integration tests)