# Percentile Ranking - Quick Deployment Guide

**IMPORTANT:** Follow these steps IN ORDER to deploy the percentile ranking feature to production.

---

## Step 1: Database Migration

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/005_percentile_ranking.sql`
5. Paste into the SQL editor
6. Click **Run** (this may take 10-15 seconds due to seed data insertion)
7. Verify success: You should see "PERCENTILE RANKING MIGRATION COMPLETED" in the results

### Option B: Via Supabase CLI

```bash
# From project root
supabase db push
```

---

## Step 2: Enable pg_cron Extension

1. In Supabase Dashboard → **Database** → **Extensions**
2. Search for `pg_cron`
3. Click **Enable**
4. Wait for confirmation

---

## Step 3: Verify Cron Job Scheduled

Run this query in SQL Editor:

```sql
-- Check if cron job is scheduled
SELECT * FROM cron.job WHERE jobname = 'calculate-daily-percentiles';
```

Expected result: 1 row with schedule `0 1 * * *` (1am UTC daily)

If no result, manually schedule:

```sql
SELECT cron.schedule(
    'calculate-daily-percentiles',
    '0 1 * * *',
    $$ SELECT calculate_daily_percentiles(); $$
);
```

---

## Step 4: Verify Seed Data Loaded

```sql
-- Should return 49 rows (7 age brackets × 7 percentiles each)
SELECT COUNT(*) FROM percentile_seed_data;

-- Should show 7 rows per age bracket
SELECT age_bracket, COUNT(*) as count
FROM percentile_seed_data
GROUP BY age_bracket
ORDER BY age_bracket;
```

Expected output:
```
18-21 | 7
22-25 | 7
26-28 | 7
29-32 | 7
33-35 | 7
36-40 | 7
41+   | 7
```

---

## Step 5: Test Percentile Calculation (Manual Run)

```sql
-- Run the daily calculation function manually (for testing)
SELECT calculate_daily_percentiles();
```

This should complete without errors. Note: If you have no users yet, this will return quickly with no results.

---

## Step 6: Test API Endpoints

### Using curl (replace `<YOUR_DOMAIN>` and `<AUTH_TOKEN>`)

```bash
# Test GET /api/percentile (should work even if not logged in)
curl https://<YOUR_DOMAIN>/api/percentile

# Expected response (if not authenticated):
# {"error":"User not authenticated"}

# Test distribution endpoint (public)
curl https://<YOUR_DOMAIN>/api/percentile/distribution?age_bracket=26-28

# Expected response: JSON with distribution data
```

### Using your browser (logged in)

1. Log in to your app
2. Open browser DevTools → Network tab
3. Visit dashboard
4. Look for request to `/api/percentile`
5. Verify response: `{"opted_in": false, "message": "...", "has_demographics": false}`

---

## Step 7: Create Test Users (Optional but Recommended)

To test the percentile calculations, create a few test users:

```sql
-- Insert test demographics (replace <user_id> with real user IDs from your database)
INSERT INTO user_demographics (user_id, age_bracket, percentile_opt_in)
VALUES
  ('<user_1_id>', '26-28', true),
  ('<user_2_id>', '26-28', true),
  ('<user_3_id>', '26-28', true);

-- Insert test net worth snapshots
INSERT INTO net_worth_snapshots (user_id, snapshot_date, total_assets, total_liabilities, net_worth, breakdown)
VALUES
  ('<user_1_id>', CURRENT_DATE, 50000, 5000, 45000, '{"cash":20000,"investments":30000,"crypto":0,"real_estate":0,"other":0,"credit_card_debt":2000,"loans":3000}'::jsonb),
  ('<user_2_id>', CURRENT_DATE, 120000, 15000, 105000, '{"cash":30000,"investments":90000,"crypto":0,"real_estate":0,"other":0,"credit_card_debt":5000,"loans":10000}'::jsonb),
  ('<user_3_id>', CURRENT_DATE, 200000, 20000, 180000, '{"cash":40000,"investments":150000,"crypto":10000,"real_estate":0,"other":0,"credit_card_debt":10000,"loans":10000}'::jsonb);

-- Run percentile calculation
SELECT calculate_daily_percentiles();

-- Verify percentile snapshots were created
SELECT
  user_id,
  percentile,
  rank_position,
  total_users_in_bracket,
  uses_seed_data
FROM percentile_snapshots
WHERE age_bracket = '26-28'
ORDER BY percentile DESC;
```

Expected result: 3 users with different percentiles, all with `uses_seed_data = true` (since we have < 1000 users)

---

## Step 8: Verify Frontend

1. Log in to your app
2. Go to dashboard
3. If you have a user with net worth, wait 2 seconds
4. Verify opt-in modal appears (if user hasn't opted in yet)
5. Select an age bracket and click "Show Me My Rank"
6. Verify percentile card appears in right sidebar

---

## Step 9: Monitor Cron Job (First 48 Hours)

Check cron job execution logs daily:

```sql
-- Check recent cron job runs
SELECT
  jobname,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'calculate-daily-percentiles')
ORDER BY start_time DESC
LIMIT 10;
```

Expected: 1 successful run per day at ~1am UTC

---

## Troubleshooting

### Migration Failed

**Error:** "relation percentile_seed_data already exists"
**Solution:** Migration was already run. Safe to ignore.

**Error:** "function calculate_percentile_hybrid does not exist"
**Solution:** Re-run migration file completely.

---

### Cron Job Not Running

**Symptom:** No rows in `cron.job_run_details`
**Solutions:**
1. Verify pg_cron is enabled (see Step 2)
2. Manually schedule job (see Step 3)
3. Wait until 1am UTC for first run
4. Or manually trigger: `SELECT calculate_daily_percentiles();`

---

### Percentile Card Not Showing

**Checklist:**
1. ✅ User has net worth data in `net_worth_snapshots`
2. ✅ User has opted in (`percentile_opt_in = true` in `user_demographics`)
3. ✅ Percentile snapshot exists for user
4. ✅ Frontend is fetching `/api/percentile` correctly (check Network tab)
5. ✅ No JavaScript errors in browser console

---

### "No net worth data available yet" Message

**This is normal!** It means:
- User has opted in ✅
- But user has no net worth snapshots yet ❌

**Solution:** User needs to add accounts (Plaid, crypto, or manual assets)

---

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- WARNING: This will delete all percentile data!

DROP TABLE IF EXISTS percentile_milestones CASCADE;
DROP TABLE IF EXISTS percentile_snapshots CASCADE;
DROP TABLE IF EXISTS percentile_seed_data CASCADE;

DROP FUNCTION IF EXISTS calculate_percentile_hybrid(UUID, TEXT);
DROP FUNCTION IF EXISTS calculate_daily_percentiles();
DROP FUNCTION IF EXISTS get_percentile_distribution(TEXT);

-- Remove cron job
SELECT cron.unschedule('calculate-daily-percentiles');

-- Revert user_demographics changes (if needed)
ALTER TABLE user_demographics
DROP COLUMN IF EXISTS percentile_opt_in,
DROP COLUMN IF EXISTS uses_seed_data,
DROP COLUMN IF EXISTS last_percentile_calculation;
```

---

## Success Checklist

After deployment, verify:

- [  ] Migration ran successfully (no errors in SQL editor)
- [  ] pg_cron extension enabled
- [  ] Cron job scheduled (shows in `cron.job` table)
- [  ] Seed data loaded (49 rows in `percentile_seed_data`)
- [  ] API endpoints respond correctly
- [  ] Opt-in modal appears for users with net worth
- [  ] Percentile card displays after opt-in
- [  ] "Learn More" modal works
- [  ] Mobile responsive (test on phone)
- [  ] Cron job ran successfully at 1am UTC (check next day)

---

## Post-Deployment Monitoring

### Week 1 Metrics to Track

```sql
-- Opt-in rate
SELECT
  COUNT(*) FILTER (WHERE percentile_opt_in = true) as opted_in,
  COUNT(*) as total_users,
  ROUND(100.0 * COUNT(*) FILTER (WHERE percentile_opt_in = true) / NULLIF(COUNT(*), 0), 2) as opt_in_rate_percent
FROM user_demographics;

-- Users per age bracket
SELECT
  age_bracket,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE percentile_opt_in = true) as opted_in
FROM user_demographics
GROUP BY age_bracket
ORDER BY age_bracket;

-- Percentile distribution (should be relatively balanced)
SELECT
  CASE
    WHEN percentile >= 90 THEN 'Top 10%'
    WHEN percentile >= 75 THEN 'Top 25%'
    WHEN percentile >= 50 THEN 'Top 50%'
    ELSE 'Bottom 50%'
  END as tier,
  COUNT(*) as user_count
FROM percentile_snapshots
WHERE snapshot_date = CURRENT_DATE
GROUP BY tier
ORDER BY tier;
```

Target Metrics:
- **Opt-in rate:** 70%+ (within first week)
- **Users per bracket:** Relatively balanced (not all in one bracket)
- **Percentile distribution:** Roughly normal distribution

---

## 🚀 You're Ready!

Follow these steps, verify each checkpoint, and you'll have the percentile ranking feature live in production.

**Timeline:** 30-60 minutes for complete deployment + testing

**Questions?** See `PERCENTILE_IMPLEMENTATION_COMPLETE.md` for troubleshooting guide.
