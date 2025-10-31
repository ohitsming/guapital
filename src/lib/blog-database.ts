/**
 * Database-backed blog article functions
 * Replaces file-based blog-articles.ts with Supabase queries
 * Uses SSG at build time for optimal SEO
 */

import { createClient } from '@/utils/supabase/static';
import type { BlogPost, BlogPostPreview } from '@/lib/interfaces/blog';

export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string;
  readingTime: string;
  category: string;
  tags?: string[];
  viewCount?: number;
}

/**
 * Fetch all published articles (for SSG at build time)
 * This runs at BUILD TIME, not request time
 */
export async function getAllArticles(): Promise<BlogArticle[]> {
  const supabase = createClient();

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('slug, title, description, published_at, category, tags, reading_time_minutes, view_count')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }

  return posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    author: 'Guapital Team', // Default author, can be extended
    date: post.published_at || new Date().toISOString(),
    readingTime: `${post.reading_time_minutes || 5} min`,
    category: post.category || 'Uncategorized',
    tags: post.tags,
    viewCount: post.view_count,
  }));
}

/**
 * Sort articles by date (newest first)
 * Already sorted by DB query, but kept for compatibility
 */
export async function getArticlesSortedByDate(): Promise<BlogArticle[]> {
  return getAllArticles();
}

/**
 * Get paginated articles
 */
export async function getPaginatedArticles(page: number = 1, perPage: number = 10) {
  const supabase = createClient();

  const start = (page - 1) * perPage;
  const end = start + perPage - 1;

  const { data: posts, error, count } = await supabase
    .from('blog_posts')
    .select('slug, title, description, published_at, category, tags, reading_time_minutes, view_count', { count: 'exact' })
    .eq('published', true)
    .order('published_at', { ascending: false })
    .range(start, end);

  if (error) {
    console.error('Error fetching paginated posts:', error);
    return {
      articles: [],
      totalPages: 0,
      currentPage: page,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  const articles: BlogArticle[] = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    author: 'Guapital Team',
    date: post.published_at || new Date().toISOString(),
    readingTime: `${post.reading_time_minutes || 5} min`,
    category: post.category || 'Uncategorized',
    tags: post.tags,
    viewCount: post.view_count,
  }));

  const totalPages = Math.ceil((count || 0) / perPage);

  return {
    articles,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Search articles by title, description, or category
 */
export async function searchArticles(query: string): Promise<BlogArticle[]> {
  if (!query.trim()) return getArticlesSortedByDate();

  const supabase = createClient();
  const searchTerm = query.toLowerCase().trim();

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('slug, title, description, published_at, category, tags, reading_time_minutes, view_count')
    .eq('published', true)
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error searching posts:', error);
    return [];
  }

  return posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    author: 'Guapital Team',
    date: post.published_at || new Date().toISOString(),
    readingTime: `${post.reading_time_minutes || 5} min`,
    category: post.category || 'Uncategorized',
    tags: post.tags,
    viewCount: post.view_count,
  }));
}

/**
 * Get articles by category
 */
export async function getArticlesByCategory(category: string): Promise<BlogArticle[]> {
  const supabase = createClient();

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('slug, title, description, published_at, category, tags, reading_time_minutes, view_count')
    .eq('published', true)
    .eq('category', category)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts by category:', error);
    return [];
  }

  return posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    author: 'Guapital Team',
    date: post.published_at || new Date().toISOString(),
    readingTime: `${post.reading_time_minutes || 5} min`,
    category: post.category || 'Uncategorized',
    tags: post.tags,
    viewCount: post.view_count,
  }));
}

/**
 * Get all unique categories
 */
export async function getAllCategories(): Promise<string[]> {
  const supabase = createClient();

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('category')
    .eq('published', true);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  const categories = posts
    .map((post) => post.category)
    .filter((cat): cat is string => cat !== null && cat !== undefined);

  return Array.from(new Set(categories)).sort();
}

/**
 * Get article by slug (metadata only, for listing)
 */
export async function getArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const supabase = createClient();

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('slug, title, description, published_at, category, tags, reading_time_minutes, view_count')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !post) {
    console.error('Error fetching post by slug:', error);
    return null;
  }

  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    author: 'Guapital Team',
    date: post.published_at || new Date().toISOString(),
    readingTime: `${post.reading_time_minutes || 5} min`,
    category: post.category || 'Uncategorized',
    tags: post.tags,
    viewCount: post.view_count,
  };
}

/**
 * Get full blog post with content (for rendering)
 */
export async function getFullBlogPost(slug: string): Promise<BlogPost | null> {
  const supabase = createClient();

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !post) {
    console.error('Error fetching full post:', error);
    return null;
  }

  return post as BlogPost;
}

/**
 * Get all slugs for SSG static path generation
 */
export async function getAllBlogSlugs(): Promise<string[]> {
  const supabase = createClient();

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('published', true);

  if (error) {
    console.error('Error fetching slugs:', error);
    return [];
  }

  return posts.map((post) => post.slug);
}
