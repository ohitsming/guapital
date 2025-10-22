-- =====================================================
-- PERCENTILE RANKING FEATURE - COMPREHENSIVE MIGRATION
-- =====================================================
-- This migration creates all tables and functions needed for
-- the percentile ranking feature (THE killer feature!)
--
-- Created: January 2025
-- Phase: MVP Core Percentile Ranking (no social sharing yet)
-- =====================================================

-- =====================================================
-- 1. SEED DATA TABLE (Federal Reserve SCF 2022)
-- =====================================================

CREATE TABLE IF NOT EXISTS percentile_seed_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    age_bracket TEXT NOT NULL,
    percentile NUMERIC(5,2) NOT NULL, -- 10, 25, 50, 75, 90, 95, 99
    net_worth NUMERIC(15,2) NOT NULL,
    source TEXT DEFAULT 'SCF_2022',
    data_year INTEGER DEFAULT 2022,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(age_bracket, percentile, source, data_year)
);

-- Index for fast lookups during percentile calculations
CREATE INDEX IF NOT EXISTS idx_seed_age_percentile
    ON percentile_seed_data(age_bracket, percentile);

-- No RLS needed - this is public reference data
ALTER TABLE percentile_seed_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seed data is publicly readable"
    ON percentile_seed_data FOR SELECT
    USING (true);

COMMENT ON TABLE percentile_seed_data IS 'Federal Reserve SCF 2022 benchmark data for percentile calculations. Used to bootstrap rankings before we have 1000+ real users per bracket.';


-- =====================================================
-- 2. PERCENTILE SNAPSHOTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS percentile_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    age_bracket TEXT NOT NULL,
    net_worth NUMERIC(15,2) NOT NULL,
    percentile NUMERIC(5,2), -- e.g., 87.25 for top 12.75%
    rank_position INTEGER, -- actual rank (e.g., 127 out of 1000)
    total_users_in_bracket INTEGER,
    uses_seed_data BOOLEAN DEFAULT false, -- true if blended with SCF data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_percentile_snapshots_user_date
    ON percentile_snapshots(user_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_percentile_snapshots_bracket
    ON percentile_snapshots(age_bracket, net_worth DESC);

-- RLS policies
ALTER TABLE percentile_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own percentile history"
    ON percentile_snapshots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert percentile snapshots"
    ON percentile_snapshots FOR INSERT
    WITH CHECK (true);

COMMENT ON TABLE percentile_snapshots IS 'Daily snapshots of user percentile rankings. Calculated by nightly cron job.';


-- =====================================================
-- 3. PERCENTILE MILESTONES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS percentile_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL, -- 'top_50', 'top_25', 'top_10', 'top_5', 'top_1'
    achieved_at TIMESTAMPTZ,
    net_worth_at_achievement NUMERIC(15,2),
    shared_publicly BOOLEAN DEFAULT false, -- for future social sharing feature
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, milestone_type)
);

-- RLS policies
ALTER TABLE percentile_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones"
    ON percentile_milestones FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert milestones"
    ON percentile_milestones FOR INSERT
    WITH CHECK (true);

COMMENT ON TABLE percentile_milestones IS 'Tracks achievement of percentile milestones (Top 50%, 25%, 10%, etc.). Will be used for achievement badges and social sharing in future iterations.';


-- =====================================================
-- 4. UPDATE USER_DEMOGRAPHICS TABLE
-- =====================================================

-- Add new columns if they don't exist
DO $$
BEGIN
    -- Update age_bracket to support new spec brackets if needed
    -- Note: old data with '24-25' etc will need manual migration if any exists

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_demographics'
        AND column_name = 'percentile_opt_in'
    ) THEN
        ALTER TABLE user_demographics
        ADD COLUMN percentile_opt_in BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_demographics'
        AND column_name = 'uses_seed_data'
    ) THEN
        ALTER TABLE user_demographics
        ADD COLUMN uses_seed_data BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_demographics'
        AND column_name = 'last_percentile_calculation'
    ) THEN
        ALTER TABLE user_demographics
        ADD COLUMN last_percentile_calculation TIMESTAMPTZ;
    END IF;
END $$;

COMMENT ON COLUMN user_demographics.percentile_opt_in IS 'Whether user has opted into percentile ranking feature';
COMMENT ON COLUMN user_demographics.uses_seed_data IS 'Whether user''s percentile is calculated using blended SCF seed data (true if < 1000 users in bracket)';
COMMENT ON COLUMN user_demographics.age_bracket IS 'Age bracket for percentile comparison: 18-21, 22-25, 26-28, 29-32, 33-35, 36-40, 41+';


-- =====================================================
-- 5. IMPORT SCF SEED DATA
-- =====================================================

-- Federal Reserve SCF 2022 Seed Data for Percentile Rankings
-- Generated by scripts/process-scf-data.py
-- Source: Federal Reserve Survey of Consumer Finances 2022

INSERT INTO percentile_seed_data (age_bracket, percentile, net_worth, source, data_year) VALUES
  ('18-21', 10, -8900.00, 'SCF_2022', 2022),
  ('18-21', 25, -1200.00, 'SCF_2022', 2022),
  ('18-21', 50, 10800.00, 'SCF_2022', 2022),
  ('18-21', 75, 48200.00, 'SCF_2022', 2022),
  ('18-21', 90, 114900.00, 'SCF_2022', 2022),
  ('18-21', 95, 185200.00, 'SCF_2022', 2022),
  ('18-21', 99, 551000.00, 'SCF_2022', 2022),
  ('22-25', 10, -8525.00, 'SCF_2022', 2022),
  ('22-25', 25, 2216.67, 'SCF_2022', 2022),
  ('22-25', 50, 22550.00, 'SCF_2022', 2022),
  ('22-25', 75, 84366.67, 'SCF_2022', 2022),
  ('22-25', 90, 226191.67, 'SCF_2022', 2022),
  ('22-25', 95, 379283.33, 'SCF_2022', 2022),
  ('22-25', 99, 1071416.67, 'SCF_2022', 2022),
  ('26-28', 10, -8000.00, 'SCF_2022', 2022),
  ('26-28', 25, 7000.00, 'SCF_2022', 2022),
  ('26-28', 50, 39000.00, 'SCF_2022', 2022),
  ('26-28', 75, 135000.00, 'SCF_2022', 2022),
  ('26-28', 90, 382000.00, 'SCF_2022', 2022),
  ('26-28', 95, 651000.00, 'SCF_2022', 2022),
  ('26-28', 99, 1800000.00, 'SCF_2022', 2022),
  ('29-32', 10, -6530.00, 'SCF_2022', 2022),
  ('29-32', 25, 16940.00, 'SCF_2022', 2022),
  ('29-32', 50, 76940.00, 'SCF_2022', 2022),
  ('29-32', 75, 220400.00, 'SCF_2022', 2022),
  ('29-32', 90, 527600.00, 'SCF_2022', 2022),
  ('29-32', 95, 873600.00, 'SCF_2022', 2022),
  ('29-32', 99, 2465000.00, 'SCF_2022', 2022),
  ('33-35', 10, -4380.00, 'SCF_2022', 2022),
  ('33-35', 25, 29720.00, 'SCF_2022', 2022),
  ('33-35', 50, 123120.00, 'SCF_2022', 2022),
  ('33-35', 75, 328600.00, 'SCF_2022', 2022),
  ('33-35', 90, 728000.00, 'SCF_2022', 2022),
  ('33-35', 95, 1189400.00, 'SCF_2022', 2022),
  ('33-35', 99, 3290000.00, 'SCF_2022', 2022),
  ('36-40', 10, -640.00, 'SCF_2022', 2022),
  ('36-40', 25, 48200.00, 'SCF_2022', 2022),
  ('36-40', 50, 183400.00, 'SCF_2022', 2022),
  ('36-40', 75, 470400.00, 'SCF_2022', 2022),
  ('36-40', 90, 1006000.00, 'SCF_2022', 2022),
  ('36-40', 95, 1634000.00, 'SCF_2022', 2022),
  ('36-40', 99, 4400000.00, 'SCF_2022', 2022),
  ('41+', 10, 15600.00, 'SCF_2022', 2022),
  ('41+', 25, 115000.00, 'SCF_2022', 2022),
  ('41+', 50, 370000.00, 'SCF_2022', 2022),
  ('41+', 75, 920000.00, 'SCF_2022', 2022),
  ('41+', 90, 1970000.00, 'SCF_2022', 2022),
  ('41+', 95, 3180000.00, 'SCF_2022', 2022),
  ('41+', 99, 8500000.00, 'SCF_2022', 2022)
ON CONFLICT (age_bracket, percentile, source, data_year) DO UPDATE
  SET net_worth = EXCLUDED.net_worth;


-- =====================================================
-- 6. HYBRID PERCENTILE CALCULATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_percentile_hybrid(
    p_user_id UUID,
    p_age_bracket TEXT
) RETURNS TABLE(
    percentile NUMERIC,
    rank_position INTEGER,
    total_users INTEGER,
    uses_seed_data BOOLEAN,
    next_milestone_type TEXT,
    next_milestone_net_worth NUMERIC
) AS $$
DECLARE
    real_user_count INTEGER;
    user_net_worth NUMERIC;
    v_percentile NUMERIC;
    v_rank INTEGER;
    v_total INTEGER;
    v_uses_seed BOOLEAN;
BEGIN
    -- Get user's current net worth
    SELECT nw.net_worth INTO user_net_worth
    FROM net_worth_snapshots nw
    WHERE nw.user_id = p_user_id
    ORDER BY nw.snapshot_date DESC
    LIMIT 1;

    -- If user has no net worth data, return NULL
    IF user_net_worth IS NULL THEN
        RETURN QUERY SELECT NULL::NUMERIC, NULL::INTEGER, NULL::INTEGER, NULL::BOOLEAN, NULL::TEXT, NULL::NUMERIC;
        RETURN;
    END IF;

    -- Count real users in bracket who are opted in
    SELECT COUNT(*) INTO real_user_count
    FROM user_demographics ud
    JOIN net_worth_snapshots nw ON ud.user_id = nw.user_id
    WHERE ud.age_bracket = p_age_bracket
      AND ud.percentile_opt_in = true;

    -- =============================================
    -- PHASE 1: Use seed data (< 1000 real users)
    -- =============================================
    IF real_user_count < 1000 THEN
        -- Combine real users + seed data
        WITH combined_data AS (
            -- Real Guapital users
            SELECT
                nw.user_id,
                nw.net_worth,
                'real' as source
            FROM (
                SELECT DISTINCT ON (user_id)
                    user_id,
                    net_worth
                FROM net_worth_snapshots
                ORDER BY user_id, snapshot_date DESC
            ) nw
            JOIN user_demographics ud ON nw.user_id = ud.user_id
            WHERE ud.age_bracket = p_age_bracket
              AND ud.percentile_opt_in = true

            UNION ALL

            -- SCF seed data (interpolated as synthetic users)
            -- We'll create multiple synthetic users per percentile for smoother distribution
            SELECT
                NULL::UUID as user_id,
                net_worth,
                'seed' as source
            FROM percentile_seed_data
            WHERE age_bracket = p_age_bracket
              AND source = 'SCF_2022'
        ),
        user_ranking AS (
            SELECT
                user_id,
                net_worth,
                source,
                COUNT(*) FILTER (WHERE net_worth < user_net_worth) as users_below,
                COUNT(*) as total_count,
                ROW_NUMBER() OVER (ORDER BY net_worth DESC) as rank
            FROM combined_data
            GROUP BY user_id, net_worth, source
        )
        SELECT
            ROUND((users_below::NUMERIC / NULLIF(total_count, 0)::NUMERIC) * 100, 2) as calc_percentile,
            rank::INTEGER as calc_rank,
            total_count::INTEGER as calc_total,
            true as calc_uses_seed
        INTO v_percentile, v_rank, v_total, v_uses_seed
        FROM user_ranking
        WHERE (user_id = p_user_id OR (user_id IS NULL AND net_worth = user_net_worth))
        LIMIT 1;

    -- =============================================
    -- PHASE 2: Pure real data (1000+ real users)
    -- =============================================
    ELSE
        WITH real_data AS (
            SELECT DISTINCT ON (user_id)
                user_id,
                net_worth
            FROM net_worth_snapshots
            ORDER BY user_id, snapshot_date DESC
        ),
        user_ranking AS (
            SELECT
                rd.user_id,
                rd.net_worth,
                COUNT(*) FILTER (WHERE rd2.net_worth < rd.net_worth) as users_below,
                COUNT(*) as total_count,
                ROW_NUMBER() OVER (ORDER BY rd.net_worth DESC) as rank
            FROM real_data rd
            JOIN user_demographics ud ON rd.user_id = ud.user_id
            CROSS JOIN real_data rd2
            JOIN user_demographics ud2 ON rd2.user_id = ud2.user_id
            WHERE ud.age_bracket = p_age_bracket
              AND ud.percentile_opt_in = true
              AND ud2.age_bracket = p_age_bracket
              AND ud2.percentile_opt_in = true
            GROUP BY rd.user_id, rd.net_worth
        )
        SELECT
            ROUND((users_below::NUMERIC / NULLIF(total_count, 0)::NUMERIC) * 100, 2) as calc_percentile,
            rank::INTEGER as calc_rank,
            total_count::INTEGER as calc_total,
            false as calc_uses_seed
        INTO v_percentile, v_rank, v_total, v_uses_seed
        FROM user_ranking
        WHERE user_id = p_user_id;
    END IF;

    -- =============================================
    -- Calculate next milestone
    -- =============================================
    DECLARE
        next_milestone TEXT := NULL;
        next_milestone_nw NUMERIC := NULL;
        milestone_thresholds NUMERIC[];
    BEGIN
        -- Determine next milestone based on current percentile
        IF v_percentile IS NOT NULL THEN
            IF v_percentile < 50 THEN
                next_milestone := 'top_50';
                -- Get P50 from seed data or real data
                SELECT net_worth INTO next_milestone_nw
                FROM percentile_seed_data
                WHERE age_bracket = p_age_bracket AND percentile = 50
                LIMIT 1;
            ELSIF v_percentile < 75 THEN
                next_milestone := 'top_25';
                SELECT net_worth INTO next_milestone_nw
                FROM percentile_seed_data
                WHERE age_bracket = p_age_bracket AND percentile = 75
                LIMIT 1;
            ELSIF v_percentile < 90 THEN
                next_milestone := 'top_10';
                SELECT net_worth INTO next_milestone_nw
                FROM percentile_seed_data
                WHERE age_bracket = p_age_bracket AND percentile = 90
                LIMIT 1;
            ELSIF v_percentile < 95 THEN
                next_milestone := 'top_5';
                SELECT net_worth INTO next_milestone_nw
                FROM percentile_seed_data
                WHERE age_bracket = p_age_bracket AND percentile = 95
                LIMIT 1;
            ELSIF v_percentile < 99 THEN
                next_milestone := 'top_1';
                SELECT net_worth INTO next_milestone_nw
                FROM percentile_seed_data
                WHERE age_bracket = p_age_bracket AND percentile = 99
                LIMIT 1;
            ELSE
                -- Already at top 1%!
                next_milestone := 'top_1_achieved';
                next_milestone_nw := NULL;
            END IF;
        END IF;

        RETURN QUERY SELECT
            v_percentile,
            v_rank,
            v_total,
            v_uses_seed,
            next_milestone,
            next_milestone_nw;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_percentile_hybrid IS 'Calculates user percentile rank using hybrid approach: blends SCF seed data with real users when < 1000 users in bracket, transitions to pure real data at 1000+ users. Returns percentile, rank, total users, and next milestone.';


-- =====================================================
-- 7. DAILY CRON JOB FOR PERCENTILE CALCULATIONS
-- =====================================================

-- Function to be called daily by cron
CREATE OR REPLACE FUNCTION calculate_daily_percentiles()
RETURNS void AS $$
DECLARE
    bracket TEXT;
    brackets TEXT[] := ARRAY['18-21', '22-25', '26-28', '29-32', '33-35', '36-40', '41+'];
    user_record RECORD;
    percentile_result RECORD;
BEGIN
    -- Loop through each age bracket
    FOREACH bracket IN ARRAY brackets LOOP

        -- For each opted-in user in this bracket
        FOR user_record IN
            SELECT ud.user_id, ud.age_bracket
            FROM user_demographics ud
            WHERE ud.age_bracket = bracket
              AND ud.percentile_opt_in = true
        LOOP
            -- Calculate their percentile
            SELECT * INTO percentile_result
            FROM calculate_percentile_hybrid(user_record.user_id, user_record.age_bracket);

            -- Skip if no net worth data
            CONTINUE WHEN percentile_result.percentile IS NULL;

            -- Get user's current net worth
            DECLARE
                current_nw NUMERIC;
            BEGIN
                SELECT net_worth INTO current_nw
                FROM net_worth_snapshots
                WHERE user_id = user_record.user_id
                ORDER BY snapshot_date DESC
                LIMIT 1;

                -- Insert snapshot
                INSERT INTO percentile_snapshots (
                    user_id,
                    snapshot_date,
                    age_bracket,
                    net_worth,
                    percentile,
                    rank_position,
                    total_users_in_bracket,
                    uses_seed_data
                ) VALUES (
                    user_record.user_id,
                    CURRENT_DATE,
                    user_record.age_bracket,
                    current_nw,
                    percentile_result.percentile,
                    percentile_result.rank_position,
                    percentile_result.total_users,
                    percentile_result.uses_seed_data
                )
                ON CONFLICT (user_id, snapshot_date) DO UPDATE
                    SET percentile = EXCLUDED.percentile,
                        rank_position = EXCLUDED.rank_position,
                        total_users_in_bracket = EXCLUDED.total_users_in_bracket,
                        uses_seed_data = EXCLUDED.uses_seed_data;

                -- Check for milestone achievements
                DECLARE
                    milestone_to_insert TEXT := NULL;
                BEGIN
                    IF percentile_result.percentile >= 99 THEN
                        milestone_to_insert := 'top_1';
                    ELSIF percentile_result.percentile >= 95 THEN
                        milestone_to_insert := 'top_5';
                    ELSIF percentile_result.percentile >= 90 THEN
                        milestone_to_insert := 'top_10';
                    ELSIF percentile_result.percentile >= 75 THEN
                        milestone_to_insert := 'top_25';
                    ELSIF percentile_result.percentile >= 50 THEN
                        milestone_to_insert := 'top_50';
                    END IF;

                    IF milestone_to_insert IS NOT NULL THEN
                        INSERT INTO percentile_milestones (
                            user_id,
                            milestone_type,
                            achieved_at,
                            net_worth_at_achievement
                        ) VALUES (
                            user_record.user_id,
                            milestone_to_insert,
                            NOW(),
                            current_nw
                        )
                        ON CONFLICT (user_id, milestone_type) DO NOTHING;
                    END IF;
                END;

                -- Update last calculation timestamp
                UPDATE user_demographics
                SET last_percentile_calculation = NOW(),
                    uses_seed_data = percentile_result.uses_seed_data
                WHERE user_id = user_record.user_id;
            END;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Daily percentile calculations completed successfully';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_daily_percentiles IS 'Daily cron job (runs at 1am UTC) to calculate percentiles for all opted-in users across all age brackets.';


-- =====================================================
-- 8. SCHEDULE CRON JOB (requires pg_cron extension)
-- =====================================================

-- Note: pg_cron must be enabled in Supabase dashboard first
-- This will schedule the job to run daily at 1am UTC
--
-- To enable:
-- 1. Go to Supabase Dashboard → Database → Extensions
-- 2. Enable "pg_cron"
-- 3. Then run this:

DO $migration$
BEGIN
    -- Check if pg_cron is available
    IF EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
    ) THEN
        -- Enable extension if not already enabled
        CREATE EXTENSION IF NOT EXISTS pg_cron;

        -- Schedule the job (unschedule first if exists)
        PERFORM cron.unschedule('calculate-daily-percentiles');

        PERFORM cron.schedule(
            'calculate-daily-percentiles',
            '0 1 * * *', -- 1am UTC daily
            $$ SELECT calculate_daily_percentiles(); $$
        );

        RAISE NOTICE 'Cron job scheduled successfully: daily at 1am UTC';
    ELSE
        RAISE NOTICE 'pg_cron extension not available - cron job not scheduled. Enable pg_cron in Supabase dashboard.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not schedule cron job: %. This is OK for local development.', SQLERRM;
END $migration$;


-- =====================================================
-- 9. HELPER FUNCTIONS FOR API
-- =====================================================

-- Get distribution data for an age bracket (for charts)
CREATE OR REPLACE FUNCTION get_percentile_distribution(p_age_bracket TEXT)
RETURNS TABLE(
    percentile INTEGER,
    min_net_worth NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        psd.percentile::INTEGER,
        psd.net_worth as min_net_worth
    FROM percentile_seed_data psd
    WHERE psd.age_bracket = p_age_bracket
      AND psd.source = 'SCF_2022'
    ORDER BY psd.percentile;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_percentile_distribution IS 'Returns percentile distribution thresholds for an age bracket. Used for rendering distribution charts in UI.';


-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log success
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'PERCENTILE RANKING MIGRATION COMPLETED';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - percentile_seed_data (SCF 2022 benchmarks)';
    RAISE NOTICE '  - percentile_snapshots (daily user rankings)';
    RAISE NOTICE '  - percentile_milestones (achievement tracking)';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  - calculate_percentile_hybrid() - hybrid calculation';
    RAISE NOTICE '  - calculate_daily_percentiles() - cron job';
    RAISE NOTICE '  - get_percentile_distribution() - chart data';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Verify seed data: SELECT COUNT(*) FROM percentile_seed_data;';
    RAISE NOTICE '  2. Enable pg_cron in Supabase dashboard (if not already)';
    RAISE NOTICE '  3. Build API endpoints in /api/percentile/*';
    RAISE NOTICE '=================================================';
END $$;
