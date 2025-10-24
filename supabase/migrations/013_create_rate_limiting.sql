-- =====================================================
-- Rate Limiting System
-- =====================================================
-- Purpose: Track API request rates to prevent abuse
-- Implementation: Supabase-based (no external dependencies)
-- Categories: auth (strict), api (moderate), expensive (very strict)
-- =====================================================

-- Create rate_limit_attempts table
CREATE TABLE IF NOT EXISTS rate_limit_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identifier (IP address or authenticated user ID)
    identifier TEXT NOT NULL,

    -- Endpoint category (auth, api, expensive)
    endpoint_category TEXT NOT NULL CHECK (endpoint_category IN ('auth', 'api', 'expensive')),

    -- Request tracking
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one record per identifier + category combination
    UNIQUE(identifier, endpoint_category)
);

-- Indexes for fast lookups
CREATE INDEX idx_rate_limit_identifier ON rate_limit_attempts(identifier);
CREATE INDEX idx_rate_limit_category ON rate_limit_attempts(endpoint_category);
CREATE INDEX idx_rate_limit_window_start ON rate_limit_attempts(window_start);
CREATE INDEX idx_rate_limit_combo ON rate_limit_attempts(identifier, endpoint_category);

-- Enable RLS (rate limiting is system-level, not user-level)
ALTER TABLE rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed - this table is managed by service role only
-- Users should never directly access rate limit data

-- =====================================================
-- Rate Limit Check Function
-- =====================================================
-- Atomically checks and increments rate limit counter
-- Returns: { allowed: boolean, current_count: integer, window_start: timestamp }
-- =====================================================

CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
    p_identifier TEXT,
    p_category TEXT,
    p_window_seconds INTEGER,
    p_max_requests INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_record RECORD;
    v_window_expired BOOLEAN;
    v_allowed BOOLEAN;
    v_current_count INTEGER;
    v_window_start TIMESTAMPTZ;
BEGIN
    -- Try to get existing record
    SELECT * INTO v_record
    FROM rate_limit_attempts
    WHERE identifier = p_identifier
      AND endpoint_category = p_category;

    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO rate_limit_attempts (identifier, endpoint_category, request_count, window_start, last_request_at)
        VALUES (p_identifier, p_category, 1, NOW(), NOW())
        RETURNING request_count, window_start INTO v_current_count, v_window_start;

        RETURN json_build_object(
            'allowed', TRUE,
            'current_count', v_current_count,
            'window_start', v_window_start,
            'reset_at', v_window_start + (p_window_seconds || ' seconds')::INTERVAL
        );
    END IF;

    -- Check if window has expired
    v_window_expired := (NOW() - v_record.window_start) > (p_window_seconds || ' seconds')::INTERVAL;

    -- If window expired, reset the counter
    IF v_window_expired THEN
        UPDATE rate_limit_attempts
        SET request_count = 1,
            window_start = NOW(),
            last_request_at = NOW()
        WHERE identifier = p_identifier
          AND endpoint_category = p_category
        RETURNING request_count, window_start INTO v_current_count, v_window_start;

        RETURN json_build_object(
            'allowed', TRUE,
            'current_count', v_current_count,
            'window_start', v_window_start,
            'reset_at', v_window_start + (p_window_seconds || ' seconds')::INTERVAL
        );
    END IF;

    -- Window is still active, check if limit exceeded
    v_allowed := v_record.request_count < p_max_requests;

    -- Increment counter if allowed
    IF v_allowed THEN
        UPDATE rate_limit_attempts
        SET request_count = request_count + 1,
            last_request_at = NOW()
        WHERE identifier = p_identifier
          AND endpoint_category = p_category
        RETURNING request_count, window_start INTO v_current_count, v_window_start;
    ELSE
        -- Don't increment if already exceeded, just return current state
        v_current_count := v_record.request_count;
        v_window_start := v_record.window_start;
    END IF;

    RETURN json_build_object(
        'allowed', v_allowed,
        'current_count', v_current_count,
        'window_start', v_window_start,
        'reset_at', v_window_start + (p_window_seconds || ' seconds')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Cleanup Function
-- =====================================================
-- Removes old rate limit records to prevent table bloat
-- Run daily via pg_cron
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete records older than 24 hours
    DELETE FROM rate_limit_attempts
    WHERE last_request_at < NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- Log cleanup (optional - comment out if too verbose)
    RAISE NOTICE 'Cleaned up % old rate limit records', v_deleted_count;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Schedule Daily Cleanup (pg_cron)
-- =====================================================
-- Note: pg_cron extension must be enabled in Supabase
-- Dashboard → Database → Extensions → Enable pg_cron
-- =====================================================

-- Schedule cleanup daily at 3:00 AM UTC
SELECT cron.schedule(
    'cleanup-rate-limits',           -- Job name
    '0 3 * * *',                     -- Cron expression (3am UTC daily)
    'SELECT cleanup_old_rate_limits();'
);

-- =====================================================
-- Usage Example (for reference)
-- =====================================================
-- SELECT check_and_increment_rate_limit('192.168.1.1', 'api', 60, 300);
-- Returns: {"allowed": true, "current_count": 1, "window_start": "2025-10-23T...", "reset_at": "..."}
--
-- Rate limit configurations (set in src/lib/ratelimit.ts):
-- - auth: 5 requests per 15 minutes (900 seconds) - Prevent brute force
-- - api: 300 requests per 1 minute (60 seconds) - Allow ~20-40 page loads/min
-- - expensive: 10 requests per 1 hour (3600 seconds) - Limit costly operations
--
-- Why 300 req/min for API?
-- - Dashboard page load = ~7-9 API calls
-- - React Strict Mode doubles requests in dev
-- - Sufficient for normal usage without false positives
-- =====================================================
