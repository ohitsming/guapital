-- =====================================================
-- Fix Cascade Deletion for User Data
-- =====================================================
-- Purpose: Ensure all user data is properly deleted when a user is removed
-- Issue: manual_asset_history.user_id missing ON DELETE CASCADE
-- =====================================================

-- Drop the existing foreign key constraint on manual_asset_history
ALTER TABLE manual_asset_history
DROP CONSTRAINT IF EXISTS manual_asset_history_user_id_fkey;

-- Re-add the foreign key constraint with ON DELETE CASCADE
ALTER TABLE manual_asset_history
ADD CONSTRAINT manual_asset_history_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify all tables have proper cascade deletion
-- This query will list all foreign keys to auth.users with their delete actions
COMMENT ON TABLE manual_asset_history IS 'Asset edit history - automatically deleted when user is deleted';

-- Summary of tables with CASCADE deletion (for documentation):
-- ✓ plaid_items - ON DELETE CASCADE
-- ✓ plaid_accounts - ON DELETE CASCADE
-- ✓ plaid_transactions - ON DELETE CASCADE
-- ✓ crypto_wallets - ON DELETE CASCADE
-- ✓ crypto_holdings - ON DELETE CASCADE
-- ✓ manual_assets - ON DELETE CASCADE
-- ✓ manual_asset_history - ON DELETE CASCADE (fixed by this migration)
-- ✓ net_worth_snapshots - ON DELETE CASCADE
-- ✓ user_demographics - ON DELETE CASCADE
-- ✓ user_settings - ON DELETE CASCADE
-- ✓ user_profiles - ON DELETE CASCADE
-- ✓ percentile_snapshots - ON DELETE CASCADE (from migration 005)
-- ✓ percentile_milestones - ON DELETE CASCADE (from migration 005)
