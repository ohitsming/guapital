-- =====================================================
-- ADD PERCENTILE CONSENT TIMESTAMP FOR GDPR COMPLIANCE
-- =====================================================
-- This migration adds a consent timestamp column to track
-- when users opted into percentile ranking, required for
-- GDPR audit trail and compliance.
--
-- Created: January 2025
-- Compliance: GDPR Article 7 (Consent)
-- =====================================================

-- Add consent timestamp column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_demographics'
        AND column_name = 'percentile_consent_timestamp'
    ) THEN
        ALTER TABLE user_demographics
        ADD COLUMN percentile_consent_timestamp TIMESTAMPTZ;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN user_demographics.percentile_consent_timestamp IS 'GDPR compliance: Timestamp when user explicitly consented to percentile ranking feature';

-- Update existing opted-in users to have consent timestamp (backfill)
-- Set to updated_at if available, otherwise created_at as best guess
UPDATE user_demographics
SET percentile_consent_timestamp = COALESCE(updated_at, created_at)
WHERE percentile_opt_in = true
  AND percentile_consent_timestamp IS NULL;
