-- Create support_requests table for user feedback and support tickets
-- This table stores all support requests submitted through the dashboard

CREATE TABLE IF NOT EXISTS public.support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'account', 'question', 'other')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON public.support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON public.support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON public.support_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own support requests
CREATE POLICY "Users can view own support requests"
    ON public.support_requests
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own support requests
CREATE POLICY "Users can create own support requests"
    ON public.support_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own support requests (if needed for future features)
CREATE POLICY "Users can update own support requests"
    ON public.support_requests
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_support_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_requests_updated_at
    BEFORE UPDATE ON public.support_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_support_requests_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.support_requests TO authenticated;
