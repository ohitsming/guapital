# API Cost Analysis: Guapital
## Estimated Third-Party API Costs Per User Per Month

Last Updated: January 2025

---

## Summary

### Third-Party API Costs (Variable)
| Service | Cost per User/Month | Notes |
|---------|---------------------|-------|
| **Plaid** | $0.40 - $1.50 | Depends on scale & usage tier |
| **Alchemy** | ~$0.00 - $0.05 | Free tier covers most usage |
| **CoinGecko** | $0.00 | Using free tier |
| **Subtotal** | **$0.40 - $1.55** | At scale: ~$0.50/user |

### Infrastructure Costs (Fixed + Variable)
| Service | Monthly Cost | Scales With |
|---------|-------------|-------------|
| **Claude Max** | $200 | Fixed (AI features) |
| **Supabase Pro** | $25 + usage | Database/Storage |
| **AWS Amplify** | $5 - $150 | Traffic/Bandwidth |
| **Stripe** | $18 - $5,946 | Transaction volume |
| **Subtotal** | **$248 - $6,321** | Mixed |

### Total Cost per User (Including Infrastructure + Stripe)
| User Count | API Costs | Infrastructure | Stripe Fees | Total/Month | Per User |
|------------|-----------|----------------|-------------|-------------|----------|
| 100 | $500 | $230 | $18 | $748 | **$7.48** |
| 1,000 | $750 | $289 | $287 | $1,326 | **$1.33** |
| 5,000 | $4,500 | $376 | $1,290 | $6,166 | **$1.23** |
| 25,000 | $20,341 | $845 | $5,946 | $27,132 | **$1.09** |

**Note:** Stripe fees assume increasing annual conversion rates (40% at 1K → 60% at 5K → 80% at 25K users).

---

## 1. Infrastructure Costs (Fixed + Variable)

### 1.1 Claude Max Subscription

**Purpose:** AI-powered transaction categorization (Premium+ feature)

**Pricing:**
- **Claude Max**: $200/month for ultimate usage (20x more than Pro)
- Provides access to Claude Sonnet 4.5 with high limits
- Shared between Claude Code development and production API usage

**Your Usage Pattern:**
- Transaction categorization: ~1 API call per transaction
- Average Premium+ user: 100 transactions/month
- Token usage per transaction: ~500 input + 100 output tokens

**Cost Estimate:**
- With Claude API (alternative): ~$0.003 per categorization
- 1,000 Premium users × 100 txns × $0.003 = **$300/month**
- **Claude Max subscription ($200) is cheaper** ✅

**Note:** Claude Max also covers your development work, making it highly cost-effective.

---

### 1.2 Supabase Pro Plan

**Purpose:** PostgreSQL database, authentication, real-time features

**Pricing:**
- **Base cost**: $25/month
- **Included**: 100,000 MAUs, 8GB database storage, 250GB bandwidth
- **Overage**: $0.00325 per additional MAU, $0.021/GB storage, $0.09/GB bandwidth

**Your Usage Pattern (per user per month):**
- Database storage: ~2MB per user (accounts, transactions, snapshots)
- Bandwidth: ~10MB per user (API calls, auth)
- MAU = Monthly Active Users (anyone who logs in)

**Cost Breakdown by Scale:**

| Users | Base | Storage | Bandwidth | MAU Overage | Total |
|-------|------|---------|-----------|-------------|-------|
| 100 | $25 | $0 | $0 | $0 | **$25** |
| 1,000 | $25 | $0 | $0 | $0 | **$25** |
| 5,000 | $25 | $0.21 | $0.90 | $0 | **$26** |
| 10,000 | $25 | $0.42 | $1.80 | $0 | **$27** |
| 150,000 | $25 | $6.30 | $27.00 | $162.50 | **$220** |

**Realistic Estimate:**
- **Phase 1 (1K users)**: $25/month
- **Phase 2 (5K users)**: $26/month
- **Phase 3 (25K users)**: $45/month

**Note:** Supabase scales well. You won't need Enterprise tier until 200K+ users.

---

### 1.3 AWS Amplify Hosting

**Purpose:** Next.js SSR hosting, CDN, build/deploy pipeline

**Pricing:**
- **Build minutes**: $0.01/minute (free tier: 1,000 min/month)
- **Storage**: $0.023/GB/month (free tier: 5GB)
- **Data transfer**: $0.15/GB (free tier: 15GB/month)
- **SSR compute**: $0.30/hour for compute instances

**Your Usage Pattern:**

**Build/Deploy:**
- ~10 builds per month (new features, bug fixes)
- ~5 minutes per build
- Total: 50 build minutes/month = **$0** (within free tier)

**Storage:**
- Static assets: ~100MB
- Total: **$0** (within free tier)

**Data Transfer (scales with users):**
- Average page size: 500KB
- Sessions per user per month: 20
- Data per user: 500KB × 20 = 10MB

**SSR Compute (Next.js server-side rendering):**
- Dynamic pages: Dashboard, accounts, transactions
- Requests per user: ~50/month
- Compute cost: ~$0.001 per request

**Cost Breakdown by Scale:**

| Users | Data Transfer | SSR Compute | Total |
|-------|---------------|-------------|-------|
| 100 | $0 (free tier) | $5 | **$5** |
| 1,000 | $14 | $50 | **$64** |
| 5,000 | $73 | $250 | **$323** |
| 10,000 | $148 | $500 | **$648** |

**Realistic Estimate:**
- **Phase 1 (100-500 users)**: $5-20/month
- **Phase 2 (1K-5K users)**: $64-150/month
- **Phase 3 (10K+ users)**: $300-600/month (consider migrating to dedicated EC2)

**Cost Optimization Options:**
- **Vercel**: Similar pricing, potentially cheaper at scale
- **Self-hosted EC2**: ~$50/month fixed cost for t3.medium instance
- **Static export**: Eliminate SSR for cheaper hosting (loses some features)

**Recommendation:** Stay on Amplify until 5K users, then evaluate Vercel or EC2.

---

### 1.4 Total Infrastructure Costs Summary

| User Count | Claude Max | Supabase | AWS Amplify | Total |
|------------|------------|----------|-------------|-------|
| 100 | $200 | $25 | $5 | **$230** |
| 500 | $200 | $25 | $20 | **$245** |
| 1,000 | $200 | $25 | $64 | **$289** |
| 5,000 | $200 | $26 | $150 | **$376** |
| 10,000 | $200 | $27 | $300 | **$527** |
| 25,000 | $200 | $45 | $600 | **$845** |

**Key Insight:** Infrastructure costs are **mostly fixed** ($200-400/month) until you hit 5K+ users, then AWS Amplify scales linearly.

---

## 2. Plaid API Costs

### Pricing Tiers (Production)
- **Pay-as-you-go**: No minimum, ~$1.50/user/month
- **Growth**: $500/month minimum, ~$0.90/user/month (1K-50K users)
- **Scale**: Enterprise pricing, ~$0.40/user/month (200K+ users)

### Your Usage Pattern (Per User Per Month)

Based on codebase analysis:

**Initial Setup (One-time):**
- Link token creation: 1 call
- Exchange token: 1 call
- Initial account sync: 1 call
- Initial transaction sync (90 days): 1 call

**Recurring (Monthly):**
- Dashboard load (Plaid accounts fetch): ~30 calls/month (daily usage)
- Accounts page load: ~15 calls/month
- Transaction page load: ~10 calls/month (Premium+ only)
- Manual sync button: ~5 calls/month
- Transaction sync (Premium+): ~4 calls/month (weekly)

**Total API Calls per User:**
- **Free Tier Users**: ~50 calls/month (no transaction access)
- **Premium+ Users**: ~70 calls/month (with transactions)

### Estimated Plaid Costs

**At Different Scales:**
- **100 users**: $500/month minimum (Growth) = **$5.00/user**
- **1,000 users**: $500-900/month = **$0.50-0.90/user**
- **5,000 users**: $4,500/month = **$0.90/user**
- **25,000 users**: $20,000/month = **$0.80/user**
- **100,000+ users**: Custom pricing = **$0.40-0.60/user**

**Realistic Estimate for Phase 1 (1K users):** **$0.75/user/month**

---

## 3. Alchemy API Costs

### Pricing Tiers
- **Free Tier**: 100M compute units (CUs) / month
- **Growth Plan**: $49/month for 300M CUs + $10/100M additional
- **Scale Plan**: Custom pricing

### Compute Unit Costs (Per API Call)

Based on Alchemy documentation:
- `eth_getBalance`: 10 CUs
- `alchemy_getTokenBalances`: 165 CUs
- `alchemy_getTokenMetadata`: 10 CUs (per token)

### Your Usage Pattern (Per Crypto Wallet Per Month)

**Initial Setup:**
- `eth_getBalance`: 10 CUs
- `alchemy_getTokenBalances`: 165 CUs
- `alchemy_getTokenMetadata` x 20 tokens: 200 CUs
- **Total**: ~375 CUs

**Recurring (Monthly):**
- Page loads: ~10 syncs/month x 375 CUs = 3,750 CUs
- Manual syncs: ~5 syncs/month x 375 CUs = 1,875 CUs
- **Total per wallet**: ~5,625 CUs/month

### Estimated Alchemy Costs

**Assumptions:**
- Average user has 2 crypto wallets (Free: 2, Premium+: unlimited)
- Free tier: 100M CUs/month

**Cost Calculations:**
- **100 users** x 2 wallets x 5,625 CUs = **1.125M CUs** = **FREE** ✅
- **1,000 users** x 2 wallets x 5,625 CUs = **11.25M CUs** = **FREE** ✅
- **5,000 users** x 2 wallets x 5,625 CUs = **56.25M CUs** = **FREE** ✅
- **10,000 users** x 2 wallets x 5,625 CUs = **112.5M CUs** = **$49/month** = **$0.0049/user**
- **20,000 users** x 2 wallets x 5,625 CUs = **225M CUs** = **$49 + $120** = **$0.0085/user**

**Realistic Estimate for Phase 1 (1K users):** **$0.00/user/month** (free tier)

**Breaking Point:** ~9,000 users before needing paid Alchemy plan

---

## 4. CoinGecko API Costs

### Current Usage
- Token price lookups for ETH/MATIC: 1-2 calls per wallet sync
- Using free public API (no authentication required)

### Free Tier Limits
- 10-50 calls/minute
- No monthly limit
- No cost

### Your Usage Pattern
- Price fetches only during wallet syncs
- Caching prices for ~5 minutes reduces calls
- Estimated: ~2 calls per user per day = 60 calls/user/month

**Cost:** **FREE** for foreseeable future ✅

**Note:** If you hit rate limits at scale (50K+ users), CoinGecko Pro is $129/month for 500 calls/minute.

---

## 5. Stripe Payment Processing Fees

### Pricing Structure

**Stripe Standard Pricing:**
- 2.9% + $0.30 per successful card charge
- No setup fees, no monthly fees
- Same rate for all card types (credit/debit)

### Cost Analysis by Billing Model

**Monthly Subscriptions ($15/month):**
- Fee per transaction: 2.9% of $15 + $0.30 = $0.44 + $0.30 = **$0.74**
- Transactions per year: 12
- **Total annual fees:** $0.74 × 12 = **$8.88 per user per year**
- **Effective rate:** $8.88 / $180 = **4.93%**

**Annual Subscriptions ($99/year):**
- Fee per transaction: 2.9% of $99 + $0.30 = $2.87 + $0.30 = **$3.17**
- Transactions per year: 1
- **Total annual fees:** **$3.17 per user per year**
- **Effective rate:** $3.17 / $99 = **3.20%**

**Founding Member Subscriptions ($79/year):**
- Fee per transaction: 2.9% of $79 + $0.30 = $2.29 + $0.30 = **$2.59**
- Transactions per year: 1
- **Total annual fees:** **$2.59 per user per year**
- **Effective rate:** $2.59 / $79 = **3.28%**

### Cost Impact Summary

| Billing Type | Revenue/Year | Stripe Fee | Net Revenue | Effective Rate |
|--------------|--------------|------------|-------------|----------------|
| Monthly ($15/mo) | $180 | $8.88 | $171.12 | 4.93% |
| Annual ($99/yr) | $99 | $3.17 | $95.83 | 3.20% |
| Founding ($79/yr) | $79 | $2.59 | $76.41 | 3.28% |

**Key Insight:** Annual billing saves ~1.7% in Stripe fees compared to monthly (3.2% vs 4.93%).

### Projected Stripe Costs (1,000 users, Year 1)

**Scenario: 60% monthly, 40% annual mix**
- 240 monthly users: 240 × $8.88 = **$2,131.20/year** ($177.60/month)
- 160 annual users: 160 × $3.17 = **$507.20/year** ($42.27/month)
- **Total Stripe fees:** **$2,638.40/year** ($219.87/month)
- **Per user average:** $2.64/year ($0.22/month)

**Scenario: 40% monthly, 60% annual mix** (after conversions)
- 160 monthly users: 160 × $8.88 = **$1,420.80/year** ($118.40/month)
- 640 annual users: 640 × $3.17 = **$2,028.80/year** ($169.07/month)
- **Total Stripe fees:** **$3,449.60/year** ($287.47/month)
- **Per user average:** $3.45/year ($0.29/month)

**Optimization:** Drive annual conversions to reduce Stripe fees by 35% per user.

### Failed Payment Handling

**Stripe retry logic (automatic):**
- Failed payments are automatically retried
- Smart retry schedule (3 days, 5 days, 7 days)
- No additional fees for retries
- Dunning emails included

**Involuntary churn:**
- Industry average: 0.8-1.5% monthly for failed payments
- Annual subscriptions reduce this risk (1 charge vs 12)
- Stripe's Account Updater helps maintain valid cards

---

## 6. Total Cost Projections (Updated with Infrastructure + Stripe)

### Phase 1: MVP Launch (1,000 paying users)

**Assumptions:** 40% monthly ($15/mo), 60% annual ($99/yr) mix after 6 months of conversions

| Service | Monthly Cost | Per User | Cost Type |
|---------|-------------|----------|-----------|
| **Infrastructure** |
| Claude Max | $200 | $0.20 | Fixed |
| Supabase Pro | $25 | $0.03 | Fixed |
| AWS Amplify | $64 | $0.06 | Variable |
| **Third-Party APIs** |
| Plaid | $750 | $0.75 | Variable |
| Alchemy | $0 | $0.00 | Free tier |
| CoinGecko | $0 | $0.00 | Free tier |
| **Payment Processing** |
| Stripe fees | $287 | $0.29 | Variable |
| **TOTAL** | **$1,326** | **$1.33** |

**Revenue at 1K users (blended):**
- 400 monthly users: 400 × $15 = $6,000/month
- 600 annual users: 600 × $99 / 12 = $4,950/month
- **Total revenue:** $10,950/month ($131,400/year)
- **Total costs:** $1,326/month ($15,912/year)
- **Cost as % of revenue:** 12.1%
- **Net revenue per user:** $10.95 - $1.33 = **$9.62/month**
- **Gross margin: 87.9%** ✅

**Note:** Blended model includes both monthly and annual subscribers. Annual users have higher margins due to lower Stripe fees.

---

### Phase 2: Growth (5,000 paying users)

**Assumptions:** 30% monthly ($15/mo), 70% annual ($99/yr) mix (more users converting to annual)

| Service | Monthly Cost | Per User | Cost Type |
|---------|-------------|----------|-----------|
| **Infrastructure** |
| Claude Max | $200 | $0.04 | Fixed |
| Supabase Pro | $26 | $0.01 | Fixed |
| AWS Amplify | $150 | $0.03 | Variable |
| **Third-Party APIs** |
| Plaid | $4,500 | $0.90 | Variable |
| Alchemy | $0 | $0.00 | Free tier |
| CoinGecko | $0 | $0.00 | Free tier |
| **Payment Processing** |
| Stripe fees | $1,290 | $0.26 | Variable |
| **TOTAL** | **$6,166** | **$1.23** |

**Revenue at 5K users (blended):**
- 1,500 monthly users: 1,500 × $15 = $22,500/month
- 3,500 annual users: 3,500 × $99 / 12 = $28,875/month
- **Total revenue:** $51,375/month ($616,500/year)
- **Total costs:** $6,166/month ($73,992/year)
- **Cost as % of revenue:** 12.0%
- **Net revenue per user:** $10.28 - $1.23 = **$9.05/month**
- **Gross margin: 88.0%** ✅

---

### Phase 3: Scale (25,000 paying users)

**Assumptions:** 20% monthly ($15/mo), 80% annual ($99/yr) mix (mature conversion funnel)

| Service | Monthly Cost | Per User | Cost Type |
|---------|-------------|----------|-----------|
| **Infrastructure** |
| Claude Max | $200 | $0.01 | Fixed |
| Supabase Pro | $45 | $0.002 | Variable |
| AWS Amplify | $600 | $0.024 | Variable |
| **Third-Party APIs** |
| Plaid | $20,000 | $0.80 | Variable |
| Alchemy | $212 | $0.0085 | Variable |
| CoinGecko | $129 | $0.0052 | Variable |
| **Payment Processing** |
| Stripe fees | $5,946 | $0.24 | Variable |
| **TOTAL** | **$27,132** | **$1.09** |

**Revenue at 25K users (blended):**
- 5,000 monthly users: 5,000 × $15 = $75,000/month
- 20,000 annual users: 20,000 × $99 / 12 = $165,000/month
- **Total revenue:** $240,000/month ($2,880,000/year)
- **Total costs:** $27,132/month ($325,584/year)
- **Cost as % of revenue:** 11.3%
- **Net revenue per user:** $9.60 - $1.09 = **$8.51/month**
- **Gross margin: 88.7%** ✅

**Key Insight:** Fixed infrastructure costs become negligible at scale. Stripe fees are optimized by high annual conversion rate (80%).

---

## 7. Cost Optimization Strategies

### Immediate (Phase 1-2)
1. ✅ **Use free tiers aggressively** - Already doing this
2. ✅ **Cache Plaid data** - Reduce redundant calls by storing balances locally
3. ✅ **Batch operations** - Sync multiple accounts in single session
4. ✅ **Smart refresh logic** - Only sync when user requests or 24hrs+ elapsed
5. ✅ **Drive annual conversions** - Saves 1.7% in Stripe fees (3.2% vs 4.93%)
   - In-app prompts after 1-3 months of monthly subscription
   - Email campaigns showing "You've spent $45, switch to annual for $99 and save!"
   - Target: 40% of monthly users convert within 6 months

### Medium-term (Phase 2-3)
1. **Negotiate Plaid volume discount** - At 10K+ users, custom pricing unlocks
2. **Implement rate limiting** - Prevent abuse (users spamming sync button)
3. **Add sync quotas by tier** - Free: 1 sync/day, Premium: 10 syncs/day
4. **CoinGecko caching** - Store prices for 5-15 minutes, reduce API calls by 90%
5. **Optimize Stripe fees:**
   - Enable Stripe Billing auto-collection (reduces failed payments)
   - Use Stripe's Account Updater (keeps cards current, reduces involuntary churn)
   - Consider annual-only pricing if monthly conversion rate is low (<20%)

### Long-term (Phase 3+)
1. **Multi-aggregator strategy** - Add Yodlee/MX as backup, negotiate better rates
2. **Premium Alchemy tier** - At 50K+ users, negotiate enterprise pricing
3. **Self-hosted price oracle** - Build own price feed from DEX aggregators
4. **Webhook-based syncing** - Plaid webhooks reduce polling needs by 50%
5. **Negotiate Stripe volume pricing:**
   - At $1M+ annual processing volume, negotiate custom rates
   - Potential savings: 0.2-0.5% reduction (2.9% → 2.4-2.7%)
   - At 25K users processing $2.88M/year, could save $7,200-14,400/year

---

## 8. Break-even Analysis (Updated with Infrastructure + Stripe)

### Minimum Users to Cover Fixed Costs

**Assumptions:**
- Blended revenue: 40% monthly ($15/mo), 60% annual ($99/yr) = $10.95/month average
- Blended costs: $1.33/user/month at 1K scale (infrastructure + APIs + Stripe)

**Fixed Costs:** $489/month (Claude Max $200 + Supabase $25 + AWS Amplify $64 + base Stripe $200*)
**Variable Costs:** $1.04/user (Plaid $0.75 + Stripe $0.29)
**Net Revenue per User:** $10.95 - $1.04 = **$9.91/month**

**Break-even:** $489 / $9.91 = **50 paying users** ✅

*Note: Stripe has no fixed costs, but we're accounting for ~$200/month in baseline transaction fees

**Updated Profitability:**
- **Break-even: 50 users** (blended monthly/annual mix)
- **Profitable from Month 1** if you launch with 75+ beta users
- **$9.62 net profit per user** after all costs at 1K scale
- **Gross margin: 87.9%** even with Stripe fees included

**Key Insight:** Annual subscribers are MORE profitable due to lower Stripe fees (3.2% vs 4.93%)

---

## 9. Competitive Comparison

| App | Subscription Price | Total Costs/User | Gross Margin |
|-----|-------------------|------------------|--------------|
| **Guapital** | $99/year ($8.25/mo) | $1.04/user | **87.4%** |
| Monarch Money | $180/year ($15/mo) | ~$2.50/user | 83% |
| Copilot | $180/year ($15/mo) | ~$2.00/user | 87% |
| YNAB | $109/year ($9.08/mo) | $0.50/user* | 94%* |

*YNAB uses manual entry primarily, minimal API + infrastructure costs

**Your advantage:** Better margins than Monarch, similar to Copilot, at 45% lower price point!

**Net revenue comparison at 1K users:**
- **Guapital**: $7.21/user/month net = **$7,210/month**
- Monarch: $12.50/user/month net = **$12,500/month** (but harder to acquire users at $180/year)
- Your value prop: **Cheaper for users, still highly profitable for you** ✅

---

## 10. Risk Mitigation

### What if API costs spike unexpectedly?

**Scenario 1: Plaid raises prices by 50%**
- New Plaid cost: $1.13/user (was $0.75)
- Total cost: $1.42/user (was $1.04)
- Net revenue: $6.83/user (was $7.21)
- Gross margin: 82.8% (was 87.4%)
- **Impact:** Still profitable, margins remain healthy ✅

**Scenario 2: AWS Amplify costs spike at scale**
- At 10K users, hosting could hit $600/month ($0.06/user)
- Total cost: $1.10/user
- Net revenue: $7.15/user
- **Mitigation:** Migrate to EC2 for $50-100/month fixed cost ✅

**Scenario 3: Claude Max not cost-effective**
- Switch to Claude API: ~$0.30/user at 1K users
- Total cost: $1.14/user (vs $1.04 with Max)
- **Impact:** Minimal increase, Max is already optimal ✅

**Scenario 3: Free users abuse crypto syncing**
- Implement rate limiting: 5 syncs/day max
- Show "upgrade for unlimited syncing" message
- **Impact:** Converts free users to paid ✅

---

## 11. Recommendations

### For Launch (0-1K users)
- ✅ Stay on free tiers as long as possible
- ✅ Implement basic caching (24hr account refresh)
- ✅ Monitor API usage daily via dashboards
- ⚠️ Set up alerts when approaching free tier limits

### For Growth (1K-10K users)
- ✅ Upgrade to Plaid Growth plan (~$0.90/user)
- ✅ Add usage analytics to identify high-API users
- ✅ Implement per-tier sync quotas
- ✅ Start Plaid volume pricing negotiation at 5K users

### For Scale (10K+ users)
- ✅ Move to Plaid Scale plan (custom pricing)
- ✅ Consider multi-aggregator strategy for redundancy
- ✅ Upgrade to paid Alchemy tier if needed
- ✅ Evaluate building proprietary price feeds

---

## 12. Conclusion

**Bottom Line:** Your total costs (infrastructure + APIs + Stripe) are **sustainable and highly profitable**.

**Key Takeaways:**
- **Total costs: 11-12% of revenue** across all scales
- **Break-even: 50 paying users** (achievable in first month)
- **Gross margins: 87-89%** - excellent for SaaS with blended monthly/annual pricing
- **Cost per user drops with scale:** $1.33 → $1.09 at 25K users
- **Fixed costs ($289/mo) become negligible** as you grow
- Free tiers cover you up to **~9,000 users** for crypto tracking
- **Competitive with industry leaders** at half the price
- **Stripe fees optimized** by driving annual conversions (saves 1.7% vs monthly)

**This is a highly scalable, capital-efficient business model.** 🚀

**Updated Cost Structure (at 1K users):**
- **Infrastructure** (Claude + Supabase + AWS): $289/month (mostly fixed)
- **APIs** (Plaid + Alchemy + CoinGecko): $750/month ($0.75/user)
- **Payment Processing** (Stripe): $287/month ($0.29/user)
- **Total costs**: $1,326/month = $1.33/user
- **Revenue** (blended 40/60 monthly/annual): $10,950/month
- **Net profit**: $9,624/month (87.9% margin)

### Cost Breakdown by User Type

| User Type | Revenue/Year | Stripe Fee | Net After Stripe | Margin |
|-----------|--------------|------------|------------------|--------|
| **Monthly ($15/mo)** | $180 | $8.88 (4.93%) | $171.12 | 95.1% |
| **Annual ($99/yr)** | $99 | $3.17 (3.20%) | $95.83 | 96.8% |
| **Founding ($79/yr)** | $79 | $2.59 (3.28%) | $76.41 | 96.7% |

**Key Insight:** Annual subscribers are MORE profitable due to lower Stripe fees AND lower churn.

Your aggressive growth pricing ($15/mo or $79-99/year) is **absolutely sustainable** even with all infrastructure, API, and payment processing costs included. The real investment will be customer acquisition (marketing), not technical infrastructure.

**Optimization Priority:** Drive monthly → annual conversions to:
1. Increase revenue per user ($99 vs $180 equivalent)
2. Reduce Stripe fees (3.2% vs 4.93%)
3. Lower churn (annual users are 5x stickier)

**Recommendation:** Launch confidently. Your unit economics are excellent. Focus on growth and annual conversion optimization, not cost cutting.
