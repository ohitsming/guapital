-- Migration: Improve Webhook Idempotency and Error Handling
-- Purpose: Prevent duplicate webhook processing and improve reliability
-- Date: 2025-01-XX

-- Add event_id column to track unique webhook events from Plaid
ALTER TABLE webhook_event_log
ADD COLUMN IF NOT EXISTS event_id TEXT;

-- Add retry_count to track webhook retry attempts
ALTER TABLE webhook_event_log
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Add status column to track processing state
ALTER TABLE webhook_event_log
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Create composite unique index for idempotency
-- Multiple webhooks with same type+code+item_id can arrive, but should be deduplicated
CREATE INDEX IF NOT EXISTS idx_webhook_event_log_idempotency
  ON webhook_event_log(webhook_type, webhook_code, item_id, received_at);

-- Add index on event_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_event_log_event_id
  ON webhook_event_log(event_id) WHERE event_id IS NOT NULL;

-- Add index on status for monitoring
CREATE INDEX IF NOT EXISTS idx_webhook_event_log_status
  ON webhook_event_log(status) WHERE status != 'completed';

COMMENT ON COLUMN webhook_event_log.event_id IS 'Unique event ID from webhook provider (if available)';
COMMENT ON COLUMN webhook_event_log.retry_count IS 'Number of times this webhook was retried by the provider';
COMMENT ON COLUMN webhook_event_log.status IS 'Processing status: pending, processing, completed, failed';
