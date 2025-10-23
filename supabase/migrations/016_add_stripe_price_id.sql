-- Add stripe_price_id column to track which price tier user subscribed to
-- This is needed to track founding members (first 1,000 users at $79/year)

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Add index for performance when querying founding members
CREATE INDEX IF NOT EXISTS idx_user_settings_stripe_price_id
ON user_settings(stripe_price_id);

-- Add comment for documentation
COMMENT ON COLUMN user_settings.stripe_price_id IS 'Stripe Price ID that the user subscribed to (used to track founding members)';
