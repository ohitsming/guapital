-- Fix ambiguous column reference in calculate_percentile_hybrid function
-- The function has output parameters with the same names as variables, causing conflicts

DROP FUNCTION IF EXISTS calculate_percentile_hybrid(UUID, TEXT);

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

            -- SCF seed data
            SELECT
                NULL::UUID as user_id,
                psd.net_worth,
                'seed' as source
            FROM percentile_seed_data psd
            WHERE psd.age_bracket = p_age_bracket
              AND psd.source = 'SCF_2022'
        ),
        user_ranking AS (
            SELECT
                cd.user_id,
                cd.net_worth,
                cd.source,
                COUNT(*) FILTER (WHERE cd.net_worth < user_net_worth) as users_below,
                COUNT(*) as total_count,
                ROW_NUMBER() OVER (ORDER BY cd.net_worth DESC) as rank_num
            FROM combined_data cd
            GROUP BY cd.user_id, cd.net_worth, cd.source
        )
        SELECT
            ROUND((users_below::NUMERIC / NULLIF(total_count - 1, 0)) * 100, 2),
            rank_num::INTEGER,
            total_count::INTEGER,
            true
        INTO v_percentile, v_rank, v_total, v_uses_seed
        FROM user_ranking
        WHERE user_id = p_user_id OR (user_id IS NULL AND net_worth = user_net_worth)
        LIMIT 1;

    -- =============================================
    -- PHASE 2: Pure real data (>= 1000 users)
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
                ROW_NUMBER() OVER (ORDER BY rd.net_worth DESC) as rank_num
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
            ROUND((users_below::NUMERIC / NULLIF(total_count - 1, 0)) * 100, 2),
            rank_num::INTEGER,
            total_count::INTEGER,
            false
        INTO v_percentile, v_rank, v_total, v_uses_seed
        FROM user_ranking
        WHERE user_id = p_user_id;
    END IF;

    -- Calculate next milestone
    WITH milestone_thresholds AS (
        SELECT * FROM (VALUES
            ('top_50', 50),
            ('top_25', 75),
            ('top_10', 90),
            ('top_5', 95),
            ('top_1', 99)
        ) AS t(milestone_name, percentile_threshold)
    )
    SELECT
        mt.milestone_name,
        CASE
            WHEN v_uses_seed THEN (
                SELECT psd.net_worth
                FROM percentile_seed_data psd
                WHERE psd.age_bracket = p_age_bracket
                  AND psd.percentile >= mt.percentile_threshold
                ORDER BY psd.percentile ASC
                LIMIT 1
            )
            ELSE (
                SELECT nw.net_worth
                FROM net_worth_snapshots nw
                JOIN user_demographics ud ON nw.user_id = ud.user_id
                WHERE ud.age_bracket = p_age_bracket
                  AND ud.percentile_opt_in = true
                ORDER BY nw.net_worth DESC
                LIMIT 1 OFFSET (v_total * (100 - mt.percentile_threshold) / 100)
            )
        END
    INTO next_milestone, next_milestone_nw
    FROM milestone_thresholds mt
    WHERE mt.percentile_threshold > COALESCE(v_percentile, 0)
    ORDER BY mt.percentile_threshold ASC
    LIMIT 1;

    -- Return the result using explicit column aliases
    RETURN QUERY SELECT
        v_percentile,
        v_rank,
        v_total,
        v_uses_seed,
        next_milestone,
        next_milestone_nw;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_percentile_hybrid IS 'Calculates user percentile rank using hybrid approach: blends SCF seed data with real users when < 1000 users in bracket, transitions to pure real data at 1000+ users. Returns percentile, rank, total users, and next milestone.';
