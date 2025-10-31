# Blog Infrastructure - Database-Driven SSG with ISR

Complete documentation for Guapital's SEO-optimized blog system using Supabase + Next.js SSG + ISR.

## Architecture Overview

**Tech Stack:**
- **Storage:** Supabase `blog_posts` table (markdown content)
- **Rendering:** Next.js Static Site Generation (SSG) with Incremental Static Regeneration (ISR)
- **Markdown:** MDX (@mdx-js/react, existing packages)
- **SEO:** Sitemap, robots.txt, structured data, OpenGraph meta tags

**Key Benefits:**
- ✅ **Perfect SEO:** Server-rendered HTML, Google sees full content immediately
- ✅ **Fast performance:** CDN-served static pages (Lighthouse 100)
- ✅ **Flexible:** Database-driven, easy to publish/edit posts
- ✅ **ISR:** Auto-revalidates every hour, on-demand revalidation available

## Database Schema

### Table: `blog_posts`

```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,  -- Markdown content

  -- Publishing
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,

  -- Organization
  category TEXT,
  tags TEXT[],

  -- Analytics
  view_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER,  -- Auto-calculated

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_blog_posts_slug` - Fast lookup by slug
- `idx_blog_posts_published` - Published posts by date
- `idx_blog_posts_category` - Filter by category
- `idx_blog_posts_tags` - GIN index for tag searches

**Functions:**
- `increment_blog_view_count(slug)` - Atomic view counter
- `calculate_reading_time()` - Trigger: auto-calculates reading time (200 words/min)
- `update_blog_post_updated_at()` - Trigger: auto-updates `updated_at`

## File Structure

```
src/
├── app/
│   ├── blog/
│   │   ├── page.tsx              # Blog listing (SSG + ISR)
│   │   ├── [slug]/
│   │   │   └── page.tsx          # Blog post detail (SSG + ISR)
│   │   └── BlogPageContent.tsx   # Client component for listing
│   ├── api/
│   │   └── blog/
│   │       └── revalidate/
│   │           └── route.ts      # On-demand revalidation API
│   └── sitemap.ts                # Auto-generates sitemap with blog posts
├── components/
│   └── blog/
│       └── MDXContent.tsx        # Client-side MDX renderer
├── lib/
│   ├── interfaces/
│   │   └── blog.ts               # TypeScript interfaces
│   └── blog-database.ts          # Database query functions
└── utils/
    └── mdx.ts                    # Markdown utilities
```

## How It Works

### 1. Build Time (SSG)

When you run `npm run build`:

1. **Sitemap generation** (`sitemap.ts`):
   - Queries database for all published posts
   - Generates `sitemap.xml` with blog URLs

2. **Blog listing** (`/blog/page.tsx`):
   - Queries database for all published posts
   - Generates static HTML with post previews

3. **Blog posts** (`/blog/[slug]/page.tsx`):
   - `generateStaticParams()` fetches all slugs
   - Generates static HTML for each post
   - Converts markdown → HTML server-side

**Result:** Fully static site, no database calls at request time.

### 2. Request Time (ISR)

After build, pages revalidate:

**Automatic revalidation (every hour):**
```typescript
export const revalidate = 3600; // 1 hour
```

**On-demand revalidation (when you publish):**
```bash
curl -X POST https://guapital.com/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"slug": "new-post", "secret": "YOUR_SECRET"}'
```

## Publishing Workflow

### Option A: Manual (Supabase Dashboard)

1. Go to Supabase → Table Editor → `blog_posts`
2. Insert new row:
   ```json
   {
     "slug": "net-worth-percentile-by-age",
     "title": "Net Worth Percentile by Age: Where Do You Rank?",
     "description": "Discover how your net worth compares...",
     "content": "# Your Markdown Here\n\n...",
     "published": true,
     "published_at": "2025-01-15T00:00:00Z",
     "category": "Percentile Rankings",
     "tags": ["net-worth", "percentile", "data"]
   }
   ```
3. Trigger revalidation (see below)

### Option B: Programmatic (TODO: Admin UI)

Create an admin UI at `/admin/blog` for easier publishing:
- Rich text editor for markdown
- Preview mode
- One-click publish with auto-revalidation

## Revalidation Methods

### 1. Automatic (Hourly)

No action needed. Pages refresh every hour automatically.

### 2. On-Demand (Immediate)

**A. Via API:**
```bash
# Revalidate specific post
curl -X POST https://guapital.com/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"slug": "post-slug", "secret": "YOUR_SECRET"}'

# Revalidate blog listing
curl -X POST https://guapital.com/api/blog/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret": "YOUR_SECRET"}'
```

**B. Via Amplify (Full Rebuild):**
```bash
aws amplify start-job \
  --app-id <APP_ID> \
  --branch-name main \
  --job-type RELEASE
```

Use full rebuild when:
- Publishing multiple posts at once
- Changing sitemap structure
- After database migration

### 3. Environment Variable

Add to `.env.local`:
```bash
REVALIDATION_SECRET=your-random-secret-token-here
```

## SEO Features

### 1. Meta Tags (OpenGraph, Twitter Cards)

Every blog post includes:
```html
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta name="twitter:card" content="summary_large_image" />
```

### 2. Structured Data (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "...",
  "datePublished": "...",
  "author": { "@type": "Organization", "name": "Guapital" }
}
```

### 3. Sitemap (`sitemap.xml`)

Auto-generated at build time:
```xml
<url>
  <loc>https://guapital.com/blog/post-slug</loc>
  <lastmod>2025-01-15</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

### 4. Robots.txt

Already configured:
```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Sitemap: https://guapital.com/sitemap.xml
```

## Search Engine Indexing

### Google Search Console Setup

1. **Verify domain ownership:**
   - Add DNS TXT record OR
   - Upload HTML verification file

2. **Submit sitemap:**
   - GSC → Sitemaps → Add: `https://guapital.com/sitemap.xml`

3. **Request indexing (new posts):**
   - GSC → URL Inspection → Enter URL → Request Indexing

### Bing Webmaster Tools

1. Import from Google Search Console (easiest)
2. Or manually add sitemap

## Performance Metrics

**Target Lighthouse Scores:**
- Performance: 95+
- SEO: 100
- Accessibility: 100
- Best Practices: 100

**Why SSG achieves this:**
- TTFB: <100ms (CDN-served)
- LCP: <1s (pre-rendered HTML)
- CLS: 0 (static layout)
- FCP: <0.8s (instant paint)

## Content Guidelines

### Markdown Support

**Supported:**
- Headers (H1-H6)
- Bold, italic, strikethrough
- Lists (ordered, unordered)
- Links, images
- Code blocks (inline, fenced)
- Tables (GitHub Flavored Markdown)
- Blockquotes

**Example:**
```markdown
# Net Worth Percentile by Age

Discover where you rank compared to peers.

## Key Insights

- **Top 10%** at age 30: $150K+ net worth
- **Median** (50th percentile): $45K

[Sign up for Guapital](/) to track your percentile.
```

### SEO Best Practices

1. **Title (H1):** Include target keyword, <60 chars
2. **Description:** 150-160 chars, compelling CTA
3. **Meta Title:** If different from H1, optimize for search
4. **Meta Description:** Can be longer, more detailed
5. **Image Alt Text:** Descriptive, include keywords
6. **Internal Links:** Link to related blog posts, pricing, signup
7. **External Links:** Cite sources (Federal Reserve, Pew Research)

### Content Length

- **Minimum:** 1,500 words (Google favors long-form for YMYL topics)
- **Optimal:** 2,500-3,500 words for pillar content
- **Maximum:** No limit, but maintain quality

## Analytics

### View Counting

**Automatic tracking:**
```sql
SELECT increment_blog_view_count('post-slug');
```

**TODO:** Call this function from blog post page (client-side or API route).

### PostHog Events

Track engagement:
```typescript
posthog.capture('blog_post_viewed', {
  slug: post.slug,
  category: post.category,
  reading_time: post.reading_time_minutes,
});
```

## Migration Plan

### Phase 1: Database (DONE ✅)
- [x] Migration 028: Create `blog_posts` table
- [x] TypeScript interfaces
- [x] Database query functions

### Phase 2: Pages (DONE ✅)
- [x] Blog listing page (`/blog/page.tsx`)
- [x] Blog post detail page (`/blog/[slug]/page.tsx`)
- [x] MDX content renderer
- [x] Sitemap integration

### Phase 3: API (DONE ✅)
- [x] Revalidation endpoint (`/api/blog/revalidate`)

### Phase 4: Deployment (TODO)
- [ ] Apply migration to production Supabase
- [ ] Set `REVALIDATION_SECRET` env variable
- [ ] Deploy to AWS Amplify
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools

### Phase 5: Content (TODO)
- [ ] Migrate existing post: "Net Worth Percentile by Age"
- [ ] Write flagship content (see CLAUDE.md SEO strategy)
- [ ] Admin UI for easier publishing (optional)

## Testing Checklist

**Before deploying to production:**

- [ ] Migration 028 applied successfully
- [ ] Seed post created and published
- [ ] `/blog` listing page loads (SSG)
- [ ] `/blog/welcome-to-guapital-blog` post page loads (SSG)
- [ ] Markdown renders correctly (headers, links, lists)
- [ ] Meta tags present (view source, check OG tags)
- [ ] Structured data validates (Google Rich Results Test)
- [ ] Sitemap includes blog posts (`/sitemap.xml`)
- [ ] Robots.txt allows `/blog` (`/robots.txt`)
- [ ] Revalidation API works (test with curl)
- [ ] Build succeeds (`npm run build`)
- [ ] Lighthouse score 90+ for SEO

## Troubleshooting

### Issue: Blog posts not appearing in sitemap

**Solution:** Check `blog_posts.published = true` and run `npm run build`.

### Issue: Markdown not rendering

**Solution:** Check MDXContent component, ensure `content` prop is markdown string.

### Issue: 404 on blog post

**Solution:** Check slug matches database, ensure `published = true`, rebuild site.

### Issue: Revalidation not working

**Solution:** Verify `REVALIDATION_SECRET` env variable, check API logs.

### Issue: Build fails with database error

**Solution:** Ensure Supabase connection works, check migration applied, verify RLS policies.

## Future Enhancements

1. **Admin UI** - Visual editor for publishing posts
2. **Image uploads** - Store images in Supabase Storage
3. **Author management** - Multi-author support
4. **Comments** - Integrate discussion system
5. **Related posts** - Recommend similar content
6. **Search** - Full-text search with Postgres FTS
7. **RSS feed** - Generate XML feed for subscribers
8. **Email notifications** - Send new post alerts to subscribers

## References

- [Next.js SSG Documentation](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props)
- [Next.js ISR Documentation](https://nextjs.org/docs/pages/building-your-application/data-fetching/incremental-static-regeneration)
- [Google Search Central - SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Schema.org BlogPosting](https://schema.org/BlogPosting)
- [OpenGraph Protocol](https://ogp.me/)
