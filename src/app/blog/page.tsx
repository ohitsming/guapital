import { formatDate } from '@/utils/formatters'
import type { Metadata } from 'next'
import { BlogPageContent } from './BlogPageContent'
import { getArticlesSortedByDate, getAllCategories } from '@/lib/blog-articles'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Wealth building tips, net worth insights, and financial independence strategies for young adults.',
}

export default function BlogPage() {
  const articles = getArticlesSortedByDate()
  const categories = getAllCategories()

  return <BlogPageContent initialArticles={articles} categories={categories} />
}
