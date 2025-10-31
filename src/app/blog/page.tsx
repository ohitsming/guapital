import type { Metadata } from 'next'
import { BlogPageContent } from './BlogPageContent'
import { getArticlesSortedByDate, getAllCategories } from '@/lib/blog-database'

export const metadata: Metadata = {
  title: 'Blog - Guapital',
  description:
    'Wealth building tips, net worth insights, and financial independence strategies for young adults.',
}

// Revalidate every hour (ISR)
export const revalidate = 3600;

export default async function BlogPage() {
  // Fetch from database (SSG with revalidation)
  const articles = await getArticlesSortedByDate()
  const categories = await getAllCategories()

  return <BlogPageContent initialArticles={articles} categories={categories} />
}
