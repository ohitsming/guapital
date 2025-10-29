-- =====================================================
-- ADD LOAN TERM TRACKING FOR LIABILITIES
-- =====================================================
-- This migration adds loan_term_years and interest_rate columns
-- to manual_assets table for accurate liability repayment tracking
--
-- Defaults are defined in src/lib/config/growth-rates.ts and applied
-- at runtime when these fields are NULL.
--
-- Created: October 2025
-- Related: Trajectory feature - liability repayment projections
-- =====================================================

-- Add loan_term_years column (NULL for assets, optional for liabilities)
-- When NULL, defaults from growth-rates.ts config are used
ALTER TABLE manual_assets
ADD COLUMN IF NOT EXISTS loan_term_years INTEGER CHECK (loan_term_years IS NULL OR loan_term_years >= 0);

-- Add interest_rate column (stored as decimal, e.g., 0.06 = 6%)
-- When NULL, defaults from growth-rates.ts config are used
ALTER TABLE manual_assets
ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5,4) CHECK (interest_rate IS NULL OR (interest_rate >= 0 AND interest_rate <= 1));

-- Add comments
COMMENT ON COLUMN manual_assets.loan_term_years IS 'Loan term in years (for liabilities only). NULL or 0 for revolving credit (credit cards). When NULL, defaults from config are used. Users can customize.';
COMMENT ON COLUMN manual_assets.interest_rate IS 'Annual interest rate as decimal (e.g., 0.06 = 6%). When NULL, defaults from config are used. Users can customize.';
