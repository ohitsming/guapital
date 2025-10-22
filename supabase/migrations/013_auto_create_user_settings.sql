-- Auto-create user_settings row on user signup
-- This migration updates the handle_new_user() trigger to also create user_settings

-- Update the handle_new_user function to create user_profiles, user_settings, AND user_demographics
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO public.user_profiles (id, email, full_name, onboarding)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        false
    );

    -- Create user settings with default values
    INSERT INTO public.user_settings (user_id, default_currency, email_notifications, subscription_tier, subscription_status)
    VALUES (
        NEW.id,
        'USD',
        true,
        'free',
        'active'
    );

    -- Create user demographics (opt_in_rankings defaults to false)
    INSERT INTO public.user_demographics (user_id, opt_in_rankings)
    VALUES (
        NEW.id,
        false
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill user_settings for existing users who don't have a row yet
INSERT INTO user_settings (user_id, default_currency, email_notifications, subscription_tier, subscription_status)
SELECT
    id,
    'USD',
    true,
    'free',
    'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Backfill user_demographics for existing users who don't have a row yet
INSERT INTO user_demographics (user_id, opt_in_rankings)
SELECT
    id,
    false
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_demographics)
ON CONFLICT (user_id) DO NOTHING;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user_profiles, user_settings, and user_demographics rows when a new user signs up';
