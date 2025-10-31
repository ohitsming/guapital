-- Blog Posts Table for SEO-optimized content
-- Stores markdown content that will be rendered via SSG at build time

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown content
  author_id UUID REFERENCES auth.users(id),

  -- Publishing status
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- SEO fields
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,

  -- Analytics
  view_count INTEGER DEFAULT 0,

  -- Organization
  category TEXT,
  tags TEXT[],

  -- Reading time (auto-calculated from content length)
  reading_time_minutes INTEGER,

  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT valid_reading_time CHECK (reading_time_minutes > 0)
);

-- Indexes for performance
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts(category) WHERE published = true;
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags) WHERE published = true;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_blog_post_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_updated_at();

-- Auto-calculate reading time (average 200 words per minute)
CREATE OR REPLACE FUNCTION calculate_reading_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Count words in markdown content (rough estimate)
  NEW.reading_time_minutes = GREATEST(1, (
    LENGTH(REGEXP_REPLACE(NEW.content, '\s+', ' ', 'g')) / 5 / 200
  )::INTEGER);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_reading_time
  BEFORE INSERT OR UPDATE OF content ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_reading_time();

-- Row Level Security (RLS)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Public can read published blog posts"
  ON blog_posts
  FOR SELECT
  USING (published = true);

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role can manage all blog posts"
  ON blog_posts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Optional: Add author permissions (if you want multi-author support)
-- CREATE POLICY "Authors can manage their own posts"
--   ON blog_posts
--   FOR ALL
--   USING (auth.uid() = author_id)
--   WITH CHECK (auth.uid() = author_id);

-- View count increment function (called from API route)
CREATE OR REPLACE FUNCTION increment_blog_view_count(post_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE slug = post_slug AND published = true;
END;
$$;

-- Seed data: Example blog post for testing
INSERT INTO blog_posts (
  slug,
  title,
  description,
  content,
  published,
  published_at,
  category,
  tags,
  meta_title,
  meta_description
) VALUES (
  'welcome-to-guapital-blog',
  'Welcome to the Guapital Blog',
  'Learn about net worth tracking, financial independence, and wealth building strategies for young professionals.',
  '# Welcome to Guapital

We''re building the privacy-first net worth tracker for young adults. This blog will cover:

- **Net worth tracking strategies** - How to track assets across traditional investments, crypto, and more
- **Percentile rankings** - Where you stand compared to peers (our killer feature!)
- **Financial independence (FIRE)** - Calculating your path to financial freedom
- **Crypto & DeFi** - Tracking emerging assets traditional apps ignore

## Why We Built Guapital

Traditional finance apps like Mint and YNAB focus on budgeting and expense tracking. But if you''re a tech worker earning $100K+, you don''t need budget shame - you need **wealth-building tools**.

Guapital shows you:
- Your complete net worth across all asset classes
- Where you rank vs peers your age (top 10%? top 25%?)
- Your trajectory to financial independence

## What''s Next

Stay tuned for deep dives on:
- Net worth percentiles by age (with real Federal Reserve data)
- How to calculate your FIRE number
- Best practices for tracking crypto net worth

[Sign up for Guapital](/) to start tracking your net worth today.
',
  true,
  NOW(),
  'Announcements',
  ARRAY['product', 'launch', 'net-worth'],
  'Welcome to Guapital Blog - Net Worth Tracking & Financial Independence',
  'Learn about net worth tracking, percentile rankings, and FIRE strategies for young professionals. Privacy-first wealth building tools.'
);

COMMENT ON TABLE blog_posts IS 'SEO-optimized blog posts stored as markdown, rendered via SSG at build time';
COMMENT ON COLUMN blog_posts.content IS 'Markdown content - converted to HTML at build time for SEO';
COMMENT ON COLUMN blog_posts.reading_time_minutes IS 'Auto-calculated from content length (200 words/min average)';
