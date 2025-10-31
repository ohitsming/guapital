-- Fix blog_posts RLS policy to use published_at instead of non-existent published column
-- The original migration used 'published' but the schema uses 'published_at'

-- Drop the old incorrect policy
DROP POLICY IF EXISTS "Public can read published blog posts" ON blog_posts;

-- Create corrected policy using published_at
CREATE POLICY "Public can read published blog posts"
  ON blog_posts
  FOR SELECT
  USING (published_at IS NOT NULL);

-- Note: The service role policy is correct and doesn't need changes
