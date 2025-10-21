# Percentile Ranking: Data Acquisition Strategy

**Last Updated:** January 2025
**Status:** Planning Phase
**Complements:** `PERCENTILE_RANKING_SPEC.md`

---

## Executive Summary

To implement percentile rankings, we need **two types of data**:
1. **User data** - Net worth + age from Guapital users (we already collect net worth)
2. **Seed data** - External benchmark data to make percentiles meaningful before we have 500+ users per age bracket

**Recommended Strategy:** Hybrid approach using Federal Reserve SCF 2022 data blended with real user data, transitioning to 100% real data as user base grows.

**Timeline:** 2 weeks to download, process, and import seed data.

---

## 1. Data Requirements Overview

### What We Already Have ✅

From existing Guapital infrastructure:

**Net Worth Data:**
- ✅ `net_worth_snapshots` table with daily user net worth
- ✅ Real-time calculation from Plaid + crypto + manual assets
- ✅ Historical tracking (30/90/365 days)

**User Accounts:**
- ✅ `auth.users` table with authenticated users
- ✅ `user_settings` for preferences

### What We Need to Collect ❌

**From Users (via opt-in flow):**
- ❌ Age bracket selection ("22-25", "26-28", etc.)
- ❌ Opt-in consent for percentile tracking
- ❌ (Optional) Birth year for more accurate bucketing

**From External Sources (seed data):**
- ❌ Net worth distribution by age group
- ❌ Percentile breakpoints (P10, P25, P50, P75, P90, P95, P99)
- ❌ Representative US population data

---

## 2. External Data Sources Analysis

### Option A: Federal Reserve Survey of Consumer Finances (SCF) ⭐ **RECOMMENDED**

**Source:** https://www.federalreserve.gov/econres/scfindex.htm

**What It Is:**
- Triennial survey of US household finances
- Most recent: 2022 (published Sept 2023)
- Next update: 2025 (available ~2026)
- ~6,000 households surveyed
- Statistically representative of US population

**Data Available:**
- Net worth by age group (18-24, 25-29, 30-34, 35-39, 40-44, etc.)
- Percentile distributions: P10, P25, P50, P75, P90, P95, P99
- Mean and median values
- Includes negative net worth (debt)

**Example Data (Ages 25-29, 2022 SCF):**

| Percentile | Net Worth |
|------------|-----------|
| 10th       | -$8,000   |
| 25th       | $7,000    |
| 50th (median) | $39,000 |
| 75th       | $135,000  |
| 90th       | $382,000  |
| 95th       | $651,000  |
| 99th       | $1,800,000|

**Pros:**
- ✅ Most authoritative source (Federal Reserve)
- ✅ Includes negative net worth (student loans, etc.)
- ✅ Detailed percentile breakdowns
- ✅ Free and public domain
- ✅ Widely cited (builds credibility)

**Cons:**
- ⚠️ Updated only every 3 years
- ⚠️ Age brackets don't perfectly match ours
- ⚠️ Includes older demographics (40+) we may not target

**How to Access:**
1. Download Excel files: https://www.federalreserve.gov/econres/scf/dataviz/scf/table/
2. Use "Net Worth by Age" table
3. Extract percentile columns for age groups

---

### Option B: US Census Bureau Wealth Data

**Source:** https://www.census.gov/topics/income-poverty/wealth.html

**What It Is:**
- Survey of Income and Program Participation (SIPP)
- Household wealth statistics by age/demographics
- Updated quarterly/annually

**Data Available:**
- Net worth quartiles (25th, 50th, 75th)
- Less granular than SCF (no P10, P90, P95, P99)

**Pros:**
- ✅ More frequently updated than SCF
- ✅ Authoritative government source
- ✅ CSV/API available

**Cons:**
- ⚠️ Less detailed percentile breakdowns
- ⚠️ Missing high-end percentiles (P95, P99)
- ⚠️ Requires more processing

**Use Case:** Supplement SCF data for quarterly updates between SCF releases.

---

### Option C: Pew Research Center Generational Wealth

**Source:** https://www.pewresearch.org/social-trends/

**What It Is:**
- Research reports on generational wealth (Gen Z, Millennials, Gen X)
- Periodic studies with detailed analysis

**Data Available:**
- Median net worth by generation
- Age-adjusted comparisons
- Trends over time

**Pros:**
- ✅ Generation-specific (resonates with Gen Z target)
- ✅ Well-researched, credible
- ✅ Great for marketing ("Based on Pew Research")

**Cons:**
- ⚠️ Less granular (usually just median)
- ⚠️ Not available as raw data (extract from reports)
- ⚠️ Infrequent updates

**Use Case:** Marketing/PR ("Our data aligns with Pew Research showing..."), not primary seed data.

---

### Option D: Build-in-Public (No Seed Data)

**Approach:** Don't use external data. Wait until you have 500+ real users per bracket.

**Implementation:**
```
┌─────────────────────────────────────────────┐
│  Percentile Ranking - Coming Soon! 🚀      │
├─────────────────────────────────────────────┤
│                                             │
│  We need 500 users in your age bracket     │
│  to show accurate rankings.                 │
│                                             │
│  Current progress: 47 / 500 users          │
│  ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░ 9%           │
│                                             │
│  Help us reach 500 faster:                  │
│  [Invite Friends] [Share on Twitter]        │
│                                             │
│  Join the waitlist to be notified!          │
│  [Notify Me When Ready]                     │
│                                             │
└─────────────────────────────────────────────┘
```

**Pros:**
- ✅ No data integrity concerns
- ✅ Creates FOMO ("be among first 500")
- ✅ Viral mechanic (invite friends to unlock)
- ✅ Pure Guapital data from day 1

**Cons:**
- ⚠️ Feature not available at launch
- ⚠️ Slower user activation
- ⚠️ May take 6+ months to reach 500 per bracket

**Use Case:** If privacy/transparency is paramount, or if you want to build anticipation.

---

## 3. Recommended Hybrid Data Strategy

### Three-Phase Approach

**Phase 1: Launch with Seed Data (0-500 real users per bracket)**

**Data Blend:** 100% SCF seed data + 100% real users (displayed separately)

**Algorithm:**
```sql
-- Calculate percentile using ALL available data
WITH combined_data AS (
    -- Real Guapital users
    SELECT user_id, net_worth, 'real' as source
    FROM net_worth_snapshots nw
    JOIN user_demographics ud ON nw.user_id = ud.user_id
    WHERE ud.age_bracket = '26-28'
      AND ud.percentile_opt_in = true

    UNION ALL

    -- SCF seed data (treated as synthetic users)
    SELECT NULL as user_id, net_worth, 'seed' as source
    FROM percentile_seed_data
    WHERE age_bracket = '26-28'
)
SELECT
    user_id,
    net_worth,
    -- Percentile = % of all users (real + seed) with lower net worth
    (COUNT(*) FILTER (WHERE combined_data.net_worth < target_user.net_worth)::FLOAT /
     COUNT(*)::FLOAT) * 100 AS percentile
FROM combined_data target_user
GROUP BY user_id, net_worth;
```

**UI Disclosure:**
```
Your Rank: TOP 18%
Ages 26-28

Based on 47 Guapital users + Federal Reserve data
[Learn More]
```

---

**Phase 2: Blended Data (500-1000 real users per bracket)**

**Data Blend:** 70% real users + 30% SCF seed data

**Why blend?**
- Smooth transition (no sudden jump in rankings)
- Maintain accuracy while building confidence in real data
- Gradual phase-out of seed data

**Algorithm:**
```typescript
function calculatePercentile(userId: string, ageBracket: string) {
  const realUsers = getRealUsersInBracket(ageBracket);
  const realUserCount = realUsers.length;

  if (realUserCount < 500) {
    // Phase 1: Full seed data blend
    return calculateWithFullSeedData(userId, ageBracket);
  } else if (realUserCount < 1000) {
    // Phase 2: Weighted blend (70/30)
    const realPercentile = calculateFromRealUsers(userId, realUsers);
    const seedPercentile = calculateFromSeedData(userId, ageBracket);
    return (realPercentile * 0.7) + (seedPercentile * 0.3);
  } else {
    // Phase 3: Pure real data
    return calculateFromRealUsers(userId, realUsers);
  }
}
```

**UI Disclosure:**
```
Your Rank: TOP 18%
Ages 26-28

Based on 847 Guapital users (supplemented with Federal Reserve data)
```

---

**Phase 3: Pure Real Data (1000+ real users per bracket)**

**Data Blend:** 100% real Guapital users

**UI Disclosure:**
```
Your Rank: TOP 18%
Ages 26-28

Based on 1,247 Guapital users in your age group
```

**No more disclaimers!** You're now the authoritative source.

---

### Transition Thresholds

| Real Users | Seed Data Weight | Real Data Weight | Disclosure |
|------------|------------------|------------------|------------|
| 0-499      | 100%             | 100% (combined)  | "Based on X users + Federal Reserve data" |
| 500-999    | 30%              | 70%              | "Based on X users (supplemented with Fed data)" |
| 1000+      | 0%               | 100%             | "Based on X Guapital users" |

---

## 4. Technical Implementation Steps

### Week 1: Download & Process SCF Data

**Day 1-2: Download SCF 2022 Data**

1. Visit: https://www.federalreserve.gov/econres/scf/dataviz/scf/table/
2. Select "Net Worth" → "Age of Head of Household"
3. Download Excel file: `scf2022_net_worth_by_age.xlsx`

**Day 3-5: Extract & Transform Data**

Create Python script: `scripts/process-scf-data.py`

```python
import pandas as pd
import json

# Load SCF data
scf_data = pd.read_excel('scf2022_net_worth_by_age.xlsx', sheet_name='Net Worth by Age')

# Map SCF age ranges to Guapital age brackets
age_mapping = {
    '18-24': '18-21',  # Split this range
    '25-29': '22-25',  # Map to multiple brackets
    '30-34': '26-28',
    '35-39': '29-32',
    '40-44': '33-35',
    '45-49': '36-40',
    '50+': '41+'
}

# Extract percentiles: 10, 25, 50, 75, 90, 95, 99
percentiles = [10, 25, 50, 75, 90, 95, 99]

output = []

for scf_age_range, guapital_bracket in age_mapping.items():
    row = scf_data[scf_data['age_range'] == scf_age_range].iloc[0]

    for pct in percentiles:
        output.append({
            'age_bracket': guapital_bracket,
            'percentile': pct,
            'net_worth': row[f'p{pct}'],
            'source': 'SCF_2022'
        })

# Save as JSON for inspection
with open('scf_seed_data.json', 'w') as f:
    json.dump(output, f, indent=2)

# Generate SQL INSERT statements
with open('seed_data_insert.sql', 'w') as f:
    f.write("-- SCF 2022 Seed Data\n")
    f.write("INSERT INTO percentile_seed_data (age_bracket, percentile, net_worth, source) VALUES\n")

    values = []
    for item in output:
        values.append(f"('{item['age_bracket']}', {item['percentile']}, {item['net_worth']}, '{item['source']}')")

    f.write(',\n'.join(values) + ';')

print(f"Generated {len(output)} seed data points")
```

**Expected Output:**
- `scf_seed_data.json` - Human-readable data (for QA)
- `seed_data_insert.sql` - Ready to run in Supabase

---

### Week 2: Database Schema & Import

**Day 1-2: Create Schema**

Create migration: `supabase/migrations/005_percentile_seed_data.sql`

```sql
-- Percentile seed data table (external benchmarks)
CREATE TABLE percentile_seed_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    age_bracket TEXT NOT NULL,
    percentile NUMERIC(5,2) NOT NULL, -- 10, 25, 50, 75, 90, 95, 99
    net_worth NUMERIC(15,2) NOT NULL,
    source TEXT DEFAULT 'SCF_2022',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(age_bracket, percentile, source)
);

-- Index for fast lookups
CREATE INDEX idx_seed_age_percentile ON percentile_seed_data(age_bracket, percentile);

-- Add tracking field to user_demographics
ALTER TABLE user_demographics ADD COLUMN uses_seed_data BOOLEAN DEFAULT false;

-- Insert SCF 2022 data (generated from Python script)
\i seed_data_insert.sql;
```

**Day 3-4: Build Hybrid Calculation Function**

Create function: `supabase/migrations/006_percentile_hybrid_calculation.sql`

```sql
CREATE OR REPLACE FUNCTION calculate_percentile_hybrid(
    p_user_id UUID,
    p_age_bracket TEXT
) RETURNS TABLE(
    percentile NUMERIC,
    rank_position INTEGER,
    total_users INTEGER,
    uses_seed_data BOOLEAN
) AS $$
DECLARE
    real_user_count INTEGER;
    user_net_worth NUMERIC;
BEGIN
    -- Get user's current net worth
    SELECT net_worth INTO user_net_worth
    FROM net_worth_snapshots
    WHERE user_id = p_user_id
    ORDER BY snapshot_date DESC
    LIMIT 1;

    -- Count real users in bracket
    SELECT COUNT(*) INTO real_user_count
    FROM user_demographics ud
    JOIN net_worth_snapshots nw ON ud.user_id = nw.user_id
    WHERE ud.age_bracket = p_age_bracket
      AND ud.percentile_opt_in = true;

    -- Phase 1: Use seed data (< 500 users)
    IF real_user_count < 500 THEN
        -- Combine real + seed data
        RETURN QUERY
        WITH combined_data AS (
            -- Real users
            SELECT nw.user_id, nw.net_worth
            FROM net_worth_snapshots nw
            JOIN user_demographics ud ON nw.user_id = ud.user_id
            WHERE ud.age_bracket = p_age_bracket
              AND ud.percentile_opt_in = true

            UNION ALL

            -- Seed data (interpolated)
            SELECT NULL::UUID, net_worth
            FROM percentile_seed_data
            WHERE age_bracket = p_age_bracket
        )
        SELECT
            (COUNT(*) FILTER (WHERE net_worth < user_net_worth)::FLOAT /
             COUNT(*)::FLOAT * 100)::NUMERIC(5,2) AS percentile,
            ROW_NUMBER() OVER (ORDER BY net_worth DESC)::INTEGER AS rank_position,
            COUNT(*)::INTEGER AS total_users,
            true AS uses_seed_data
        FROM combined_data
        WHERE user_id = p_user_id OR user_id IS NULL;

    -- Phase 2: Blended (500-1000 users)
    ELSIF real_user_count < 1000 THEN
        -- 70% real, 30% seed (implementation omitted for brevity)
        -- Return blended percentile...

    -- Phase 3: Pure real data (1000+ users)
    ELSE
        RETURN QUERY
        WITH real_data AS (
            SELECT nw.user_id, nw.net_worth
            FROM net_worth_snapshots nw
            JOIN user_demographics ud ON nw.user_id = ud.user_id
            WHERE ud.age_bracket = p_age_bracket
              AND ud.percentile_opt_in = true
        )
        SELECT
            (COUNT(*) FILTER (WHERE net_worth < user_net_worth)::FLOAT /
             COUNT(*)::FLOAT * 100)::NUMERIC(5,2) AS percentile,
            ROW_NUMBER() OVER (ORDER BY net_worth DESC)::INTEGER AS rank_position,
            COUNT(*)::INTEGER AS total_users,
            false AS uses_seed_data
        FROM real_data
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

**Day 5-7: Testing**

```sql
-- Test with sample data
INSERT INTO user_demographics (user_id, age_bracket, percentile_opt_in)
VALUES ('test-user-1', '26-28', true);

INSERT INTO net_worth_snapshots (user_id, snapshot_date, net_worth)
VALUES ('test-user-1', CURRENT_DATE, 95000);

-- Calculate percentile
SELECT * FROM calculate_percentile_hybrid('test-user-1', '26-28');

-- Expected result:
-- percentile: ~87 (based on SCF data showing $95K is ~top 13%)
-- uses_seed_data: true
```

---

### Week 3: API Endpoints

**Create:** `src/app/api/percentile/route.ts`

```typescript
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user demographics
  const { data: demographics } = await supabase
    .from('user_demographics')
    .select('age_bracket, percentile_opt_in, uses_seed_data')
    .eq('user_id', user.id)
    .single();

  if (!demographics?.percentile_opt_in) {
    return NextResponse.json({
      opted_in: false,
      message: 'User has not opted into percentile tracking'
    });
  }

  // Calculate percentile using hybrid function
  const { data: percentileData } = await supabase
    .rpc('calculate_percentile_hybrid', {
      p_user_id: user.id,
      p_age_bracket: demographics.age_bracket
    });

  // Get milestones
  const { data: milestones } = await supabase
    .from('percentile_milestones')
    .select('*')
    .eq('user_id', user.id);

  return NextResponse.json({
    user_id: user.id,
    opted_in: true,
    age_bracket: demographics.age_bracket,
    current_percentile: percentileData.percentile,
    rank_position: percentileData.rank_position,
    total_users: percentileData.total_users,
    uses_seed_data: percentileData.uses_seed_data,
    milestones: {
      achieved: milestones.filter(m => m.achieved_at).map(m => m.milestone_type),
      // Calculate next milestone...
    }
  });
}
```

---

## 5. Data Transformation Details

### Age Bracket Mapping Challenges

**Problem:** SCF uses different age ranges than Guapital.

**SCF Ranges:**
- 18-24 (7 years)
- 25-29 (5 years)
- 30-34 (5 years)
- 35-39 (5 years)
- 40-44 (5 years)

**Guapital Ranges:**
- 18-21 (4 years)
- 22-25 (4 years)
- 26-28 (3 years)
- 29-32 (4 years)
- 33-35 (3 years)
- 36-40 (5 years)
- 41+ (unbounded)

**Solution:** Linear interpolation for overlapping ranges.

**Example:**
```python
# SCF "25-29" data needs to split into "22-25", "26-28", "29-32"
scf_p50_25_29 = 39000  # Median net worth for ages 25-29

# Interpolate for Guapital brackets
guapital_p50_22_25 = interpolate(scf_p50_18_24, scf_p50_25_29, weight=0.7)  # ~$28,000
guapital_p50_26_28 = scf_p50_25_29  # $39,000 (direct match)
guapital_p50_29_32 = interpolate(scf_p50_25_29, scf_p50_30_34, weight=0.3)  # ~$52,000
```

**Full Interpolation Script:** See `scripts/interpolate-age-brackets.py`

---

### Percentile Interpolation

**Problem:** SCF only provides P10, P25, P50, P75, P90, P95, P99. What about P12, P18, P87?

**Solution:** Cubic spline interpolation.

```python
from scipy.interpolate import CubicSpline

# SCF data points
percentiles = [10, 25, 50, 75, 90, 95, 99]
net_worths = [-8000, 7000, 39000, 135000, 382000, 651000, 1800000]

# Create interpolation function
cs = CubicSpline(percentiles, net_worths)

# Interpolate any percentile
net_worth_at_p87 = cs(87)  # ~$320,000
```

**Use Case:** When calculating "how much net worth needed to reach next percentile," we need smooth interpolation between SCF data points.

---

## 6. Database Schema Complete Reference

```sql
-- Seed data (external benchmarks)
CREATE TABLE percentile_seed_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    age_bracket TEXT NOT NULL,
    percentile NUMERIC(5,2) NOT NULL,
    net_worth NUMERIC(15,2) NOT NULL,
    source TEXT DEFAULT 'SCF_2022',
    data_year INTEGER DEFAULT 2022,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(age_bracket, percentile, source, data_year)
);

-- User demographics (already exists, add tracking field)
ALTER TABLE user_demographics
ADD COLUMN IF NOT EXISTS uses_seed_data BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_percentile_calculation TIMESTAMP;

-- Percentile calculation cache (performance optimization)
CREATE TABLE percentile_calculation_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    age_bracket TEXT NOT NULL,
    calculated_at TIMESTAMP NOT NULL,
    percentile NUMERIC(5,2),
    rank_position INTEGER,
    total_users INTEGER,
    used_seed_data BOOLEAN,
    expires_at TIMESTAMP, -- Cache for 24 hours
    UNIQUE(user_id, age_bracket, calculated_at)
);

-- Index for cache lookups
CREATE INDEX idx_percentile_cache_user
ON percentile_calculation_cache(user_id, expires_at)
WHERE expires_at > NOW();
```

---

## 7. Transparency & User Communication

### UI Disclosure Examples

**Phase 1 (0-500 users):**
```
┌─────────────────────────────────────────────┐
│  Your Wealth Rank 🏆                        │
├─────────────────────────────────────────────┤
│                                             │
│        TOP 12%                              │
│     Ages 26-28                              │
│                                             │
│  $127,450 net worth                         │
│                                             │
│  ⓘ Based on 47 Guapital users + Federal    │
│    Reserve Survey of Consumer Finances      │
│    (2022). Learn more ↗                     │
│                                             │
└─────────────────────────────────────────────┘
```

**Phase 2 (500-1000 users):**
```
│  ⓘ Based on 847 Guapital users in your     │
│    age group (supplemented with Federal     │
│    Reserve data). Learn more ↗              │
```

**Phase 3 (1000+ users):**
```
│  Based on 1,247 Guapital users             │
│  Ages 26-28                                 │
```

### "Learn More" Modal

```
┌─────────────────────────────────────────────┐
│  How We Calculate Your Rank                │
├─────────────────────────────────────────────┤
│                                             │
│  Your percentile rank is based on:          │
│                                             │
│  ✓ 47 real Guapital users in your age     │
│    group (ages 26-28)                       │
│                                             │
│  ✓ Federal Reserve Survey of Consumer      │
│    Finances (SCF) 2022 data                 │
│                                             │
│  Why blend data?                            │
│  • We need 500+ users per age bracket      │
│    for accurate rankings                    │
│  • SCF is the gold standard (6,000+        │
│    households surveyed)                     │
│  • As more users join, we'll transition    │
│    to 100% real Guapital data               │
│                                             │
│  Your privacy:                              │
│  • Your exact net worth is NEVER shared     │
│  • Rankings are 100% anonymous              │
│  • Opt-out anytime in Settings              │
│                                             │
│  [Close]                                    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 8. Alternative: Build-in-Public Strategy

If you decide NOT to use seed data and want 100% transparency:

### Waitlist Approach

**Onboarding Flow:**
```
┌─────────────────────────────────────────────┐
│  See How You Rank! 🏆                       │
├─────────────────────────────────────────────┤
│                                             │
│  Compare your net worth to peers your age  │
│                                             │
│  🚀 Coming Soon                             │
│                                             │
│  We need 500 users in each age bracket     │
│  to show accurate rankings.                 │
│                                             │
│  Ages 26-28: 47 / 500 users ▓░░░░ 9%       │
│                                             │
│  Help us unlock this feature faster:        │
│                                             │
│  [Invite Friends] [Share on Twitter]        │
│                                             │
│  Or join the waitlist:                      │
│  [Notify Me When Ready]                     │
│                                             │
└─────────────────────────────────────────────┘
```

### Gamification

**Milestone Emails:**
```
Subject: 🎉 Your age bracket just hit 100 users!

Hi [Name],

Great news! We just hit 100 users ages 26-28.

Only 400 more to unlock percentile rankings.

Share Guapital with friends to speed things up:
[Share Link]

- The Guapital Team
```

**Social Proof:**
```
"847 wealth builders have joined Guapital.
Help us reach 500 in YOUR age bracket!"

[See Progress by Age Group]
```

### Pros of Build-in-Public
- 100% authentic data
- Creates urgency/FOMO
- Viral mechanic (invite to unlock)
- No data integrity questions

### Cons of Build-in-Public
- Feature delayed 3-6 months
- Early users get less value
- May lose users to competitors

---

## 9. Data Quality & Validation

### Sanity Checks for Seed Data

**Test 1: Monotonicity**
```sql
-- Ensure percentiles increase monotonically
SELECT age_bracket,
       percentile,
       net_worth,
       LAG(net_worth) OVER (PARTITION BY age_bracket ORDER BY percentile) AS prev_net_worth
FROM percentile_seed_data
WHERE net_worth <= prev_net_worth; -- Should return 0 rows
```

**Test 2: Negative Net Worth Handling**
```sql
-- Ensure P10 handles negative net worth (student loans)
SELECT age_bracket, percentile, net_worth
FROM percentile_seed_data
WHERE percentile = 10
  AND age_bracket IN ('18-21', '22-25')
  AND net_worth >= 0; -- Should return 0 rows (expect negative)
```

**Test 3: Outlier Detection**
```sql
-- Flag unrealistic values
SELECT *
FROM percentile_seed_data
WHERE net_worth > 10000000  -- P99 shouldn't exceed $10M for young ages
   OR (percentile = 50 AND net_worth < 0); -- Median shouldn't be negative
```

### Real vs Seed Comparison

**After 500 users, compare distributions:**

```sql
-- Compare real Guapital data to SCF seed data
WITH real_percentiles AS (
    SELECT
        '26-28' as age_bracket,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY net_worth) AS p50_real
    FROM net_worth_snapshots nw
    JOIN user_demographics ud ON nw.user_id = ud.user_id
    WHERE ud.age_bracket = '26-28'
),
seed_percentiles AS (
    SELECT age_bracket, net_worth AS p50_seed
    FROM percentile_seed_data
    WHERE age_bracket = '26-28' AND percentile = 50
)
SELECT
    r.age_bracket,
    r.p50_real,
    s.p50_seed,
    ABS(r.p50_real - s.p50_seed) / s.p50_seed * 100 AS percent_diff
FROM real_percentiles r
JOIN seed_percentiles s ON r.age_bracket = s.age_bracket;

-- Flag if difference > 50%
```

**Expected:** Guapital users (tech-savvy, financially engaged) may skew higher than general population. That's OK and expected.

---

## 10. Implementation Checklist

### Pre-Implementation
- [ ] Download SCF 2022 Excel data
- [ ] Run Python transformation script
- [ ] QA: Inspect `scf_seed_data.json` for errors
- [ ] Run sanity checks on generated SQL

### Database Setup
- [ ] Create `percentile_seed_data` table
- [ ] Import seed data via SQL script
- [ ] Add `uses_seed_data` field to `user_demographics`
- [ ] Create hybrid calculation function
- [ ] Test function with sample users

### API Development
- [ ] Build `/api/percentile` endpoint
- [ ] Build `/api/percentile/opt-in` endpoint
- [ ] Test API responses with Postman/curl
- [ ] Handle edge cases (no data, new user, etc.)

### Frontend Development
- [ ] Opt-in modal with age bracket selection
- [ ] Dashboard percentile card
- [ ] "Learn More" disclosure modal
- [ ] Settings page: Opt-out option

### Testing
- [ ] Unit tests for calculation logic
- [ ] Integration tests for API endpoints
- [ ] QA seed data accuracy (compare to published SCF tables)
- [ ] Load testing (1000+ concurrent calculations)

### Privacy & Legal
- [ ] Update privacy policy (percentile tracking)
- [ ] Add opt-in consent flow
- [ ] Ensure RLS policies on all percentile tables
- [ ] Document data retention policy

### Launch
- [ ] Deploy database migration to production
- [ ] Schedule cron job for daily calculations
- [ ] Monitor error logs for first 48 hours
- [ ] Track opt-in rate (target: 70% within week 1)

### Post-Launch (Monthly)
- [ ] Compare real user data to seed data (detect drift)
- [ ] Update seed data when SCF 2025 releases (~2026)
- [ ] Transition age brackets from Phase 1 → 2 → 3
- [ ] Remove seed data from brackets with 1000+ users

---

## 11. Timeline Summary

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| Week 1 | Download & process SCF data | `scf_seed_data.json`, `seed_data_insert.sql` |
| Week 2 | Database schema & import | Migration files, seed data loaded |
| Week 3 | Hybrid calculation logic | SQL functions, API endpoints |
| Week 4 | Frontend UI | Opt-in flow, dashboard card, disclosure modals |
| Week 5 | Testing & QA | All tests passing, edge cases handled |
| Week 6 | Launch | Feature live in production |

**Total Time:** 6 weeks (can compress to 3-4 weeks if prioritized)

---

## 12. Success Metrics

**Week 1-2 (Seed Data Quality):**
- [ ] 0 errors in data transformation
- [ ] Percentiles match published SCF tables (within 2%)
- [ ] All age brackets have full P10-P99 coverage

**Week 3-4 (Calculation Accuracy):**
- [ ] Hybrid function returns percentiles within expected range
- [ ] Performance: Calculation completes in < 200ms
- [ ] Cache hit rate > 90% (reduce DB load)

**Week 5-6 (User Adoption):**
- [ ] Opt-in rate: 70%+ of users within 7 days
- [ ] Bounce rate on opt-in modal: < 20%
- [ ] User feedback: "Learn More" modal viewed by 30%+ (shows interest)

**Month 1-3 (Transition to Real Data):**
- [ ] At least 2 age brackets reach 500+ users (Phase 2)
- [ ] Real data percentiles within 20% of seed data (shows accuracy)
- [ ] 0 privacy complaints/concerns

---

## 13. Risk Mitigation

### Risk: Seed Data Becomes Stale
**Mitigation:**
- Update seed data when SCF 2025 releases (~2026)
- Cross-reference with Census Bureau quarterly updates
- Phase out seed data quickly (prioritize user growth)

### Risk: Guapital Users Skew Higher Than General Population
**Expected:** Tech-savvy, financially engaged users will have higher net worth.

**Mitigation:**
- Acknowledge in "Learn More": "Guapital users tend to be above-average wealth builders"
- Use both Guapital percentile AND national percentile (dual display)
- Market as "Compare to other wealth builders" not "general population"

### Risk: Not Enough Users in Older Brackets (41+)
**Mitigation:**
- Combine into single "41+" bracket
- Use seed data longer for this bracket
- Target marketing to younger demographics (primary ICP)

---

## Conclusion

**Recommended Approach:** Hybrid strategy with Federal Reserve SCF 2022 data.

**Why?**
- ✅ Launch percentile feature Day 1 (no waiting for users)
- ✅ Authoritative, credible data source (Federal Reserve)
- ✅ Smooth transition to 100% real data as user base grows
- ✅ Transparent disclosure builds trust

**Next Steps:**
1. Download SCF 2022 data (Week 1)
2. Run transformation scripts (Week 1)
3. Load seed data into database (Week 2)
4. Build hybrid calculation function (Week 2-3)
5. Launch with clear disclosure (Week 6)

**Timeline:** 6 weeks to launch-ready percentile ranking feature.

**Start here:** Download SCF data from https://www.federalreserve.gov/econres/scf/dataviz/scf/table/

---

**Questions? See:** `PERCENTILE_RANKING_SPEC.md` for UI/UX details.
