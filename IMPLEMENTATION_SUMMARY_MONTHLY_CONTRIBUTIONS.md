# Monthly Contributions Implementation Summary

**Date:** October 29, 2025
**Feature:** Per-Account Monthly Contribution Tracking for FIRE Calculator

## Overview

Implemented Option B: Per-account monthly contribution tracking to make trajectory projections more accurate for FIRE (Financial Independence, Retire Early) calculations without requiring salary input.

## Strategic Rationale

### Why Option B (Per-Account) Over Option A (Global Contribution)

1. **Privacy Advantage**: Never asking for salary is a key differentiator vs competitors
2. **Legal Clarity**: User provides all inputs, we just calculate (educational tool, not financial advice)
3. **More Accurate Modeling**: Handles real-world contribution patterns (401k: $1,916/mo, IRA: $583/mo, etc.)
4. **Handles Diverse Situations**: Supports freelancers, irregular income, multiple income sources, already-FIRE'd users
5. **Natural UX Extension**: Fits existing per-account editing pattern
6. **Semantic Clarity**: "Monthly Contribution" for assets, "Monthly Payment Override" for liabilities

## Implementation Details

### 1. Database Migration (027)

**File:** `supabase/migrations/027_add_monthly_contribution_to_projection_config.sql`

Added `monthly_contribution` column to existing `account_projection_config` table:
- Type: `NUMERIC(10,2) DEFAULT 0 CHECK (monthly_contribution >= 0)`
- Stores dollar amount of expected monthly contribution
- For assets: Represents ongoing deposits
- For liabilities: Overrides calculated payment if user pays extra

### 2. TypeScript Interface Update

**File:** `src/lib/interfaces/trajectory-projection.ts`

Added `monthlyContribution?: number` to `AccountProjection` interface.

### 3. API Updates

#### Loan Details API
**File:** `src/app/api/assets/[id]/loan-details/route.ts`

- Added `monthly_contribution` to request body destructuring
- Added validation (non-negative number)
- Added to database upsert operation

#### Trajectory Projection API
**File:** `src/app/api/trajectory/projection/route.ts`

- Loads `monthly_contribution` from `account_projection_config`
- Includes in `AccountProjection` objects for all account types (Plaid, manual, crypto)
- No calculation changes in API (frontend handles projection math when values change)

### 4. Frontend Implementation

**File:** `src/components/trajectory/TrajectoryPageContent.tsx`

#### State Management
- `customMonthlyContribution`, `monthlyContributionInput` - Current editing state
- `customMonthlyContributions` - Per-account stored values

#### UI Components
- Added "Monthly Contribution (Optional)" input field in edit modal
- Shows after loan term field (line 1083-1149)
- Different labels for assets vs liabilities:
  - Assets: "Monthly Contribution (Optional)"
  - Liabilities: "Monthly Payment Override (Optional)"
- Helpful hints for common account types:
  - 401(k): "💡 Annual contribution limit (2025): $23,000 ($1,916/month)"
  - IRA/Roth IRA: "💡 Annual contribution limit (2025): $7,000 ($583/month)"

#### Calculation Updates

**Asset Projection Formula:**
```typescript
// Future value of current balance
const fvOfBalance = balance * Math.pow(1 + rate, years)

// Future value of monthly contributions (annuity formula)
const fvOfContributions = rate === 0
  ? monthlyContribution * 12 * years  // No growth: sum contributions
  : monthlyContribution * 12 * (Math.pow(1 + rate, years) - 1) / rate

return fvOfBalance + fvOfContributions
```

**Liability Projection:**
- Keeps existing amortization formula
- Monthly contribution field allows overriding calculated payment
- Useful for users paying extra to accelerate debt paydown

### 5. Disclaimer Updates

**Enhanced Legal Protection:**
- "Simplified Assumptions" bullet updated to mention monthly contributions
- New "Contribution Sustainability" bullet added:
  - "If you've specified monthly contributions, ensure these are sustainable based on your income and expenses. Projections assume contributions continue regardless of income, employment, or spending changes."

**Calculation Modal:**
- Added formula breakdown showing both scenarios:
  - Without Contributions: `FV = Current Balance × (1 + Rate)^Years`
  - With Contributions: `FV = Current Balance × (1 + Rate)^Years + Monthly × 12 × [(1 + Rate)^Years - 1] / Rate`
- Tip: "💡 Add monthly contributions to each account for more accurate FIRE projections."

## Legal Compliance

### Why This Is Legal Without a Financial License

**Educational Calculator:**
- User provides ALL inputs (contribution amounts, rates, terms)
- No recommendations on how much to save or where to invest
- Extensive disclaimers ("Not Financial Advice", "Educational purposes only")
- User makes all decisions, we just calculate math

**Precedent:**
- Bankrate, NerdWallet, Fidelity, Personal Capital all offer similar calculators
- Key distinction: Projection vs. Recommendation
- We never tell users what to do, only show "what if" scenarios

**Enhanced Disclaimers:**
- "Not a recommendation to buy, sell, or hold any securities"
- "Consult a qualified professional for personalized advice"
- "You are solely responsible for your financial decisions"

## User Experience

### Assets (e.g., 401k, Brokerage)
1. User clicks edit icon on account
2. Enters monthly contribution amount (e.g., $1,916 to max out 401k)
3. Preview shows updated 10/20 year projections
4. Saves to database via PATCH `/api/assets/[id]/loan-details`
5. Frontend recalculates all projections with contributions
6. Net worth trajectory updates in real-time

### Liabilities (e.g., Mortgage)
1. System calculates standard monthly payment from loan terms
2. User can override if paying extra (e.g., $2,500/mo on $2,000 mortgage)
3. Projection shows accelerated paydown timeline

## Testing Checklist

- [ ] Apply migration 027 to dev database
- [ ] Test asset contribution (401k example)
- [ ] Test liability override (mortgage example)
- [ ] Test zero contribution (default behavior)
- [ ] Test contribution persistence across page reloads
- [ ] Test calculation accuracy (compare to spreadsheet)
- [ ] Test with $0 growth rate (edge case)
- [ ] Test UI validation (negative numbers rejected)
- [ ] Verify disclaimers display correctly
- [ ] Mobile responsive testing

## Files Changed

1. `supabase/migrations/027_add_monthly_contribution_to_projection_config.sql` - New migration
2. `src/lib/interfaces/trajectory-projection.ts` - Interface update
3. `src/app/api/assets/[id]/loan-details/route.ts` - API update
4. `src/app/api/trajectory/projection/route.ts` - API update
5. `src/components/trajectory/TrajectoryPageContent.tsx` - UI + calculations

## Next Steps

1. Apply migration to production Supabase
2. Test E2E flow with real user data
3. Monitor for edge cases (very large contributions, unusual growth rates)
4. Consider adding bulk edit feature in future (set contribution for multiple accounts)
5. Consider adding contribution escalation (e.g., "increase 3%/year with raises")

## Impact

**Before:** Projections assumed no ongoing contributions → Conservative, inaccurate for FIRE users
**After:** Per-account contributions → Realistic modeling without salary input

**Privacy Win:** Competitors ask for salary, we don't need it
**Accuracy Win:** Models real contribution patterns (not generic % of salary)
**Legal Win:** User controls all assumptions, we just calculate math
