'use client'

import { useState, useMemo } from 'react'
import { formatDate } from '@/utils/formatters'
import { BlogArticle } from '@/lib/blog-articles'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'

interface BlogPageContentProps {
  initialArticles: BlogArticle[]
  categories: string[]
}

const ARTICLES_PER_PAGE = 9

export function BlogPageContent({ initialArticles, categories }: BlogPageContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter and search articles
  const filteredArticles = useMemo(() => {
    let result = initialArticles

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((article) => article.category === selectedCategory)
    }

    // Search by query
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim()
      result = result.filter((article) => {
        return (
          article.title.toLowerCase().includes(searchTerm) ||
          article.description.toLowerCase().includes(searchTerm) ||
          article.category.toLowerCase().includes(searchTerm) ||
          article.author.toLowerCase().includes(searchTerm)
        )
      })
    }

    return result
  }, [initialArticles, searchQuery, selectedCategory])

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE)
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ARTICLES_PER_PAGE
    const end = start + ARTICLES_PER_PAGE
    return filteredArticles.slice(start, end)
  }, [filteredArticles, currentPage])

  // Reset to page 1 when filters change
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  return (
    <div className="bg-white py-12 px-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Wealth Building Insights
          </h2>
          <p className="mt-2 text-lg/8 text-gray-600">
            Expert guidance on net worth tracking, percentile rankings, and achieving financial independence.
          </p>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full rounded-md border-0 bg-white py-2.5 pl-10 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm/6"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 hover:opacity-70"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 border-t border-gray-200 pt-10 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {paginatedArticles.map((post) => (
            <article key={post.slug} className="flex max-w-xl flex-col items-start justify-between">
              <div className="flex items-center gap-x-4 text-xs">
                <time dateTime={post.date} className="text-gray-500">
                  {formatDate(post.date)}
                </time>
                <span className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100">
                  {post.category}
                </span>
              </div>
              <div className="group relative grow">
                <h3 className="mt-3 text-lg/6 font-semibold text-gray-900 group-hover:text-gray-600">
                  <a href={`/blog/${post.slug}`}>
                    <span className="absolute inset-0" />
                    {post.title}
                  </a>
                </h3>
                <p className="mt-5 line-clamp-3 text-sm/6 text-gray-600">{post.description}</p>
              </div>
              <div className="relative mt-8 flex items-center gap-x-4 justify-self-end">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-600 font-semibold text-sm">
                  {post.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-sm/6">
                  <p className="font-semibold text-gray-900">
                    {post.author}
                  </p>
                  <p className="text-gray-600">{post.readingTime}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 w-10 rounded-md text-sm font-semibold ${
                    page === currentPage
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
