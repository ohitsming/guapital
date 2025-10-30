export interface BlogArticle {
  slug: string
  title: string
  description: string
  author: string
  date: string
  readingTime: string
  category: string
}

// Central article registry - add new articles here
export const allArticles: BlogArticle[] = [
  {
    slug: 'net-worth-percentile-by-age',
    title: 'Net Worth Percentile by Age: Where Do You Rank?',
    description:
      'Discover how your net worth compares to your peers with data from the Federal Reserve and real user insights.',
    author: 'Guapital Team',
    date: '2025-01-15',
    readingTime: '8 min',
    category: 'Percentile Rankings',
  },
  // Add more articles here as you publish them
]

// Sort articles by date (newest first)
export function getArticlesSortedByDate(): BlogArticle[] {
  return allArticles.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

// Get paginated articles
export function getPaginatedArticles(page: number = 1, perPage: number = 10) {
  const sorted = getArticlesSortedByDate()
  const start = (page - 1) * perPage
  const end = start + perPage

  return {
    articles: sorted.slice(start, end),
    totalPages: Math.ceil(sorted.length / perPage),
    currentPage: page,
    hasNextPage: end < sorted.length,
    hasPrevPage: page > 1,
  }
}

// Search articles by title, description, or category
export function searchArticles(query: string): BlogArticle[] {
  if (!query.trim()) return getArticlesSortedByDate()

  const searchTerm = query.toLowerCase().trim()

  return allArticles.filter((article) => {
    return (
      article.title.toLowerCase().includes(searchTerm) ||
      article.description.toLowerCase().includes(searchTerm) ||
      article.category.toLowerCase().includes(searchTerm) ||
      article.author.toLowerCase().includes(searchTerm)
    )
  }).sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

// Get articles by category
export function getArticlesByCategory(category: string): BlogArticle[] {
  return allArticles
    .filter((article) => article.category === category)
    .sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
}

// Get all unique categories
export function getAllCategories(): string[] {
  const categories = allArticles.map((article) => article.category)
  return Array.from(new Set(categories)).sort()
}

// Get article by slug
export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return allArticles.find((article) => article.slug === slug)
}
