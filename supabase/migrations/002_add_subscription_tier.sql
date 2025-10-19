-- Add subscription tier and status to user_settings table
-- This migration adds columns to track user subscription information

-- Create enum for subscription tiers
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'pro');

-- Create enum for subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');

-- Add subscription columns to user_settings table
ALTER TABLE user_settings
ADD COLUMN subscription_tier subscription_tier DEFAULT 'free' NOT NULL,
ADD COLUMN subscription_status subscription_status DEFAULT 'active' NOT NULL,
ADD COLUMN subscription_start_date TIMESTAMPTZ,
ADD COLUMN subscription_end_date TIMESTAMPTZ,
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT;

-- Add indexes for performance
CREATE INDEX idx_user_settings_subscription_tier ON user_settings(subscription_tier);
CREATE INDEX idx_user_settings_subscription_status ON user_settings(subscription_status);
CREATE INDEX idx_user_settings_stripe_customer ON user_settings(stripe_customer_id);

-- Add comment for documentation
COMMENT ON COLUMN user_settings.subscription_tier IS 'User subscription tier: free, premium, or pro';
COMMENT ON COLUMN user_settings.subscription_status IS 'Current subscription status: active, canceled, past_due, or trialing';
COMMENT ON COLUMN user_settings.subscription_start_date IS 'Date when the current subscription started';
COMMENT ON COLUMN user_settings.subscription_end_date IS 'Date when the subscription ends or ended';
COMMENT ON COLUMN user_settings.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN user_settings.stripe_subscription_id IS 'Stripe subscription ID for the active subscription';
