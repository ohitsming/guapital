# Percentile Ranking Feature Spec
## The Killer Feature That Makes Guapital a MUST-USE

Last Updated: January 2025

---

## Problem Statement

**Current state:** Guapital is a cheaper but feature-incomplete Monarch clone. No compelling reason for Monarch users to switch.

**Solution:** Build the ONE feature no competitor has - **gamified net worth percentile rankings**.

**Impact:** Gives users a reason to switch, creates viral growth loop, drives daily engagement.

---

## Feature Overview

### What It Is

An **anonymous, opt-in ranking system** that shows users how their net worth compares to peers in their age bracket.

**Key elements:**
- Percentile rank (e.g., "Top 15% for ages 25-28")
- Visual chart showing distribution
- Milestone tracker (Top 50% → Top 25% → Top 10% → Top 1%)
- Shareable achievements ("I hit top 10%!")
- Progress insights ("You're climbing faster than 78% of peers")

### What Makes It Viral

**Social Proof Loop:**
1. User hits milestone (e.g., Top 15%)
2. App prompts: "Share your achievement!"
3. User posts on Twitter/Instagram: "Just hit top 15% net worth for my age 🚀 via @Guapital"
4. Friends see post, want to compare their own rank
5. Friends sign up → See their rank → Share their milestone
6. **Repeat**

**This is your growth engine.**

---

## User Stories

### Story 1: Sarah, 26, Software Engineer ($95K net worth)

**Use case:** Wants to know if she's "on track" financially

**Experience:**
1. Opens Guapital after linking accounts
2. Sees: "Your Rank: **TOP 18%** among 24-28 year olds"
3. Chart shows: Most peers have $20K-60K, she's at $95K
4. Next milestone: "Top 15% at $105K (need $10K more)"
5. Shares on Instagram: "Officially in top 18% net worth for my age! 💰"
6. **Result:** Feels motivated, tells friends, checks daily

### Story 2: Marcus, 30, Entrepreneur ($180K net worth)

**Use case:** Competitive, wants to "win" at wealth-building

**Experience:**
1. Sees rank: "TOP 8% among 29-32 year olds"
2. Unlocks achievement badge: "Top 10% Club 🏆"
3. Goal: Hit Top 5% (needs $220K, currently $180K)
4. App shows: "At your current rate, you'll hit Top 5% in 11 months"
5. Tweets: "Just cracked top 8% net worth. Top 5% by end of year 🎯"
6. **Result:** Daily engagement, tells startup friends, competitive drive

### Story 3: Jen, 24, Just Graduated ($-15K net worth, student loans)

**Use case:** Feels behind, needs encouragement

**Experience:**
1. Sees rank: "TOP 45% among 22-25 year olds"
2. Realizes: "Wait, I'm above average even with loans?"
3. Milestone tracker: "Next: Top 40% at $5K (pay off $20K in loans)"
4. App shows: "You improved 5 percentile points this quarter!"
5. Shares: "Paying off student loans is working! From bottom 50% to top 45% 📈"
6. **Result:** Hope, motivation, sticks with the app

---

## Technical Specification

### Database Schema

**New table: `user_demographics`**

```sql
CREATE TABLE user_demographics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    birth_year INTEGER,
    age_bracket TEXT, -- "18-21", "22-25", "26-28", "29-32", "33-35", "36-40", "41+"
    percentile_opt_in BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS policy
ALTER TABLE user_demographics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own demographics"
    ON user_demographics FOR SELECT
    USING (auth.uid() = user_id);
```

**New table: `percentile_snapshots`**

```sql
CREATE TABLE percentile_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    snapshot_date DATE NOT NULL,
    age_bracket TEXT NOT NULL,
    net_worth NUMERIC(15, 2) NOT NULL,
    percentile NUMERIC(5, 2), -- e.g., 87.25 for top 12.75%
    rank_position INTEGER, -- actual rank (e.g., 127 out of 1000)
    total_users_in_bracket INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

-- Index for fast lookups
CREATE INDEX idx_percentile_age_bracket ON percentile_snapshots(age_bracket, net_worth DESC);
CREATE INDEX idx_percentile_user_date ON percentile_snapshots(user_id, snapshot_date DESC);

-- RLS policy
ALTER TABLE percentile_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own percentile history"
    ON percentile_snapshots FOR SELECT
    USING (auth.uid() = user_id);
```

**New table: `percentile_milestones`**

```sql
CREATE TABLE percentile_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    milestone_type TEXT NOT NULL, -- "top_50", "top_25", "top_10", "top_5", "top_1"
    achieved_at TIMESTAMP,
    net_worth_at_achievement NUMERIC(15, 2),
    shared_publicly BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, milestone_type)
);

-- RLS policy
ALTER TABLE percentile_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own milestones"
    ON percentile_milestones FOR SELECT
    USING (auth.uid() = user_id);
```

---

### Algorithm: Calculating Percentiles

**Daily cron job (runs at 1am UTC):**

```sql
-- Calculate percentiles for each age bracket
CREATE OR REPLACE FUNCTION calculate_daily_percentiles()
RETURNS void AS $$
DECLARE
    bracket TEXT;
    brackets TEXT[] := ARRAY['18-21', '22-25', '26-28', '29-32', '33-35', '36-40', '41+'];
BEGIN
    FOREACH bracket IN ARRAY brackets LOOP
        -- Insert percentile snapshots for all opted-in users in this bracket
        INSERT INTO percentile_snapshots (
            user_id,
            snapshot_date,
            age_bracket,
            net_worth,
            percentile,
            rank_position,
            total_users_in_bracket
        )
        SELECT
            u.id,
            CURRENT_DATE,
            bracket,
            nw.net_worth,
            -- Calculate percentile (% of users with lower net worth)
            (COUNT(*) FILTER (WHERE nw2.net_worth < nw.net_worth)::FLOAT /
             NULLIF(COUNT(*)::FLOAT, 0)) * 100 AS percentile,
            -- Calculate rank position
            ROW_NUMBER() OVER (ORDER BY nw.net_worth DESC) AS rank_position,
            -- Total users in bracket
            COUNT(*) OVER () AS total_users_in_bracket
        FROM
            users u
            JOIN user_demographics ud ON u.id = ud.user_id
            JOIN (
                -- Get latest net worth for each user
                SELECT DISTINCT ON (user_id)
                    user_id,
                    net_worth
                FROM net_worth_snapshots
                ORDER BY user_id, snapshot_date DESC
            ) nw ON u.id = nw.user_id
            CROSS JOIN (
                SELECT user_id, net_worth
                FROM (
                    SELECT DISTINCT ON (user_id)
                        user_id,
                        net_worth
                    FROM net_worth_snapshots
                    ORDER BY user_id, snapshot_date DESC
                ) x
                JOIN user_demographics ud2 ON x.user_id = ud2.user_id
                WHERE ud2.age_bracket = bracket
                  AND ud2.percentile_opt_in = true
            ) nw2
        WHERE
            ud.age_bracket = bracket
            AND ud.percentile_opt_in = true
        GROUP BY u.id, nw.net_worth, bracket
        ON CONFLICT (user_id, snapshot_date) DO UPDATE
            SET percentile = EXCLUDED.percentile,
                rank_position = EXCLUDED.rank_position,
                total_users_in_bracket = EXCLUDED.total_users_in_bracket;

        -- Check for milestone achievements
        INSERT INTO percentile_milestones (user_id, milestone_type, achieved_at, net_worth_at_achievement)
        SELECT
            ps.user_id,
            CASE
                WHEN ps.percentile >= 99 THEN 'top_1'
                WHEN ps.percentile >= 95 THEN 'top_5'
                WHEN ps.percentile >= 90 THEN 'top_10'
                WHEN ps.percentile >= 75 THEN 'top_25'
                WHEN ps.percentile >= 50 THEN 'top_50'
            END AS milestone_type,
            NOW(),
            ps.net_worth
        FROM percentile_snapshots ps
        WHERE ps.snapshot_date = CURRENT_DATE
          AND ps.age_bracket = bracket
          AND NOT EXISTS (
              SELECT 1 FROM percentile_milestones pm
              WHERE pm.user_id = ps.user_id
                AND pm.milestone_type = CASE
                    WHEN ps.percentile >= 99 THEN 'top_1'
                    WHEN ps.percentile >= 95 THEN 'top_5'
                    WHEN ps.percentile >= 90 THEN 'top_10'
                    WHEN ps.percentile >= 75 THEN 'top_25'
                    WHEN ps.percentile >= 50 THEN 'top_50'
                END
          )
        ON CONFLICT (user_id, milestone_type) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily (add to Supabase cron)
SELECT cron.schedule(
    'calculate-percentiles',
    '0 1 * * *', -- 1am UTC daily
    $$ SELECT calculate_daily_percentiles(); $$
);
```

---

### API Endpoints

#### **GET /api/percentile**

**Purpose:** Get user's current percentile rank

**Response:**
```json
{
  "user_id": "abc-123",
  "opted_in": true,
  "age_bracket": "26-28",
  "current_percentile": 87.5,
  "rank_position": 127,
  "total_users": 1024,
  "net_worth": 95000,
  "last_updated": "2025-01-20",
  "milestones": {
    "achieved": ["top_50", "top_25"],
    "next": {
      "type": "top_10",
      "required_net_worth": 185000,
      "gap": 90000,
      "estimated_months": 18
    }
  },
  "insights": {
    "percentile_change_30d": 2.5,
    "rank_change_30d": -15,
    "net_worth_growth_rate": 0.08
  }
}
```

#### **POST /api/percentile/opt-in**

**Purpose:** Opt user into percentile tracking

**Request:**
```json
{
  "birth_year": 1998,
  "age_bracket": "26-28"
}
```

**Response:**
```json
{
  "success": true,
  "message": "You're now opted in! Your rank will be calculated tonight."
}
```

#### **GET /api/percentile/distribution**

**Purpose:** Get anonymous distribution data for age bracket

**Response:**
```json
{
  "age_bracket": "26-28",
  "total_users": 1024,
  "distribution": [
    { "percentile": 0, "min_net_worth": -50000 },
    { "percentile": 10, "min_net_worth": 2000 },
    { "percentile": 25, "min_net_worth": 15000 },
    { "percentile": 50, "min_net_worth": 45000 },
    { "percentile": 75, "min_net_worth": 85000 },
    { "percentile": 90, "min_net_worth": 185000 },
    { "percentile": 95, "min_net_worth": 320000 },
    { "percentile": 99, "min_net_worth": 850000 }
  ]
}
```

#### **POST /api/percentile/share**

**Purpose:** Generate shareable image/link for milestone

**Request:**
```json
{
  "milestone_type": "top_10",
  "platform": "twitter" // or "instagram", "linkedin"
}
```

**Response:**
```json
{
  "share_url": "https://guapital.com/share/abc123",
  "image_url": "https://guapital.com/og/milestone-top10-abc123.png",
  "suggested_text": "Just hit top 10% net worth for my age! 🚀 Track your progress with @Guapital"
}
```

---

### UI Components

#### **1. Percentile Opt-In Flow**

**Location:** After first account sync

```
┌─────────────────────────────────────────────┐
│  See How You Rank! 📊                       │
├─────────────────────────────────────────────┤
│                                             │
│  Compare your net worth to peers your age  │
│                                             │
│  ✓ 100% anonymous                          │
│  ✓ Opt-in only                             │
│  ✓ See your percentile rank                │
│  ✓ Track progress over time                │
│                                             │
│  What's your age?                           │
│  ┌─────────────────────────┐               │
│  │ [Dropdown: 18-21, 22-25, etc.]          │
│  └─────────────────────────┘               │
│                                             │
│  [Show Me My Rank]   [Maybe Later]         │
│                                             │
└─────────────────────────────────────────────┘
```

#### **2. Dashboard Percentile Card**

```
┌─────────────────────────────────────────────┐
│  Your Wealth Rank 🏆                        │
├─────────────────────────────────────────────┤
│                                             │
│        TOP 12%                              │
│     Ages 26-28                              │
│                                             │
│  $127,450 net worth                         │
│  ━━━━━━━━━●━━━  Rank #127 of 1,024         │
│  $0        $250K         $500K              │
│                                             │
│  ▲ Up 2 percentile points this month        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                             │
│  Next Milestone: TOP 10% 🎯                 │
│  Need: $57,550 more                         │
│  ETA: ~18 months at current rate            │
│                                             │
│  [Share Achievement]  [View Details]        │
│                                             │
└─────────────────────────────────────────────┘
```

#### **3. Detailed Percentile Page**

```
┌─────────────────────────────────────────────┐
│  Percentile Ranking - Ages 26-28            │
├─────────────────────────────────────────────┤
│                                             │
│  Current Rank: TOP 12% 📊                   │
│  Your net worth: $127,450                   │
│  Rank position: #127 out of 1,024 users     │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │     Distribution Chart (Bell Curve)   │ │
│  │                  ●                     │ │
│  │              ┌───┴───┐                │ │
│  │         ┌────┤       ├────┐           │ │
│  │    ┌────┤    │       │    ├────┐      │ │
│  │────┤    │    │       │    │    ├──────│ │
│  │    0   25   50   75  90  95  99       │ │
│  │                  ↑ You                 │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Milestones 🏆                              │
│  ✅ Top 50% - $45,000 (8 months ago)        │
│  ✅ Top 25% - $85,000 (2 months ago)        │
│  🔒 Top 10% - $185,000 (need $57,550)       │
│  🔒 Top 5% - $320,000                       │
│  🔒 Top 1% - $850,000                       │
│                                             │
│  Progress Insights 📈                       │
│  • Up 5 percentile points this quarter      │
│  • Climbing faster than 78% of peers        │
│  • On track to hit Top 10% in 18 months     │
│                                             │
│  [Share on Twitter] [Share on Instagram]    │
│                                             │
└─────────────────────────────────────────────┘
```

#### **4. Milestone Achievement Modal**

**Triggered when user crosses milestone**

```
┌─────────────────────────────────────────────┐
│              🎉 MILESTONE UNLOCKED! 🎉      │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│              ┌─────────────┐                │
│              │     🏆      │                │
│              │   TOP 10%   │                │
│              │ Ages 26-28  │                │
│              └─────────────┘                │
│                                             │
│  You're now in the top 10% of wealth       │
│  builders your age!                         │
│                                             │
│  Net Worth: $185,250                        │
│  Rank: #102 out of 1,024                    │
│                                             │
│  Share your achievement:                    │
│                                             │
│  [📱 Share on Instagram]                    │
│  [🐦 Share on Twitter]                      │
│  [💼 Share on LinkedIn]                     │
│  [Maybe Later]                              │
│                                             │
└─────────────────────────────────────────────┘
```

---

### Social Sharing Templates

#### **Twitter/X Template**

```
Just hit top [X]% net worth for ages [age bracket]! 🚀

Building wealth one milestone at a time.

Track your progress: https://guapital.com

#WealthBuilding #FinancialFreedom #NetWorth
```

**Generated OG Image:**
- Dark background with gold accents
- "TOP 10%" in large text
- "Ages 26-28" subtitle
- Guapital logo
- Clean, shareable design

#### **Instagram Story Template**

- Square (1080x1080) or story (1080x1920) format
- Gradient background (teal to gold)
- Trophy icon
- "I'm in the TOP 12% for my age!" text
- "@guapital" tag
- "Swipe up to track your net worth" CTA

---

## Privacy & Ethical Considerations

### What Data Is Shared

**Public (aggregated):**
- Number of users per age bracket
- Distribution percentiles (e.g., "50th percentile = $45K")
- No individual user data

**Private (user-only):**
- Your exact net worth
- Your exact rank
- Your progress over time

**Never shared:**
- Names attached to rankings
- Individual user net worth (only aggregated)
- Transaction details
- Account details

### Opt-In Flow

**Requirements:**
- ✅ Must explicitly opt-in (not default)
- ✅ Can opt-out anytime
- ✅ Clear explanation of what's shared (nothing individual)
- ✅ Age verification (birth year only, not full DOB)

### Age Brackets (Not Exact Age)

**Why brackets:**
- Protects privacy (can't identify individuals)
- Creates larger cohorts (more accurate percentiles)
- Reduces gaming/manipulation

**Brackets:**
- 18-21 (college age)
- 22-25 (early career)
- 26-28 (mid-twenties)
- 29-32 (late twenties/early thirties)
- 33-35 (mid-thirties)
- 36-40 (late thirties)
- 41+ (all above 40)

---

## Go-to-Market Strategy

### Launch Sequence

**Week 1-2: Build MVP**
- Database schema
- Percentile calculation algorithm
- Basic UI (opt-in, dashboard card)

**Week 3: Private Beta**
- Launch to 50-100 beta users
- Test algorithm accuracy
- Gather feedback on UX
- Iterate on design

**Week 4: Public Launch**
- Announce on Twitter/X
- Product Hunt launch
- Email existing users
- Run ads targeting Monarch users

### Marketing Angle

**Homepage hero:**
> "See How You Rank. Build Wealth Faster.
>
> Compare your net worth to peers your age. Track your progress. Hit milestones. Share your wins.
>
> [Sign Up Free] [See Sample Ranking]"

**Social proof:**
- "Sarah hit top 10% in 18 months"
- "Join 5,000+ wealth builders tracking their rank"
- "The only app that shows your financial standing"

### Viral Mechanics

**Built-in sharing:**
1. When user hits milestone → Modal: "Share your achievement!"
2. Pre-filled social posts with generated image
3. Link back to Guapital sign-up page
4. Friends see → "I want to know MY rank" → Sign up

**Incentives:**
- Unlock "share" feature only after hitting milestone (exclusivity)
- Leaderboard for "fastest climbers" (optional, separate opt-in)
- Referral bonus: "Invite 3 friends, unlock advanced insights"

---

## Success Metrics

### KPIs to Track

**Adoption:**
- % of users who opt-in to percentile tracking
- Target: 70% within first week of signup

**Engagement:**
- Daily active users checking rank
- Target: 40% DAU/MAU (vs 15% without feature)

**Virality:**
- % of users who share milestone
- Target: 25% share after hitting Top 25/10/5/1
- Viral coefficient: Each share brings 1.5 new signups

**Retention:**
- 30-day retention for users with percentile vs without
- Target: 65% vs 40%

**Growth:**
- Organic signups from shared links
- Target: 30% of new signups from social shares

---

## Technical Implementation Timeline

### Week 1: Backend & Algorithm

**Days 1-2: Database**
- [ ] Create schema (user_demographics, percentile_snapshots, milestones)
- [ ] Set up RLS policies
- [ ] Create indexes

**Days 3-5: Algorithm**
- [ ] Build percentile calculation function
- [ ] Set up daily cron job
- [ ] Test with synthetic data (1,000 fake users)

**Days 6-7: API**
- [ ] `/api/percentile` endpoint
- [ ] `/api/percentile/opt-in` endpoint
- [ ] `/api/percentile/distribution` endpoint

### Week 2: Frontend UI

**Days 1-2: Opt-In Flow**
- [ ] Modal after first account sync
- [ ] Age bracket selection
- [ ] Privacy explanation

**Days 3-4: Dashboard Card**
- [ ] Percentile display
- [ ] Progress bar
- [ ] Next milestone preview

**Days 5-7: Detailed Page**
- [ ] Full distribution chart
- [ ] Milestone tracker
- [ ] Historical progress graph

### Week 3: Polish & Sharing

**Days 1-2: Milestone Achievements**
- [ ] Achievement modal on milestone hit
- [ ] Badge system

**Days 3-5: Social Sharing**
- [ ] OG image generation (auto-generated PNG)
- [ ] Share templates (Twitter, Instagram, LinkedIn)
- [ ] `/api/percentile/share` endpoint

**Days 6-7: Testing**
- [ ] QA all flows
- [ ] Load testing (1,000+ concurrent users)
- [ ] Privacy audit

---

## Risks & Mitigation

### Risk 1: Not Enough Users for Accurate Percentiles

**Problem:** With only 100 users in an age bracket, percentiles are meaningless.

**Mitigation:**
- Seed with synthetic data (anonymized Census Bureau data)
- Show "Estimated rank based on X users" disclaimer
- Don't show percentiles until 500+ users in bracket

### Risk 2: Users Game the System

**Problem:** Users inflate net worth to look better.

**Mitigation:**
- All data is private (no public leaderboard with names)
- Percentile only visible to user (can't compare with friends directly)
- Focus on personal progress, not competition

### Risk 3: Negative Psychological Impact

**Problem:** Users in bottom 50% feel discouraged.

**Mitigation:**
- Emphasize progress over absolute rank
- Show "You moved up 5 percentile points!" (positive framing)
- Provide next achievable milestone (always within reach)
- Offer opt-out anytime

### Risk 4: Privacy Concerns

**Problem:** Users worry about data being sold/leaked.

**Mitigation:**
- Make opt-in explicit
- Clear privacy policy: "We never sell data"
- Show exactly what's shared (aggregated only)
- Allow export/deletion of all data

---

## Launch Checklist

**Pre-Launch:**
- [ ] Database schema deployed to production
- [ ] Cron job scheduled (dry run first)
- [ ] API endpoints tested
- [ ] UI flows tested on mobile + desktop
- [ ] Privacy policy updated
- [ ] Legal review (if needed)
- [ ] Social sharing working (OG images generate)

**Launch Day:**
- [ ] Announce on Twitter/X with demo video
- [ ] Email existing users: "New feature: See your rank!"
- [ ] Post on Reddit (r/PersonalFinance, r/Fire)
- [ ] Submit to Product Hunt
- [ ] Monitor for bugs/errors

**Post-Launch (Week 1):**
- [ ] Track opt-in rate
- [ ] Monitor sharing activity
- [ ] Gather user feedback
- [ ] Iterate on UX based on data

---

## Expected Outcomes (3 Months)

**With percentile ranking:**
- **Opt-in rate:** 70% of users
- **DAU/MAU:** 40% (vs 15% without)
- **30-day retention:** 65% (vs 40% without)
- **Viral coefficient:** 1.3x (each user brings 1.3 new users)
- **Social shares:** 1,000+ milestone shares
- **Organic signups:** 30% of new users from shares

**This feature becomes your growth engine.** 🚀

---

## Conclusion

**Percentile ranking is THE killer feature** that:
- ✅ Differentiates you from Monarch/YNAB/Copilot
- ✅ Creates viral growth loop (shareable milestones)
- ✅ Drives daily engagement (gamification)
- ✅ Answers your question: "Why switch to Guapital?"

**Build this in the next 2-3 weeks. It's your competitive moat.**

Without it, you're just a cheaper Monarch. With it, you're a category-defining product.

**Start coding.** 💻
