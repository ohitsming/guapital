-- Migration: Add Soft Delete Support for Plaid Accounts
-- Purpose: Preserve transaction history when user downgrades from Premium to Free
-- Business logic: Auto-convert Plaid accounts to manual assets on downgrade
-- Date: 2025-01-XX

-- Add soft delete columns to plaid_accounts
ALTER TABLE plaid_accounts
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS converted_to_manual_asset_id UUID REFERENCES manual_assets(id) ON DELETE SET NULL;

COMMENT ON COLUMN plaid_accounts.is_active IS 'TRUE = active syncing account, FALSE = converted to manual (preserves transaction history)';
COMMENT ON COLUMN plaid_accounts.converted_to_manual_asset_id IS 'ID of manual asset this Plaid account was converted to (if applicable)';

-- Create index for filtering active accounts
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_is_active
  ON plaid_accounts(user_id, is_active);

-- Update RLS policies to only show active accounts by default
DROP POLICY IF EXISTS "Users can view their own plaid accounts" ON plaid_accounts;

CREATE POLICY "Users can view their own active plaid accounts"
  ON plaid_accounts
  FOR SELECT
  USING (auth.uid() = user_id AND is_active = TRUE);

-- Create separate policy for viewing inactive accounts (for transaction history)
CREATE POLICY "Users can view their own inactive plaid accounts"
  ON plaid_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add column to manual_assets to track conversion source
ALTER TABLE manual_assets
ADD COLUMN IF NOT EXISTS converted_from_plaid_account_id UUID REFERENCES plaid_accounts(id) ON DELETE SET NULL;

COMMENT ON COLUMN manual_assets.converted_from_plaid_account_id IS 'ID of Plaid account this manual asset was converted from (if applicable)';

-- Create view for active Plaid accounts (commonly used in queries)
CREATE OR REPLACE VIEW active_plaid_accounts AS
SELECT *
FROM plaid_accounts
WHERE is_active = TRUE;

COMMENT ON VIEW active_plaid_accounts IS 'Only shows actively syncing Plaid accounts (excludes converted ones)';

-- Backfill existing data: mark all existing accounts as active
UPDATE plaid_accounts
SET is_active = TRUE
WHERE is_active IS NULL;
