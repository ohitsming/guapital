import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFullBlogPost, getAllBlogSlugs } from '@/lib/blog-database';
import MDXContent from '@/components/blog/MDXContent';
import { formatDate } from '@/utils/formatters';

// Generate static paths at build time (SSG)
export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();

  return slugs.map((slug) => ({
    slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getFullBlogPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.description,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.description,
      type: 'article',
      publishedTime: post.published_at,
      authors: ['Guapital Team'],
      images: post.og_image_url ? [post.og_image_url] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.description,
      images: post.og_image_url ? [post.og_image_url] : [],
    },
  };
}

// Revalidate every hour (ISR)
export const revalidate = 3600;

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getFullBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  // Structured data for SEO (rich snippets)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: 'Guapital',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Guapital',
      logo: {
        '@type': 'ImageObject',
        url: 'https://guapital.com/logo.png',
      },
    },
    image: post.og_image_url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://guapital.com/blog/${post.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* SEO: Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Blog Post Container */}
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Breadcrumb - Mobile friendly */}
        <nav className="mb-4 sm:mb-6 flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 overflow-x-auto">
          <a href="/" className="hover:text-teal-600 transition-colors whitespace-nowrap">
            Home
          </a>
          <span>/</span>
          <a href="/blog" className="hover:text-teal-600 transition-colors whitespace-nowrap">
            Blog
          </a>
          {post.category && (
            <>
              <span>/</span>
              <span className="text-gray-900 dark:text-white whitespace-nowrap truncate">{post.category}</span>
            </>
          )}
        </nav>

        {/* Category Badge */}
        {post.category && (
          <div className="mb-3 sm:mb-4">
            <span className="inline-block rounded-full bg-teal-100 dark:bg-teal-900 px-3 py-1 text-xs sm:text-sm font-medium text-teal-800 dark:text-teal-100">
              {post.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="mb-3 sm:mb-4 text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
          {post.title}
        </h1>

        {/* Description */}
        <p className="mb-4 sm:mb-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
          {post.description}
        </p>

        {/* Metadata Bar */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-3 sm:gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <svg
              className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <time dateTime={post.published_at} className="whitespace-nowrap">
              {post.published_at ? formatDate(post.published_at) : 'Draft'}
            </time>
          </div>

          {post.reading_time_minutes && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <svg
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="whitespace-nowrap">{post.reading_time_minutes} min read</span>
            </div>
          )}

          {post.view_count > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <svg
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span className="whitespace-nowrap">{post.view_count.toLocaleString()} views</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-6 sm:mb-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-md bg-gray-100 dark:bg-gray-800 px-2.5 sm:px-3 py-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Blog Content - Rendered from Markdown */}
        <div className="prose prose-sm sm:prose-base lg:prose-lg mx-auto max-w-none dark:prose-invert">
          <MDXContent content={post.content} />
        </div>

        {/* CTA: Sign Up */}
        <div className="mt-10 sm:mt-12 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#004D40] to-teal-700 p-6 sm:p-8 text-center text-white">
          <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-bold">Ready to Track Your Net Worth?</h2>
          <p className="mb-4 sm:mb-6 text-base sm:text-lg leading-relaxed">
            See where you rank with percentile insights and start building wealth today.
          </p>
          <a
            href="/signup"
            className="inline-block rounded-lg bg-[#FFC107] px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-gray-900 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Get Started Free
          </a>
        </div>

        {/* Back to Blog */}
        <div className="mt-6 sm:mt-8 text-center">
          <a
            href="/blog"
            className="inline-flex items-center gap-1 text-sm sm:text-base text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </a>
        </div>
      </article>
    </div>
  );
}
