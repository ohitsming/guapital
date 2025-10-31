import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFullBlogPost, getAllBlogSlugs } from '@/lib/blog-database';
import { ArticleLayout } from '@/components/blog/ArticleLayout';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { NetWorthChart } from '@/components/blog/charts';

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

  // Prepare article metadata for layout
  const article = {
    title: post.title,
    description: post.description,
    author: 'Guapital Team',
    date: post.published_at || post.created_at,
    readingTime: post.reading_time_minutes ? `${post.reading_time_minutes} min` : '5 min',
    category: post.category || 'Uncategorized',
    tags: post.tags || [],
  };

  return (
    <>
      {/* SEO: Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Use ArticleLayout component (same as preview) */}
      <ArticleLayout article={article}>
        <MDXRemote
          source={post.content}
          components={{
            NetWorthChart,
          }}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
            },
          }}
        />
      </ArticleLayout>
    </>
  );
}
