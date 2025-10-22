-- Fix the age_bracket trigger to allow manual selection without date_of_birth
-- The original trigger always overwrote age_bracket based on date_of_birth,
-- but for percentile ranking we need to support manual age bracket selection

-- Drop the old trigger
DROP TRIGGER IF EXISTS trigger_update_age_bracket ON user_demographics;

-- Create updated function that only updates age_bracket if date_of_birth is provided
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

-- Recreate the trigger (now it won't overwrite manual age_bracket values)
CREATE TRIGGER trigger_update_age_bracket
BEFORE INSERT OR UPDATE OF date_of_birth ON user_demographics
FOR EACH ROW
EXECUTE FUNCTION update_age_bracket();

COMMENT ON FUNCTION update_age_bracket() IS 'Auto-calculates age_bracket from date_of_birth if provided. Allows manual age_bracket selection when date_of_birth is null.';
