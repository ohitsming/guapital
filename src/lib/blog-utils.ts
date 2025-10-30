import { Metadata } from 'next'
import { URL, WEB_NAME } from '@/lib/constant'

interface ArticleMetadata {
  title: string
  description: string
  author: string
  date: string
  readingTime?: string
}

export function generateBlogMetadata(
  slug: string,
  article: ArticleMetadata
): Metadata {
  const articleUrl = `${URL}/blog/${slug}`
  const ogImageUrl = `${URL}/api/og/blog?title=${encodeURIComponent(article.title)}`

  return {
    title: article.title,
    description: article.description,
    authors: [{ name: article.author }],
    openGraph: {
      title: article.title,
      description: article.description,
      url: articleUrl,
      siteName: WEB_NAME,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      locale: 'en_US',
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      creator: '@guapital',
      images: [ogImageUrl],
    },
    alternates: {
      canonical: articleUrl,
    },
  }
}

export function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min`
}

export interface BlogArticle {
  slug: string
  title: string
  description: string
  author: string
  date: string
  readingTime: string
  category: string
}

export function sortArticlesByDate(articles: BlogArticle[]): BlogArticle[] {
  return articles.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}
