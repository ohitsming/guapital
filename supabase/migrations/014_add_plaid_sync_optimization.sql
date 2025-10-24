-- Migration: Add Plaid Sync Optimization Columns
-- Purpose: Enable cost-efficient syncing with smart caching and quota management
-- Date: 2025-01-XX

-- Add columns to plaid_items for sync optimization
ALTER TABLE plaid_items
ADD COLUMN IF NOT EXISTS sync_count_daily INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sync_count_reset_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_successful_sync_at TIMESTAMPTZ;

-- Add columns to plaid_accounts for balance caching
ALTER TABLE plaid_accounts
ADD COLUMN IF NOT EXISTS last_balance_sync_at TIMESTAMPTZ;

-- Add comment explaining the columns
COMMENT ON COLUMN plaid_items.sync_count_daily IS 'Number of manual syncs performed today (resets daily)';
COMMENT ON COLUMN plaid_items.sync_count_reset_at IS 'Timestamp when daily sync count was last reset';
COMMENT ON COLUMN plaid_items.last_successful_sync_at IS 'Last time a successful sync completed (for 24hr caching)';
COMMENT ON COLUMN plaid_accounts.last_balance_sync_at IS 'Last time account balance was synced from Plaid';

-- Create function to check if sync is needed (24-hour cache)
CREATE OR REPLACE FUNCTION should_sync_plaid_item(item_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    last_sync TIMESTAMPTZ;
    hours_since_sync NUMERIC;
BEGIN
    -- Get last successful sync time
    SELECT last_successful_sync_at INTO last_sync
    FROM plaid_items
    WHERE id = item_id;

    -- If never synced, always sync
    IF last_sync IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Calculate hours since last sync
    hours_since_sync := EXTRACT(EPOCH FROM (NOW() - last_sync)) / 3600;

    -- Sync if more than 24 hours have passed
    RETURN hours_since_sync >= 24;
END;
$$;

-- Create function to check sync quota (based on subscription tier)
CREATE OR REPLACE FUNCTION check_sync_quota(p_user_id UUID, p_tier TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    total_syncs INTEGER;
    daily_limit INTEGER;
BEGIN
    -- Set daily limits based on tier
    daily_limit := CASE
        WHEN p_tier = 'free' THEN 3
        WHEN p_tier = 'premium' THEN 7
        ELSE 3 -- default to free tier
    END CASE;

    -- Count syncs for all items belonging to user today
    SELECT COALESCE(SUM(sync_count_daily), 0) INTO total_syncs
    FROM plaid_items
    WHERE user_id = p_user_id
      AND sync_count_reset_at >= CURRENT_DATE;

    -- Check if under quota
    RETURN total_syncs < daily_limit;
END;
$$;

-- Create function to increment sync counter
CREATE OR REPLACE FUNCTION increment_sync_counter(item_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE plaid_items
    SET
        sync_count_daily = CASE
            WHEN sync_count_reset_at < CURRENT_DATE THEN 1
            ELSE sync_count_daily + 1
        END,
        sync_count_reset_at = CASE
            WHEN sync_count_reset_at < CURRENT_DATE THEN NOW()
            ELSE sync_count_reset_at
        END,
        last_successful_sync_at = NOW(),
        last_sync_at = NOW()
    WHERE id = item_id;
END;
$$;

-- Create index for faster sync queries
CREATE INDEX IF NOT EXISTS idx_plaid_items_last_sync
    ON plaid_items(last_successful_sync_at);
CREATE INDEX IF NOT EXISTS idx_plaid_items_user_sync_count
    ON plaid_items(user_id, sync_count_reset_at);

-- Backfill existing data
UPDATE plaid_items
SET last_successful_sync_at = last_sync_at
WHERE last_successful_sync_at IS NULL AND last_sync_at IS NOT NULL;
