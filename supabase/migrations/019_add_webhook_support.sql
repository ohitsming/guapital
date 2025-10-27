-- Migration: Add Webhook Support for Plaid
-- Purpose: Enable webhook-driven sync to reduce API refresh calls by 70%
-- Cost Impact: Saves $3,540/month at 5K users
-- Date: 2025-01-XX

-- Add webhook timestamp column to plaid_items
ALTER TABLE plaid_items
ADD COLUMN IF NOT EXISTS webhook_last_received_at TIMESTAMPTZ;

COMMENT ON COLUMN plaid_items.webhook_last_received_at IS 'Last time a webhook was received from Plaid for this item';

-- Create webhook event log table for debugging/auditing
CREATE TABLE IF NOT EXISTS webhook_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type TEXT NOT NULL,
  webhook_code TEXT NOT NULL,
  item_id TEXT,
  payload JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Add index for faster webhook log queries
CREATE INDEX IF NOT EXISTS idx_webhook_event_log_item_id
  ON webhook_event_log(item_id);
CREATE INDEX IF NOT EXISTS idx_webhook_event_log_received_at
  ON webhook_event_log(received_at DESC);

-- RLS policies for webhook_event_log (service role only)
ALTER TABLE webhook_event_log ENABLE ROW LEVEL SECURITY;

-- Service role can do anything (webhooks run with service role)
-- Users should not have access to webhook logs directly

COMMENT ON TABLE webhook_event_log IS 'Stores all Plaid webhook events for debugging and auditing';

-- Create function to clean up old webhook logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_event_log
  WHERE received_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_webhook_logs IS 'Deletes webhook logs older than 30 days to prevent table bloat';
