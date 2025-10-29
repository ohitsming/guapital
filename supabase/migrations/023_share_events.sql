-- Migration: Add social sharing events tracking
-- Purpose: Track share events for viral coefficient calculation and analytics
-- Created: 2025-01-27

-- Create share_events table
CREATE TABLE IF NOT EXISTS public.share_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event tracking
  event_type TEXT NOT NULL CHECK (event_type IN ('initiated', 'completed', 'clicked')),
  share_type TEXT NOT NULL CHECK (share_type IN ('static', 'progress', 'annual', 'milestone', 'streak')),
  platform TEXT CHECK (platform IN ('twitter', 'linkedin', 'instagram', 'reddit', 'copy_link')),

  -- Share data (static)
  percentile INTEGER CHECK (percentile >= 0 AND percentile <= 100),
  percentile_precise DECIMAL(5,2) CHECK (percentile_precise >= 0 AND percentile_precise <= 100),
  age INTEGER CHECK (age >= 18 AND age <= 100),

  -- Progress data (null for static shares)
  start_percentile INTEGER CHECK (start_percentile >= 0 AND start_percentile <= 100),
  end_percentile INTEGER CHECK (end_percentile >= 0 AND end_percentile <= 100),
  delta_percentile DECIMAL(5,2),
  time_period TEXT CHECK (time_period IN ('1mo', '3mo', '6mo', '12mo')),
  net_worth_growth BIGINT,

  -- Privacy settings
  included_net_worth BOOLEAN DEFAULT false,
  anonymous BOOLEAN DEFAULT false,

  -- A/B testing
  share_card_variant TEXT CHECK (share_card_variant IN ('minimalist', 'dataviz', 'badge')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT progress_share_has_delta CHECK (
    share_type != 'progress' OR (
      start_percentile IS NOT NULL AND
      end_percentile IS NOT NULL AND
      delta_percentile IS NOT NULL AND
      time_period IS NOT NULL
    )
  )
);

-- Add comment
COMMENT ON TABLE public.share_events IS 'Tracks social sharing events for analytics and viral coefficient calculation';

-- Create indexes for common queries
CREATE INDEX idx_share_events_user_time ON public.share_events(user_id, created_at DESC);
CREATE INDEX idx_share_events_type ON public.share_events(share_type, event_type);
CREATE INDEX idx_share_events_platform ON public.share_events(platform) WHERE platform IS NOT NULL;
CREATE INDEX idx_share_events_created_at ON public.share_events(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own share events
CREATE POLICY "Users can view own share events"
  ON public.share_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own share events
CREATE POLICY "Users can insert own share events"
  ON public.share_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can view all share events (for analytics)
CREATE POLICY "Service role can view all share events"
  ON public.share_events
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT ON public.share_events TO authenticated;
GRANT ALL ON public.share_events TO service_role;
