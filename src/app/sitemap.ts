import { MetadataRoute } from 'next'
import { URL } from '@/lib/constant'
import { getArticlesSortedByDate } from '@/lib/blog-articles'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = URL

  // Static pages with priority and change frequency
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Dynamic blog articles
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const articles = getArticlesSortedByDate()
    blogPages = articles.map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: article.date ? new Date(article.date) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('Error generating blog sitemap:', error)
  }

  return [...staticPages, ...blogPages]
}
