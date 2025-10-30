# CLAUDE.md


# TODO
* ~~FIRE calculator create user input income calculator, add accuracy to the forecast~~ ✅ DONE (Oct 2025 - implemented per-account monthly contributions instead, better for privacy)
* remove manual sync for plaid api
* mdx markup to create social content
  * make sure it has sharable links to twitter / facebook / and copy link method for sharing
  * create a library of blog posts and store it in a master content md
  * find trending reddit and create blog post specifically answer their questions
  * post comment to the reddit, create backlink effect when user shares or click on the link


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

**IMPORTANT: Database Development Best Practices**

Before creating any new tables or modifying schema:
1. **Check existing schema first**: Always query the database or review `supabase/migrations/` directory to understand current structure
2. **Avoid duplicate tables**: Search for existing tables that serve similar purposes before creating new ones
3. **Follow migration patterns**: Create new migration files following the naming convention `###_descriptive_name.sql`
4. **Test locally first**: Apply migrations to local Supabase instance before production
5. **Preserve data integrity**: Use proper foreign keys, constraints, and cascading rules
6. **Enable RLS by default**: All user-owned tables must have Row Level Security enabled
7. **Index strategically**: Add indexes for columns used in WHERE clauses, JOINs, and ORDER BY operations
8. **Use unique constraints**: Prevent duplicates at database level (e.g., `item_id`, `account_id`, `transaction_id`)
9. **Document in migrations**: Include comments explaining complex business logic in migration files
10. **Leverage existing functions**: Reuse database functions for common operations (net worth calculation, percentile ranking, etc.)

**Complete Database Schema (27 migrations applied)**

**Plaid Integration (Webhook-Driven Sync)**
| Table | Purpose | Key Columns | Constraints |
|-------|---------|-------------|-------------|
| **plaid_items** | Institutional connections | user_id, item_id (UNIQUE), access_token, institution_name, webhook_last_received_at, sync_count_daily, last_successful_sync_at | Tracks webhook receipt, daily sync quotas |
| **plaid_accounts** | Individual accounts | user_id, plaid_item_id (FK), account_id (UNIQUE), account_name, account_type, current_balance, is_active, converted_to_manual_asset_id (FK) | Soft delete via is_active flag |
| **plaid_transactions** | Transaction history | user_id, plaid_account_id (FK), transaction_id (UNIQUE), transaction_date, merchant_name, category[], amount, ai_category, pending | Preserved after account conversion |

**Crypto Tracking (Multi-Chain)**
| Table | Purpose | Key Columns | Constraints |
|-------|---------|-------------|-------------|
| **crypto_wallets** | Wallet addresses | user_id, wallet_address, wallet_name, blockchain (eth/polygon/base/arbitrum/optimism) | UNIQUE (user_id, wallet_address, blockchain) |
| **crypto_holdings** | Token balances | user_id, crypto_wallet_id (FK), token_symbol, token_name, balance (NUMERIC high precision), usd_value | Auto-synced via Alchemy API |

**Manual Asset Management**
| Table | Purpose | Key Columns | Constraints |
|-------|---------|-------------|-------------|
| **manual_assets** | User-entered assets/liabilities | user_id, asset_name, current_value, entry_type (asset/liability), category, converted_from_plaid_account_id (FK) | 15 valid categories (CHECK constraint) |
| **manual_asset_history** | Edit audit trail | manual_asset_id (FK CASCADE DELETE), user_id, old_value, new_value, changed_at | Immutable history log |

**Net Worth Tracking**
| Table | Purpose | Key Columns | Constraints |
|-------|---------|-------------|-------------|
| **net_worth_snapshots** | Daily historical tracking | user_id, snapshot_date, total_assets, total_liabilities, net_worth, breakdown (JSONB) | UNIQUE (user_id, snapshot_date) |

**Percentile Ranking (THE Killer Feature)**
| Table | Purpose | Key Columns | Constraints |
|-------|---------|-------------|-------------|
| **percentile_seed_data** | Federal Reserve SCF 2022 benchmarks | age_bracket, percentile (10/25/50/75/90/95/99), net_worth, source, data_year | Public read-only (49 rows) |
| **percentile_snapshots** | Daily percentile calculations | user_id, snapshot_date, age_bracket, net_worth, percentile, rank_position, total_users_in_bracket, uses_seed_data | UNIQUE (user_id, snapshot_date) |
| **percentile_milestones** | Achievement tracking | user_id, milestone_type (top 50%/25%/10%/5%/1%), achieved_at, net_worth_at_achievement | UNIQUE (user_id, milestone_type) |

**FIRE Trajectory (Financial Independence)**
| Table | Purpose | Key Columns | Constraints |
|-------|---------|-------------|-------------|
| **trajectory_snapshots** | Daily FIRE calculations | user_id, snapshot_date, monthly_income, monthly_expenses, monthly_savings, savings_rate, current_net_worth, fire_number (25x annual), years_to_fire, projected_fire_date, conservative_years (5%), aggressive_years (9%) | UNIQUE (user_id, snapshot_date) |
| **trajectory_milestones** | FIRE achievements | user_id, milestone_type (Coast FIRE/Lean FIRE/FIRE/Fat FIRE), achieved_at, net_worth_at_achievement, annual_expenses_at_achievement | UNIQUE (user_id, milestone_type) |
| **account_projection_config** | Per-account projection assumptions | user_id, account_id, account_source (manual_assets/plaid_accounts/crypto_wallets), custom_growth_rate (-1 to 1), custom_loan_term_years (≥0), scenario_name (default/conservative/aggressive), monthly_contribution | Polymorphic account references |

**User Profile & Subscription**
| Table | Purpose | Key Columns | Constraints |
|-------|---------|-------------|-------------|
| **user_profiles** | Basic profile metadata | id (FK auth.users), full_name, email, onboarding (JSONB) | Auto-created on signup |
| **user_settings** | Subscription & preferences | user_id (FK UNIQUE), subscription_tier (free/premium/pro), subscription_status, stripe_customer_id, stripe_subscription_id, stripe_price_id, email_notifications, cancel_at_period_end | Auto-created on signup |
| **user_demographics** | Age bracket & percentile opt-in | user_id (FK UNIQUE), date_of_birth, age_bracket (auto-calculated trigger), percentile_opt_in, percentile_consent_timestamp, uses_seed_data | Explicit opt-in required |

**System Tables**
| Table | Purpose | Key Columns | Constraints |
|-------|---------|-------------|-------------|
| **webhook_event_log** | Plaid webhook audit trail | webhook_type, webhook_code, item_id, payload (JSONB), received_at, processed_at, error_message, event_id, retry_count, status | 30-day retention, service role only |
| **rate_limit_attempts** | Request throttling | identifier (IP or user_id), endpoint_category (auth/api/expensive), request_count, window_start, last_request_at | 24-hour retention, service role only |
| **support_requests** | User feedback/support | user_id, email, type (bug/feature/account/question/other), description, status (open/in_progress/resolved/closed) | User-owned with RLS |
| **share_events** | Social sharing analytics | user_id, event_type (initiated/completed/clicked), share_type (static/progress/annual/milestone/streak), platform (twitter/linkedin/instagram/reddit/copy_link), percentile, anonymous | Anonymous sharing supported |

**Database Functions (Business Logic)**
- `calculate_current_net_worth(user_id)` - Sums Plaid + crypto + manual assets/liabilities
- `calculate_percentile_hybrid(user_id, age_bracket)` - Hybrid SCF + real user data algorithm
- `calculate_trajectory(...)` - FIRE calculations with compound interest formulas
- `should_sync_plaid_item(item_id)` - 24-hour cache check, prevents redundant API calls
- `check_and_increment_rate_limit(...)` - Atomic rate limiting (auth: 5/15min, api: 300/min, expensive: 10/hour)
- `record_daily_snapshots()` - Cron job for net worth snapshots (midnight UTC)
- `calculate_daily_percentiles()` - Cron job for percentile rankings (1am UTC)
- `calculate_daily_trajectories()` - Cron job for FIRE projections (1:30am UTC)
- `cleanup_old_rate_limits()` - Cron job for cleanup (3am UTC)
- `opt_in_percentile_tracking(...)` - SECURITY DEFINER for opt-in flow

**Scheduled Jobs (pg_cron)**
- 0:00 UTC - Daily net worth snapshots for all users
- 1:00 UTC - Daily percentile calculations for opted-in users
- 1:30 UTC - Daily FIRE trajectory projections
- 3:00 UTC - Rate limit cleanup (>24h old records)

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
- **Monthly contribution tracking** (per-account FIRE projections, no salary required - privacy win!)

**Pre-Launch (2-3 days):**
1. Mobile testing
2. E2E user flow testing
3. Performance optimization
4. Register Plaid webhook URL in dashboard
5. **Testing complete:** 130/168 tests passing (77%), including 19 integration tests ✅

**Pre-Production (3-4 hours):**
1. Apply migrations to production Supabase (001-027, includes monthly contribution tracking)
2. Enable pg_cron, verify cron jobs (snapshots, rate limit cleanup)
3. Configure Stripe ($79 founding, $99 regular)
4. Social OAuth production URLs
5. Register Plaid webhook URL: `https://your-domain.com/api/plaid/webhook`

**Phase 2 Feature Roadmap (Prioritized by Realistic Growth Impact):**

**#1 Priority: Referral Program** (2-3 days, direct growth incentive)
- "Give friend 1 month Premium free, get 1 month free" mechanics
- Why: Direct incentive for word-of-mouth. Financial conversations happen privately (not publicly on social media)
- Privacy-compatible: Targets 1-on-1 sharing behavior that actually happens
- Implementation: Referral codes, tracking table, email templates, redemption logic

**#2 Priority: SEO Content** (ongoing, Phase 2 focus)
- "Net Worth Percentile by Age" flagship article, competitor comparisons
- Why: High-intent search traffic, compounds over time, captures users actively looking for solution
- SEO: 12K searches/month for "net worth percentile by age", 18K for "how to calculate net worth"
- Implementation: Blog section, markdown content, og:meta tags, internal linking

**#3 Priority: Trajectory** ✅ **COMPLETE** (SEO opportunity)
- ✅ Calculate path to financial independence based on savings rate
- ✅ Per-account monthly contribution tracking (no salary required - privacy win!)
- ✅ Real-time projection updates with compound interest + annuity formulas
- Why: Target audience (24-35 tech workers) loves FIRE content
- SEO: "FIRE calculator" = 40K searches/month
- Next: Add 25x expenses rule visualization, blog content

**#4 Priority: Sankey Diagram** (2-3 weeks, unique differentiator)
- Visual cashflow: income → expenses → savings/investments
- Why: Unique feature Monarch/YNAB don't have
- Premium upsell: "See where your money flows"
- Implementation: d3.js/Recharts Sankey, transaction categorization (already have Plaid transactions)

**#5 Priority: Partner/Household Tracking** (3-4 weeks, network effects)
- Shared net worth view for couples
- Why: 2 users per household, higher retention
- Monetization: Family plan pricing ($149/yr for 2 users)
- Implementation: Multi-user auth, shared resources table, permissions

**Decision framework:** Ship referral program first (proven ROI, privacy-compatible). SEO compounds over time. Core product reliability drives organic word-of-mouth. Validate ALL assumptions with real users before building speculative viral mechanics.

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
1. **Unique value prop:** Shows users where they stand vs peers (no competitor has this)
2. **Gamification/motivation:** "Top 15% of 28-year-olds" creates tangible progress tracking
3. **SEO moat:** Enables unique content competitors can't replicate (hybrid SCF + real user data)
4. **Hard to copy:** Requires critical mass + 6-12 months dev time
5. **Network effects:** More users = more accurate percentiles = more valuable

**Competitive moat:** First-mover advantage + data advantage. Monarch would need 6-12 months to build. By then, we have SEO authority, backlinks, and user trust.

**Reality check on virality:** Financial data is THE most private info. Don't expect organic social sharing. Instead, percentiles drive value through: (1) SEO content unique to us, (2) private word-of-mouth ("I finally know where I stand"), (3) retention (users check back to see progress).

### Launch Positioning

- "The net worth tracker that shows you where you stand (and celebrates your wins)"
- "Finally, a wealth app that makes you feel GOOD about your progress"
- "Stop budget shaming, start wealth building"

## Go-to-Market

**Phase 0 (Months 1-3):** Build in public, waitlist (200-500), private beta (50-100)

**Phase 1 (Months 4-6):** Product Hunt, Reddit (r/PersonalFinance, r/Fire), Twitter, Indie Hackers. **Launch referral program Week 1** (low-effort, high-ROI). Goal: 500 signups, 100 paying.

**Phase 2 (Months 7-12):** SEO content (primary focus), YouTube, Discord community, YouTuber affiliates. Optimize referral program based on data. Goal: 2,000 users, 400 paying.

**Phase 3 (Months 13-24):** FB/IG ads ($50-100 CAC), Google ads, partnerships. Goal: 10,000 users, 2,000 paying ($480K ARR).

## SEO & Content Strategy

### Why SEO Matters

Educational financial content drives sustainable, low-CAC user acquisition. Unlike paid ads, SEO compounds over time. At 15K users, organic traffic should represent 30-40% of signups (following Copilot's playbook).

**Key advantages:**
- High search volume for net worth/percentile keywords
- Builds authority and trust in financial literacy space
- Supports "wealth-building mindset" positioning
- Leverages percentile ranking for unique content angles competitors can't copy

**Timeline:** Defer to Phase 2 (Months 7-12). SEO takes 3-6 months to rank - too slow for initial traction. Focus Phase 1 on Product Hunt/Reddit/Twitter for faster feedback loops.

### Content Pillars

**1. Percentile Ranking Content (Leverage Killer Feature)**
- "Net Worth Percentile by Age: Where Do You Rank?" (PRIMARY pillar)
- "Am I Wealthy? Compare Your Net Worth to Peers"
- "Top 10% Net Worth by Age: What Does It Take?"
- "Net Worth Milestones: 25th, 50th, 75th, 90th Percentile Breakdown"

**Why this works:** Uses hybrid SCF + real user data for unique insights. Monarch/YNAB can't compete without 6-12 months dev time + critical mass. Every article ties back to percentile tracker signup CTA.

**2. Net Worth Tracking Guides**
- "How to Calculate Net Worth (+ Free Tracker)"
- "5 Assets Young Adults Forget to Track" (crypto, stock options, 401k vesting, etc.)
- "Net Worth vs Income: Why Wealth Tracking Matters More"
- "How to Track Crypto Net Worth Across Multiple Wallets"

**3. Competitor Comparison**
- "Best Net Worth Tracker 2025: Guapital vs Monarch vs Copilot"
- "Monarch Alternatives: 5 Net Worth Apps for Crypto Investors"
- "YNAB vs Net Worth Trackers: Which is Right for You?"

**Strategic angle:** Position as crypto-first alternative to Monarch, wealth-building alternative to YNAB.

### Keyword Strategy

**High-Intent Keywords (Target First):**

| Keyword | Monthly Searches | Difficulty | Priority |
|---------|------------------|------------|----------|
| net worth percentile by age | 12,000 | Medium | HIGH |
| am i wealthy for my age | 8,500 | Low | HIGH |
| best net worth tracker | 6,200 | High | MEDIUM |
| how to calculate net worth | 18,000 | Medium | HIGH |
| monarch alternative | 2,400 | Low | MEDIUM |
| crypto net worth tracker | 1,800 | Low | HIGH |
| net worth vs income | 9,500 | Low | MEDIUM |

**Content Gap Opportunities:**
- Monarch: No percentile ranking content (our moat)
- YNAB: Dominates budgeting, weak on net worth tracking
- Copilot: iOS-only, no crypto coverage
- Personal Capital: Acquired by Empower, brand confusion

**Long-tail Strategy:**
- "net worth percentile 28 year old" (low competition, high intent)
- "how to track defi net worth" (crypto angle)
- "net worth tracker for tech workers" (audience-specific)

### Content Calendar

**Phase 2 Launch (Months 7-9):**
- Month 7: "Net Worth Percentile by Age" (flagship piece, 3K+ words)
- Month 8: "How to Calculate Net Worth (+ Free Tracker)"
- Month 9: "Best Net Worth Tracker 2025" (competitor comparison)

**Phase 2 Growth (Months 10-12):**
- Month 10: "5 Assets Young Adults Forget to Track"
- Month 11: "Am I Wealthy? Compare Your Net Worth to Peers"
- Month 12: "How to Track Crypto Net Worth"

**Publication Frequency:** 1-2 posts/month (sustainable for small team)

**Format:** 2,000-3,500 words, actionable guides with examples, screenshots, data visualizations. Every article ends with CTA to sign up.

### Success Metrics

**Organic Traffic Goals:**

| Month | Monthly Visitors | Signups from SEO | Conversion Rate |
|-------|------------------|------------------|-----------------|
| Month 9 | 500 | 15-25 | 3-5% |
| Month 12 | 2,000 | 60-100 | 3-5% |
| Month 18 | 8,000 | 240-400 | 3-5% |
| Month 24 | 20,000 | 600-1,000 | 3-5% |

**ROI Timeline:**
- Months 7-9: Investment phase (writing, no traffic)
- Months 10-12: Early traction (500-2K visitors/month)
- Months 13-18: Compounding growth (2K-8K visitors/month)
- Months 19-24: Mature channel (8K-20K visitors/month, 30-40% of signups)

**Leading Indicators:**
- Google Search Console impressions/clicks
- Keyword rankings (track top 20 keywords)
- Backlinks from high-authority sites (Reddit, Indie Hackers, finance blogs)
- Time on page >3 minutes (engagement signal)

### Budget & Resources

**Option 1: DIY (Recommended for Phase 2)**
- Cost: Your time (8-12 hours/article)
- Quality: High (domain expertise, authentic voice)
- SEO: Use SurferSEO ($89/month) for keyword optimization
- Total: $89/month + time

**Option 2: Outsourced**
- Cost: $200-500/article (finance writers)
- Quality: Medium (requires heavy editing/fact-checking)
- Risk: Generic voice, may need rewrites
- Total: $400-1,000/month (2 articles)

**Recommendation:** Start DIY. At 2,000 users ($22K MRR), consider outsourcing to freelancer for $300/article while you provide outline + data insights.

**Tools:**
- SurferSEO: Keyword optimization ($89/month)
- Ahrefs/SEMrush: Competitor research ($99-199/month, optional)
- Grammarly: Editing ($12/month)

### Distribution & Amplification

**1. Reddit Amplification**
- Post to r/personalfinance, r/financialindependence, r/Fire
- Use percentile data in comments (with link to full article)
- Engage authentically - don't spam

**2. Twitter Strategy**
- Tweet thread summarizing key insights
- Tag finance influencers (when relevant)
- Use visuals (percentile charts, infographics)

**3. Backlink Strategy**
- Guest post on Indie Hackers (bootstrapped SaaS angle)
- Outreach to finance bloggers (offer unique percentile data)
- HARO (Help A Reporter Out) for journalist requests

**4. Email Newsletter**
- Repurpose content for weekly newsletter
- Build email list via blog signup CTA
- Nurture to free trial (Premium conversion)

### What to Avoid

**Don't Create:**
- Generic budgeting content ("10 budgeting tips") - conflicts with positioning, YNAB dominates
- Thin content (<1,500 words) - Google penalizes low-quality finance content (YMYL)
- Clickbait headlines - damages trust in financial vertical
- Investment advice - regulatory/liability risk
- Crypto trading tips - outside core value prop (tracking, not trading)

**Content Quality Bar:**
- Every article must be 2,000+ words with unique insights
- Use real data (SCF + user data when available)
- Include actionable steps, not just theory
- Maintain professional, educational tone
- Cite sources (Federal Reserve, Pew Research, etc.)

### Competitive Moat

**Why This Works:**
1. **Unique Data:** Hybrid SCF + real user percentile data = content angle competitors can't replicate
2. **First-Mover:** 6-12 month head start on percentile content
3. **Authentic Voice:** Founder-written = domain expertise + authentic positioning
4. **Network Effects:** More users = richer data = better content = more users

**Monarch's Challenge:** To compete, they'd need to:
1. Build percentile ranking feature (6-12 months)
2. Acquire user base critical mass
3. Create content strategy around it
By then, Guapital has SEO authority + backlinks.

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

**Decision framework:** Does this help track net worth / reduce friction / improve core reliability / ship in <2 weeks? If no → Don't build yet. Prioritize proven growth channels (referrals, SEO, product quality) over speculative viral mechanics.

**Scope creep red flags (Phase 2+):**
- Budgeting features (conflicts with positioning - YNAB dominates)
- Investment performance tracking
- Solana NFT tracking
- Financial advisor sharing
- Credit score monitoring

**Never compromise:** Data encryption, secure auth, backups, user privacy

### Coding Best Practices

**General Code Quality**
1. **No emojis in code**: Log messages, comments, variable names, function names should be professional and clean
2. **TypeScript strict mode**: Enable strict type checking, avoid `any` types
3. **Error handling**: Always wrap async operations in try/catch, return meaningful error messages
4. **Logging**: Use structured logging with context (user_id, action, timestamp) for debugging
5. **Comments**: Explain "why" not "what" - code should be self-documenting
6. **DRY principle**: Extract repeated logic into reusable functions/utilities
7. **Single Responsibility**: Functions should do one thing well
8. **Naming conventions**: Use descriptive names (e.g., `calculateMonthlyContribution` not `calc`)

**Database Development**
1. **Check schema first**: Always review `supabase/migrations/` before creating new tables
2. **Avoid duplicate tables**: Search for existing tables that serve similar purposes
3. **Follow migration patterns**: Name files `###_descriptive_name.sql`, increment numbers sequentially
4. **Test locally first**: Apply migrations to local Supabase before production
5. **Use RLS policies**: Enable Row Level Security on all user-owned tables
6. **Leverage existing functions**: Reuse database functions (net worth calculations, percentile ranking)
7. **Add proper indexes**: Index columns used in WHERE, JOIN, ORDER BY operations
8. **Unique constraints**: Prevent duplicates at database level (e.g., transaction_id, item_id)
9. **Foreign keys with CASCADE**: Define cascading delete rules (e.g., manual_asset_history → manual_assets)
10. **Document complex logic**: Add SQL comments explaining business rules

**API Development**
1. **Auth first**: Always check `auth.getUser()` before processing requests
2. **Input validation**: Validate all request parameters with Zod or similar
3. **Rate limiting**: Use existing rate limit middleware (auth/api/expensive categories)
4. **Error responses**: Return consistent error format with status codes
   ```typescript
   return NextResponse.json({ error: 'Description' }, { status: 400 })
   ```
5. **Supabase patterns**: Use `createClient()` from `@/utils/supabase/server` for API routes
6. **Avoid N+1 queries**: Use JOINs or parallel queries instead of loops
7. **Transaction safety**: Use database transactions for multi-step operations
8. **Idempotency**: Design APIs to handle duplicate requests safely (especially webhooks)

**React/Next.js Development**
1. **Server vs Client components**: Default to Server Components, use 'use client' only when needed
2. **API wrapper**: Use `apiGet/apiPost` from `@/utils/api` for automatic rate limit handling
3. **Subscription context**: Use `useSubscription()` hook for feature gating
4. **Loading states**: Always show loading UI during async operations
5. **Error boundaries**: Handle errors gracefully with user-friendly messages
6. **Avoid prop drilling**: Use Context for deeply nested props
7. **Memoization**: Use `useMemo/useCallback` for expensive computations
8. **Parallel data fetching**: Fetch independent data in parallel, not sequentially

**Security Best Practices**
1. **Never expose secrets**: Service role keys only in API routes (server-side)
2. **Sanitize inputs**: Validate and sanitize all user inputs before database queries
3. **RLS enforcement**: Trust database RLS policies, don't replicate in application code
4. **Webhook verification**: Verify webhook signatures (Stripe, Plaid) before processing
5. **HTTPS only**: All external API calls must use HTTPS
6. **Token management**: Never log or expose access tokens, encrypt sensitive data
7. **Rate limiting**: Leverage existing rate limiting for all public endpoints
8. **CORS configuration**: Restrict origins in production (Plaid, Stripe, Supabase only)

**Testing Standards**
1. **Test critical paths**: Net worth calculation, percentile ranking, subscription flows
2. **Integration tests**: Test webhook flows, Stripe events, database triggers
3. **Mock external APIs**: Use test fixtures for Plaid, Alchemy, Stripe responses
4. **Test error scenarios**: Handle network failures, invalid inputs, race conditions
5. **Run tests locally**: `npm test` before committing changes
6. **Maintain test coverage**: Aim for >75% coverage on critical business logic

**Performance Optimization**
1. **Database indexes**: Add indexes for frequently queried columns
2. **Query optimization**: Use EXPLAIN ANALYZE to identify slow queries
3. **Caching strategy**: Leverage existing 24-hour sync cache for Plaid items
4. **Batch operations**: Use batch inserts/updates instead of loops
5. **Lazy loading**: Load components/data only when needed
6. **Image optimization**: Use Next.js Image component with proper sizing
7. **Code splitting**: Use dynamic imports for large components

**Version Control**
1. **Atomic commits**: One logical change per commit
2. **Meaningful commit messages**: Follow format "feat/fix/refactor: Description"
3. **Branch strategy**: Feature branches off main, merge after testing
4. **Review migrations**: Always review SQL migrations before merging
5. **No secrets in git**: Use .env files, never commit API keys

**Code Review Checklist**
Before submitting code, verify:
- [ ] No duplicate tables/functions (checked existing schema)
- [ ] RLS policies enabled on new tables
- [ ] Indexes added for query performance
- [ ] Error handling implemented
- [ ] Tests passing (npm test)
- [ ] No console.logs or emojis in production code
- [ ] API routes have auth checks
- [ ] Rate limiting applied
- [ ] TypeScript types defined (no `any`)
- [ ] Comments explain complex business logic

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
├── supabase/migrations/     # 001-027 (schema, subscriptions, percentile, rate limiting, webhooks, trajectory, projections)
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