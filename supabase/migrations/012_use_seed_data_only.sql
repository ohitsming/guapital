-- Update percentile calculation to use ONLY SCF seed data
-- This ensures consistent, reliable percentile rankings based on Federal Reserve data
-- Removes the hybrid approach that was mixing real users with seed data

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
    user_net_worth NUMERIC;
    v_percentile NUMERIC;
    next_milestone TEXT;
    next_milestone_nw NUMERIC;
    lower_percentile INTEGER;
    lower_net_worth NUMERIC;
    upper_percentile INTEGER;
    upper_net_worth NUMERIC;
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

    -- =============================================
    -- Calculate percentile using ONLY seed data
    -- Uses linear interpolation between data points
    -- =============================================

    -- Find the two seed data points that bracket the user's net worth
    WITH seed_points AS (
        SELECT
            psd.percentile,
            psd.net_worth,
            LAG(psd.percentile) OVER (ORDER BY psd.net_worth) as prev_percentile,
            LAG(psd.net_worth) OVER (ORDER BY psd.net_worth) as prev_net_worth,
            LEAD(psd.percentile) OVER (ORDER BY psd.net_worth) as next_percentile,
            LEAD(psd.net_worth) OVER (ORDER BY psd.net_worth) as next_net_worth
        FROM percentile_seed_data psd
        WHERE psd.age_bracket = p_age_bracket
          AND psd.source = 'SCF_2022'
    )
    SELECT
        CASE
            -- User is below the lowest data point (10th percentile)
            WHEN user_net_worth < (SELECT MIN(psd.net_worth) FROM percentile_seed_data psd WHERE psd.age_bracket = p_age_bracket) THEN
                (SELECT MIN(psd.percentile) FROM percentile_seed_data psd WHERE psd.age_bracket = p_age_bracket)::NUMERIC

            -- User is above the highest data point (99th percentile)
            WHEN user_net_worth > (SELECT MAX(psd.net_worth) FROM percentile_seed_data psd WHERE psd.age_bracket = p_age_bracket) THEN
                (SELECT MAX(psd.percentile) FROM percentile_seed_data psd WHERE psd.age_bracket = p_age_bracket)::NUMERIC

            -- User falls between two data points - interpolate
            ELSE (
                SELECT
                    sp.prev_percentile +
                    ((user_net_worth - sp.prev_net_worth) / NULLIF(sp.net_worth - sp.prev_net_worth, 0)) *
                    (sp.percentile - sp.prev_percentile)
                FROM seed_points sp
                WHERE user_net_worth >= sp.prev_net_worth
                  AND user_net_worth <= sp.net_worth
                  AND sp.prev_net_worth IS NOT NULL
                LIMIT 1
            )
        END
    INTO v_percentile;

    -- Round to 2 decimal places
    v_percentile := ROUND(v_percentile, 2);

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
        psd.net_worth
    INTO next_milestone, next_milestone_nw
    FROM milestone_thresholds mt
    LEFT JOIN percentile_seed_data psd ON
        psd.age_bracket = p_age_bracket
        AND psd.percentile >= mt.percentile_threshold
    WHERE mt.percentile_threshold > COALESCE(v_percentile, 0)
    ORDER BY mt.percentile_threshold ASC, psd.percentile ASC
    LIMIT 1;

    -- Return the result
    -- Note: rank_position and total_users are NULL since we're using seed data only
    RETURN QUERY SELECT
        v_percentile,
        NULL::INTEGER as rank_position,
        NULL::INTEGER as total_users,
        true as uses_seed_data,
        next_milestone,
        next_milestone_nw;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_percentile_hybrid IS 'Calculates user percentile rank using ONLY SCF 2022 seed data with linear interpolation. Provides consistent, reliable rankings based on Federal Reserve Survey of Consumer Finances data. Returns percentile, next milestone info, and always sets uses_seed_data=true.';
