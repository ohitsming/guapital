-- Create a SECURITY DEFINER function to handle opt-in that bypasses RLS
-- This is needed because RLS policies are preventing age_bracket updates

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
    -- Check if record exists
    SELECT EXISTS(
        SELECT 1 FROM user_demographics WHERE user_id = p_user_id
    ) INTO v_exists;

    IF v_exists THEN
        -- Update existing record
        UPDATE user_demographics
        SET
            age_bracket = p_age_bracket,
            date_of_birth = p_date_of_birth,
            percentile_opt_in = true,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        -- Insert new record
        INSERT INTO user_demographics (user_id, age_bracket, date_of_birth, percentile_opt_in)
        VALUES (p_user_id, p_age_bracket, p_date_of_birth, true);
    END IF;

    -- Return the updated/inserted data
    RETURN QUERY
    SELECT
        true as success,
        ud.age_bracket,
        ud.percentile_opt_in
    FROM user_demographics ud
    WHERE ud.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION opt_in_percentile_tracking IS 'Handles percentile ranking opt-in by updating/inserting user_demographics. Uses SECURITY DEFINER to bypass RLS restrictions.';
