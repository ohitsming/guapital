# Percentile Ranking Migrations

## For Fresh Database Setup

Use this single consolidated migration:
- **`005_percentile_ranking_CONSOLIDATED.sql`** - Complete percentile ranking feature

This file includes all fixes and is ready for production use.

## For Existing Databases (Already Ran 005-010)

You're all set! The following migrations were applied during development:

1. ✅ `005_percentile_ranking.sql` - Original percentile ranking implementation
2. ✅ `006_fix_user_demographics_rls.sql` - RLS policy fix (didn't solve the issue)
3. ✅ `007_create_opt_in_function.sql` - SECURITY DEFINER function for opt-in
4. ✅ `008_fix_age_bracket_trigger.sql` - **CRITICAL**: Allows manual age_bracket selection
5. ✅ `009_fix_percentile_ambiguous_column.sql` - Fixed SQL ambiguous column error
6. ✅ `010_fix_percentile_calculation.sql` - **CRITICAL**: Fixed percentile calculation to properly combine seed data

**Do NOT re-run these if you've already applied them.**

## Key Features

- **Hybrid percentile calculation**: Blends Federal Reserve SCF 2022 data with real users when < 1000 users per age bracket
- **Age brackets**: 18-21, 22-25, 26-28, 29-32, 33-35, 36-40, 41+
- **Milestone tracking**: Top 50%, 25%, 10%, 5%, 1%
- **Daily cron job**: Automatically updates rankings at 1 AM UTC
- **Privacy-first**: Anonymous rankings, opt-in only

## Manual Cron Job Setup

If the cron job isn't scheduled, run this in Supabase SQL Editor:

```sql
SELECT cron.schedule(
    'calculate-daily-percentiles',
    '0 1 * * *',
    'SELECT calculate_daily_percentiles();'
);
```

## Verification

Check if everything is set up correctly:

```sql
-- Check if tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'percentile%';

-- Check if seed data loaded (should return 49 rows)
SELECT COUNT(*) FROM percentile_seed_data;

-- Check if cron job is scheduled
SELECT * FROM cron.job WHERE jobname = 'calculate-daily-percentiles';

-- Test percentile calculation for a user
SELECT * FROM calculate_percentile_hybrid(
    'YOUR_USER_ID'::uuid,
    '29-32'::text
);
```

## Troubleshooting

**Issue**: Age bracket not saving
- **Cause**: Trigger `update_age_bracket()` was overwriting manual selections
- **Fix**: Applied in migration `008_fix_age_bracket_trigger.sql`

**Issue**: Percentile returns null despite having net worth
- **Cause**: Function wasn't properly combining real users with seed data
- **Fix**: Applied in migration `010_fix_percentile_calculation.sql`

**Issue**: "Column reference percentile is ambiguous"
- **Cause**: SQL variable names conflicted with output column names
- **Fix**: Applied in migration `009_fix_percentile_ambiguous_column.sql`
