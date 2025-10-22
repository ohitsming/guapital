-- Fix RLS policy for user_demographics to allow proper updates
-- The original policy was missing WITH CHECK clause, causing age_bracket updates to be blocked

DROP POLICY IF EXISTS "Users can update own user_demographics" ON user_demographics;

CREATE POLICY "Users can update own user_demographics" ON user_demographics
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also ensure the INSERT policy has WITH CHECK (belt and suspenders)
DROP POLICY IF EXISTS "Users can insert own user_demographics" ON user_demographics;

CREATE POLICY "Users can insert own user_demographics" ON user_demographics
FOR INSERT
WITH CHECK (auth.uid() = user_id);
