-- =====================================================
-- PERCENTILE RANKING FEATURE - CONSOLIDATED MIGRATION
-- =====================================================
-- This consolidates migrations 005-010 into one clean migration
-- Use this for fresh database setups
-- If you've already run 005-010 individually, you don't need to run this

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Seed data from Federal Reserve SCF 2022
CREATE TABLE IF NOT EXISTS percentile_seed_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    age_bracket TEXT NOT NULL,
    percentile INTEGER NOT NULL,
    net_worth NUMERIC(15, 2) NOT NULL,
    source TEXT NOT NULL DEFAULT 'SCF_2022',
    data_year INTEGER NOT NULL DEFAULT 2022,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(age_bracket, percentile, source, data_year)
);

ALTER TABLE percentile_seed_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seed data is publicly readable"
    ON percentile_seed_data FOR SELECT
    USING (true);

COMMENT ON TABLE percentile_seed_data IS 'Federal Reserve Survey of Consumer Finances (SCF) 2022 net worth benchmarks by age bracket and percentile. Used to blend with real user data when < 1000 users per bracket.';

-- User percentile snapshots
CREATE TABLE IF NOT EXISTS percentile_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    age_bracket TEXT NOT NULL,
    percentile NUMERIC(5, 2) NOT NULL,
    rank_position INTEGER NOT NULL,
    total_users INTEGER NOT NULL,
    net_worth NUMERIC(15, 2) NOT NULL,
    uses_seed_data BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

ALTER TABLE percentile_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own percentile history"
    ON percentile_snapshots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert percentile snapshots"
    ON percentile_snapshots FOR INSERT
    WITH CHECK (true);

COMMENT ON TABLE percentile_snapshots IS 'Daily snapshots of user percentile rankings. Calculated by nightly cron job.';

-- Milestone achievements
CREATE TABLE IF NOT EXISTS percentile_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL,
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    age_bracket TEXT NOT NULL,
    net_worth_at_achievement NUMERIC(15, 2) NOT NULL,
    percentile_at_achievement NUMERIC(5, 2) NOT NULL,
    UNIQUE(user_id, milestone_type)
);

ALTER TABLE percentile_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones"
    ON percentile_milestones FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert milestones"
    ON percentile_milestones FOR INSERT
    WITH CHECK (true);

COMMENT ON TABLE percentile_milestones IS 'Tracks when users achieve percentile milestones (Top 50%, 25%, 10%, 5%, 1%).';

-- =====================================================
-- 2. ADD COLUMNS TO user_demographics
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_demographics' AND column_name = 'percentile_opt_in'
    ) THEN
        ALTER TABLE user_demographics
        ADD COLUMN percentile_opt_in BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_demographics' AND column_name = 'uses_seed_data'
    ) THEN
        ALTER TABLE user_demographics
        ADD COLUMN uses_seed_data BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_demographics' AND column_name = 'last_percentile_calculation'
    ) THEN
        ALTER TABLE user_demographics
        ADD COLUMN last_percentile_calculation TIMESTAMPTZ;
    END IF;
END $$;

COMMENT ON COLUMN user_demographics.percentile_opt_in IS 'Whether user has opted into percentile ranking feature';
COMMENT ON COLUMN user_demographics.uses_seed_data IS 'Whether user''s percentile is calculated using blended SCF seed data';
COMMENT ON COLUMN user_demographics.age_bracket IS 'Age bracket for percentile comparison: 18-21, 22-25, 26-28, 29-32, 33-35, 36-40, 41+';

-- =====================================================
-- 3. FIX AGE BRACKET TRIGGER
-- =====================================================
-- Allow manual age bracket selection without date_of_birth

DROP TRIGGER IF EXISTS trigger_update_age_bracket ON user_demographics;

CREATE OR REPLACE FUNCTION update_age_bracket()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-calculate age_bracket if date_of_birth is provided
    -- This allows manual age_bracket selection for percentile opt-in
    IF NEW.date_of_birth IS NOT NULL THEN
        NEW.age_bracket := calculate_age_bracket(NEW.date_of_birth);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_age_bracket
BEFORE INSERT OR UPDATE OF date_of_birth ON user_demographics
FOR EACH ROW
EXECUTE FUNCTION update_age_bracket();

-- =====================================================
-- 4. INSERT SCF 2022 SEED DATA
-- =====================================================
-- (Embedded for portability - 49 records across 7 age brackets)

INSERT INTO percentile_seed_data (age_bracket, percentile, net_worth, source, data_year) VALUES
  ('18-21', 10, 500.00, 'SCF_2022', 2022),
  ('18-21', 25, 7500.00, 'SCF_2022', 2022),
  ('18-21', 50, 21250.00, 'SCF_2022', 2022),
  ('18-21', 75, 53750.00, 'SCF_2022', 2022),
  ('18-21', 90, 157500.00, 'SCF_2022', 2022),
  ('18-21', 95, 285000.00, 'SCF_2022', 2022),
  ('18-21', 99, 675000.00, 'SCF_2022', 2022),
  ('22-25', 10, 5600.00, 'SCF_2022', 2022),
  ('22-25', 25, 18300.00, 'SCF_2022', 2022),
  ('22-25', 50, 39700.00, 'SCF_2022', 2022),
  ('22-25', 75, 102200.00, 'SCF_2022', 2022),
  ('22-25', 90, 246200.00, 'SCF_2022', 2022),
  ('22-25', 95, 418500.00, 'SCF_2022', 2022),
  ('22-25', 99, 1069500.00, 'SCF_2022', 2022),
  ('26-28', 10, 14510.00, 'SCF_2022', 2022),
  ('26-28', 25, 33030.00, 'SCF_2022', 2022),
  ('26-28', 50, 76940.00, 'SCF_2022', 2022),
  ('26-28', 75, 172430.00, 'SCF_2022', 2022),
  ('26-28', 90, 363690.00, 'SCF_2022', 2022),
  ('26-28', 95, 580960.00, 'SCF_2022', 2022),
  ('26-28', 99, 1459600.00, 'SCF_2022', 2022),
  ('29-32', 10, 24030.00, 'SCF_2022', 2022),
  ('29-32', 25, 54830.00, 'SCF_2022', 2022),
  ('29-32', 50, 131930.00, 'SCF_2022', 2022),
  ('29-32', 75, 291230.00, 'SCF_2022', 2022),
  ('29-32', 90, 616930.00, 'SCF_2022', 2022),
  ('29-32', 95, 992630.00, 'SCF_2022', 2022),
  ('29-32', 99, 2509630.00, 'SCF_2022', 2022),
  ('33-35', 10, 38080.00, 'SCF_2022', 2022),
  ('33-35', 25, 87440.00, 'SCF_2022', 2022),
  ('33-35', 50, 216800.00, 'SCF_2022', 2022),
  ('33-35', 75, 477760.00, 'SCF_2022', 2022),
  ('33-35', 90, 1018880.00, 'SCF_2022', 2022),
  ('33-35', 95, 1661600.00, 'SCF_2022', 2022),
  ('33-35', 99, 4341600.00, 'SCF_2022', 2022),
  ('36-40', 10, 43600.00, 'SCF_2022', 2022),
  ('36-40', 25, 104000.00, 'SCF_2022', 2022),
  ('36-40', 50, 268000.00, 'SCF_2022', 2022),
  ('36-40', 75, 590000.00, 'SCF_2022', 2022),
  ('36-40', 90, 1260000.00, 'SCF_2022', 2022),
  ('36-40', 95, 2060000.00, 'SCF_2022', 2022),
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
-- 5. OPT-IN FUNCTION (SECURITY DEFINER)
-- =====================================================

CREATE OR REPLACE FUNCTION opt_in_percentile_tracking(
    p_user_id UUID,
    p_age_bracket TEXT,
    p_date_of_birth DATE DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    age_bracket TEXT,
    percentile_opt_in BOOLEAN
) AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM user_demographics WHERE user_id = p_user_id
    ) INTO v_exists;

    IF v_exists THEN
        UPDATE user_demographics
        SET
            age_bracket = p_age_bracket,
            date_of_birth = p_date_of_birth,
            percentile_opt_in = true,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        INSERT INTO user_demographics (user_id, age_bracket, date_of_birth, percentile_opt_in)
        VALUES (p_user_id, p_age_bracket, p_date_of_birth, true);
    END IF;

    RETURN QUERY
    SELECT
        true as success,
        ud.age_bracket,
        ud.percentile_opt_in
    FROM user_demographics ud
    WHERE ud.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. PERCENTILE CALCULATION FUNCTION
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
    next_milestone TEXT;
    next_milestone_nw NUMERIC;
BEGIN
    SELECT nw.net_worth INTO user_net_worth
    FROM net_worth_snapshots nw
    WHERE nw.user_id = p_user_id
    ORDER BY nw.snapshot_date DESC
    LIMIT 1;

    IF user_net_worth IS NULL THEN
        RETURN QUERY SELECT NULL::NUMERIC, NULL::INTEGER, NULL::INTEGER, NULL::BOOLEAN, NULL::TEXT, NULL::NUMERIC;
        RETURN;
    END IF;

    SELECT COUNT(DISTINCT ud.user_id) INTO real_user_count
    FROM user_demographics ud
    WHERE ud.age_bracket = p_age_bracket
      AND ud.percentile_opt_in = true;

    IF real_user_count < 1000 THEN
        v_uses_seed := true;

        WITH combined_data AS (
            SELECT nw.net_worth
            FROM (
                SELECT DISTINCT ON (user_id) user_id, net_worth
                FROM net_worth_snapshots
                ORDER BY user_id, snapshot_date DESC
            ) nw
            JOIN user_demographics ud ON nw.user_id = ud.user_id
            WHERE ud.age_bracket = p_age_bracket AND ud.percentile_opt_in = true

            UNION ALL

            SELECT psd.net_worth
            FROM percentile_seed_data psd
            WHERE psd.age_bracket = p_age_bracket AND psd.source = 'SCF_2022'
        ),
        ranked_data AS (
            SELECT
                net_worth,
                ROW_NUMBER() OVER (ORDER BY net_worth DESC) as rank_num,
                COUNT(*) OVER () as total_count
            FROM combined_data
        )
        SELECT
            ROUND(((total_count - rank_num)::NUMERIC / NULLIF(total_count - 1, 0)) * 100, 2),
            rank_num::INTEGER,
            total_count::INTEGER
        INTO v_percentile, v_rank, v_total
        FROM ranked_data
        WHERE net_worth = user_net_worth
        LIMIT 1;
    ELSE
        v_uses_seed := false;

        WITH real_data AS (
            SELECT DISTINCT ON (ud.user_id) nw.net_worth
            FROM net_worth_snapshots nw
            JOIN user_demographics ud ON nw.user_id = ud.user_id
            WHERE ud.age_bracket = p_age_bracket AND ud.percentile_opt_in = true
            ORDER BY ud.user_id, nw.snapshot_date DESC
        ),
        ranked_data AS (
            SELECT
                net_worth,
                ROW_NUMBER() OVER (ORDER BY net_worth DESC) as rank_num,
                COUNT(*) OVER () as total_count
            FROM real_data
        )
        SELECT
            ROUND(((total_count - rank_num)::NUMERIC / NULLIF(total_count - 1, 0)) * 100, 2),
            rank_num::INTEGER,
            total_count::INTEGER
        INTO v_percentile, v_rank, v_total
        FROM ranked_data
        WHERE net_worth = user_net_worth
        LIMIT 1;
    END IF;

    WITH milestone_thresholds AS (
        SELECT * FROM (VALUES
            ('top_50', 50), ('top_25', 75), ('top_10', 90), ('top_5', 95), ('top_1', 99)
        ) AS t(milestone_name, percentile_threshold)
    )
    SELECT mt.milestone_name,
        CASE
            WHEN v_uses_seed THEN (
                SELECT psd.net_worth FROM percentile_seed_data psd
                WHERE psd.age_bracket = p_age_bracket AND psd.percentile >= mt.percentile_threshold
                ORDER BY psd.percentile ASC LIMIT 1
            )
            ELSE (
                SELECT net_worth FROM (
                    SELECT DISTINCT ON (ud.user_id) nw.net_worth
                    FROM net_worth_snapshots nw
                    JOIN user_demographics ud ON nw.user_id = ud.user_id
                    WHERE ud.age_bracket = p_age_bracket AND ud.percentile_opt_in = true
                    ORDER BY ud.user_id, nw.snapshot_date DESC
                ) real_users
                ORDER BY net_worth DESC
                LIMIT 1 OFFSET ((v_total * (100 - mt.percentile_threshold)::NUMERIC / 100)::INTEGER)
            )
        END
    INTO next_milestone, next_milestone_nw
    FROM milestone_thresholds mt
    WHERE mt.percentile_threshold > COALESCE(v_percentile, 0)
    ORDER BY mt.percentile_threshold ASC LIMIT 1;

    RETURN QUERY SELECT v_percentile, v_rank, v_total, v_uses_seed, next_milestone, next_milestone_nw;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. DAILY CRON JOB
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_daily_percentiles()
RETURNS void AS $$
DECLARE
    bracket TEXT;
    brackets TEXT[] := ARRAY['18-21', '22-25', '26-28', '29-32', '33-35', '36-40', '41+'];
    user_record RECORD;
    percentile_result RECORD;
    current_nw NUMERIC;
BEGIN
    FOREACH bracket IN ARRAY brackets LOOP
        FOR user_record IN
            SELECT ud.user_id, ud.age_bracket
            FROM user_demographics ud
            WHERE ud.age_bracket = bracket AND ud.percentile_opt_in = true
        LOOP
            SELECT * INTO percentile_result
            FROM calculate_percentile_hybrid(user_record.user_id, user_record.age_bracket);

            CONTINUE WHEN percentile_result.percentile IS NULL;

            SELECT net_worth INTO current_nw
            FROM net_worth_snapshots
            WHERE user_id = user_record.user_id
            ORDER BY snapshot_date DESC LIMIT 1;

            INSERT INTO percentile_snapshots (
                user_id, snapshot_date, age_bracket, percentile,
                rank_position, total_users, net_worth, uses_seed_data
            ) VALUES (
                user_record.user_id, CURRENT_DATE, user_record.age_bracket,
                percentile_result.percentile, percentile_result.rank_position,
                percentile_result.total_users, current_nw, percentile_result.uses_seed_data
            ) ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
                percentile = EXCLUDED.percentile,
                rank_position = EXCLUDED.rank_position,
                total_users = EXCLUDED.total_users,
                net_worth = EXCLUDED.net_worth,
                uses_seed_data = EXCLUDED.uses_seed_data;

            UPDATE user_demographics
            SET last_percentile_calculation = NOW(), uses_seed_data = percentile_result.uses_seed_data
            WHERE user_id = user_record.user_id;

            -- Check milestones
            IF percentile_result.percentile >= 50 THEN
                INSERT INTO percentile_milestones (user_id, milestone_type, age_bracket, net_worth_at_achievement, percentile_at_achievement)
                VALUES (user_record.user_id, 'top_50', user_record.age_bracket, current_nw, percentile_result.percentile)
                ON CONFLICT (user_id, milestone_type) DO NOTHING;
            END IF;
            IF percentile_result.percentile >= 75 THEN
                INSERT INTO percentile_milestones (user_id, milestone_type, age_bracket, net_worth_at_achievement, percentile_at_achievement)
                VALUES (user_record.user_id, 'top_25', user_record.age_bracket, current_nw, percentile_result.percentile)
                ON CONFLICT (user_id, milestone_type) DO NOTHING;
            END IF;
            IF percentile_result.percentile >= 90 THEN
                INSERT INTO percentile_milestones (user_id, milestone_type, age_bracket, net_worth_at_achievement, percentile_at_achievement)
                VALUES (user_record.user_id, 'top_10', user_record.age_bracket, current_nw, percentile_result.percentile)
                ON CONFLICT (user_id, milestone_type) DO NOTHING;
            END IF;
            IF percentile_result.percentile >= 95 THEN
                INSERT INTO percentile_milestones (user_id, milestone_type, age_bracket, net_worth_at_achievement, percentile_at_achievement)
                VALUES (user_record.user_id, 'top_5', user_record.age_bracket, current_nw, percentile_result.percentile)
                ON CONFLICT (user_id, milestone_type) DO NOTHING;
            END IF;
            IF percentile_result.percentile >= 99 THEN
                INSERT INTO percentile_milestones (user_id, milestone_type, age_bracket, net_worth_at_achievement, percentile_at_achievement)
                VALUES (user_record.user_id, 'top_1', user_record.age_bracket, current_nw, percentile_result.percentile)
                ON CONFLICT (user_id, milestone_type) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule the cron job (run daily at 1 AM UTC)
-- NOTE: Requires pg_cron extension to be enabled in Supabase Dashboard
-- SELECT cron.schedule('calculate-daily-percentiles', '0 1 * * *', 'SELECT calculate_daily_percentiles();');
