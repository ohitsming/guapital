-- =====================================================
-- ADD MONTHLY CONTRIBUTION TO PROJECTION CONFIG
-- =====================================================
-- This migration adds monthly_contribution field to support
-- per-account contribution tracking for more accurate FIRE
-- projections without requiring salary input (privacy win).
--
-- Created: October 2025
-- Related: Trajectory feature - monthly contribution tracking
-- =====================================================

-- =====================================================
-- 1. ADD MONTHLY CONTRIBUTION COLUMN
-- =====================================================

ALTER TABLE account_projection_config
ADD COLUMN monthly_contribution NUMERIC(10,2) DEFAULT 0 CHECK (monthly_contribution >= 0);

-- =====================================================
-- 2. COMMENTS
-- =====================================================

COMMENT ON COLUMN account_projection_config.monthly_contribution IS
  'Expected monthly contribution (assets) or payment (liabilities) in dollars. Defaults to 0. For liabilities, this overrides the calculated payment from loan terms. For assets, this represents ongoing deposits.';

-- =====================================================
-- 3. NOTES
-- =====================================================
-- For Assets: Represents monthly deposits (e.g., $1,916/mo to 401k)
-- For Liabilities: Overrides calculated payment if user pays extra
-- Default 0 means:
--   - Assets: No ongoing contributions (conservative projection)
--   - Liabilities: Use calculated payment from loan terms
-- =====================================================
