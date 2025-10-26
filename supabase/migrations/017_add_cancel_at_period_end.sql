-- Add cancel_at_period_end flag to user_settings
-- This tracks subscriptions that are scheduled to cancel at the end of the billing period

ALTER TABLE user_settings
ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for querying canceling subscriptions
CREATE INDEX idx_user_settings_cancel_at_period_end ON user_settings(cancel_at_period_end) WHERE cancel_at_period_end = true;

-- Add comment for documentation
COMMENT ON COLUMN user_settings.cancel_at_period_end IS 'True if subscription is scheduled to cancel at end of current period (Stripe cancel_at_period_end)';
