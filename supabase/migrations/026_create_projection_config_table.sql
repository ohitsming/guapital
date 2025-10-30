-- =====================================================
-- ACCOUNT PROJECTION CONFIG TABLE
-- =====================================================
-- This migration:
-- 1. Removes loan_term_years and interest_rate columns from manual_assets (added in 025)
-- 2. Removes loan_term_years and interest_rate columns from plaid_accounts (if they exist)
-- 3. Creates a separate account_projection_config table for clean separation of concerns
--
-- This approach allows:
-- - Multiple projection scenarios per account
-- - Clean separation of account data vs projection assumptions
-- - Easy extensibility without schema changes
-- - Simple reset to defaults (delete config row)
--
-- Created: October 2025
-- Related: Trajectory feature - projection configuration
-- =====================================================

-- =====================================================
-- 1. REMOVE COLUMNS FROM ACCOUNT TABLES
-- =====================================================

-- Remove from manual_assets (undo migration 025)
ALTER TABLE manual_assets
DROP COLUMN IF EXISTS loan_term_years;

ALTER TABLE manual_assets
DROP COLUMN IF EXISTS interest_rate;

-- Remove from plaid_accounts (in case it was added)
ALTER TABLE plaid_accounts
DROP COLUMN IF EXISTS loan_term_years;

ALTER TABLE plaid_accounts
DROP COLUMN IF EXISTS interest_rate;

-- =====================================================
-- 2. CREATE ACCOUNT PROJECTION CONFIG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS account_projection_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Account identification (polymorphic reference)
  account_id UUID NOT NULL,
  account_source TEXT NOT NULL CHECK (account_source IN ('manual_assets', 'plaid_accounts', 'crypto_wallets')),

  -- User-customized projection settings
  -- When NULL, system defaults from growth-rates.ts are used
  custom_growth_rate NUMERIC(5,4) CHECK (custom_growth_rate IS NULL OR (custom_growth_rate >= -1 AND custom_growth_rate <= 1)),
  custom_loan_term_years INTEGER CHECK (custom_loan_term_years IS NULL OR custom_loan_term_years >= 0),

  -- Scenario support (for future Phase 2+ features)
  scenario_name TEXT DEFAULT 'default',

  -- Optional metadata
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one config per account per scenario
  UNIQUE(user_id, account_id, account_source, scenario_name)
);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_account_projection_config_user_id
  ON account_projection_config(user_id);

CREATE INDEX idx_account_projection_config_account
  ON account_projection_config(user_id, account_id, account_source);

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE account_projection_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projection config"
  ON account_projection_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projection config"
  ON account_projection_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projection config"
  ON account_projection_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projection config"
  ON account_projection_config FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. COMMENTS
-- =====================================================

COMMENT ON TABLE account_projection_config IS
  'Stores user-customized projection settings for trajectory calculations. Separate from core account tables for clean architecture and extensibility.';

COMMENT ON COLUMN account_projection_config.account_id IS
  'Foreign key to the account (manual_assets.id, plaid_accounts.id, or crypto_wallets.id)';

COMMENT ON COLUMN account_projection_config.account_source IS
  'Which table the account_id references (manual_assets, plaid_accounts, or crypto_wallets)';

COMMENT ON COLUMN account_projection_config.custom_growth_rate IS
  'User-customized annual growth/interest rate as decimal (e.g., 0.07 = 7%). NULL = use system defaults. For liabilities, this is the interest rate.';

COMMENT ON COLUMN account_projection_config.custom_loan_term_years IS
  'User-customized loan term in years (for liabilities only). NULL = use system defaults. 0 = revolving credit.';

COMMENT ON COLUMN account_projection_config.scenario_name IS
  'Projection scenario name (default, conservative, aggressive, custom). Enables multiple what-if scenarios per account.';

COMMENT ON COLUMN account_projection_config.notes IS
  'Optional user notes about their projection assumptions.';
