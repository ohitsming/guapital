/**
 * Blog Post Interface
 * Matches database schema for blog_posts table
 */

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string; // Markdown content
  author_id?: string;

  // Publishing status
  published: boolean;
  published_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;

  // SEO fields
  meta_title?: string;
  meta_description?: string;
  og_image_url?: string;

  // Analytics
  view_count: number;

  // Organization
  category?: string;
  tags?: string[];

  // Reading time (auto-calculated)
  reading_time_minutes?: number;
}

/**
 * Blog post preview for listing pages
 * Excludes full markdown content for performance
 */
export interface BlogPostPreview {
  id: string;
  slug: string;
  title: string;
  description: string;
  published_at?: string;
  category?: string;
  tags?: string[];
  reading_time_minutes?: number;
  view_count: number;
}

/**
 * Blog post with rendered HTML content
 * Used after markdown conversion
 */
export interface BlogPostWithHtml extends Omit<BlogPost, 'content'> {
  htmlContent: string;
}

/**
 * Blog category metadata
 */
export interface BlogCategory {
  name: string;
  slug: string;
  description?: string;
  post_count: number;
}

/**
 * Valid blog categories
 * Should match content strategy in CLAUDE.md
 */
export const BLOG_CATEGORIES = [
  'Percentile Rankings',
  'Net Worth Tracking',
  'Competitor Comparisons',
  'FIRE Strategy',
  'Crypto Tracking',
  'Product Updates',
  'Announcements',
] as const;

export type BlogCategoryType = typeof BLOG_CATEGORIES[number];
