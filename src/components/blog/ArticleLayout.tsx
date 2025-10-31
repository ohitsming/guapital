'use client'

import { ReactNode, useEffect, useState } from 'react'
import { formatDate } from '@/utils/formatters'

interface ArticleMeta {
  title: string
  description: string
  author: string
  date: string
  readingTime?: string
  category?: string
  tags?: string[]
}

interface TableOfContentsItem {
  id: string
  title: string
  level: number
}

export function ArticleLayout({
  children,
  article,
}: {
  children: ReactNode
  article: ArticleMeta
}) {
  const [tocItems, setTocItems] = useState<TableOfContentsItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Wait for next tick to ensure DOM is ready
    const timer = setTimeout(() => {
      const headings = document.querySelectorAll('article h2, article h3')
      const items: TableOfContentsItem[] = []

      headings.forEach((heading, index) => {
        const id = heading.id || `heading-${index}`
        if (!heading.id) {
          heading.id = id
        }
        items.push({
          id,
          title: heading.textContent || '',
          level: heading.tagName === 'H2' ? 2 : 3,
        })
      })

      setTocItems(items)

      if (headings.length === 0) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id)
            }
          })
        },
        { rootMargin: '-100px 0px -80% 0px' }
      )

      headings.forEach((heading) => observer.observe(heading))

      return () => {
        headings.forEach((heading) => observer.unobserve(heading))
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <nav className="mb-3 sm:mb-4 flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 overflow-x-auto">
              <a href="/" className="hover:text-teal-600 transition-colors whitespace-nowrap">
                Home
              </a>
              <span>/</span>
              <a href="/blog" className="hover:text-teal-600 transition-colors whitespace-nowrap">
                Blog
              </a>
              <span>/</span>
              <span className="text-gray-900 dark:text-white truncate">{article.category || 'Article'}</span>
            </nav>

            {/* Category Badge */}
            {article.category && (
              <div className="mb-3 sm:mb-4">
                <span className="inline-block rounded-md bg-teal-600 dark:bg-teal-700 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-white uppercase tracking-wide">
                  {article.category}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 dark:text-white">
              {article.title}
            </h1>

            {/* Metadata Bar */}
            <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2 sm:gap-3 border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-teal-600 text-xs sm:text-sm font-semibold text-white flex-shrink-0">
                  {article.author.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <span className="font-medium text-gray-900 dark:text-white">By {article.author}</span>
              </div>
              <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                <time dateTime={article.date} className="whitespace-nowrap">Updated {formatDate(article.date)}</time>
              </div>
              {article.readingTime && (
                <>
                  <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="whitespace-nowrap">{article.readingTime}</span>
                  </div>
                </>
              )}
            </div>

            {/* Key Takeaways Box */}
            <div className="mb-6 sm:mb-8 rounded-lg border-l-4 border-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-500 p-4 sm:p-6">
              <h2 className="mb-2 sm:mb-3 text-base sm:text-lg font-bold text-gray-900 dark:text-white">Key Takeaways</h2>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <svg
                    className="mr-1.5 sm:mr-2 mt-0.5 sm:mt-1 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-teal-600 dark:text-teal-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Net worth is your total assets minus liabilities, the best metric for overall financial health</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-1.5 sm:mr-2 mt-0.5 sm:mt-1 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-teal-600 dark:text-teal-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Percentile rankings show where you stand compared to peers in your age bracket</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-1.5 sm:mr-2 mt-0.5 sm:mt-1 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-teal-600 dark:text-teal-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Consistent tracking and high savings rates are key to reaching top percentiles</span>
                </li>
              </ul>
            </div>

            {/* Article Content */}
            <article className="blog-prose max-w-none">
              {children}
            </article>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {article.tags.map((tag) => (
                    <a
                      key={tag}
                      href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                      className="inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {tag}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Section */}
            <div className="mt-8 sm:mt-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#004D40] to-teal-700 p-6 sm:p-8 text-white">
              <div className="flex flex-col items-center text-center">
                <h2 className="mb-2 sm:mb-3 text-xl sm:text-2xl font-bold">Start Tracking Your Net Worth Today</h2>
                <p className="mb-4 sm:mb-6 max-w-2xl text-sm sm:text-base lg:text-lg text-teal-50">
                  Join thousands building wealth with Guapital. See your percentile ranking, track all your assets, and achieve financial independence.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                  <a
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-lg bg-[#FFC107] px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-gray-900 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                  >
                    Get Started Free
                  </a>
                  <a
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-lg border-2 border-white px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-white hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                  >
                    View Pricing
                  </a>
                </div>
              </div>
            </div>

            {/* Share Section */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
              <a
                href="/blog"
                className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
              >
                <svg
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Blog
              </a>

              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Share:</span>
                <ShareButtons title={article.title} />
              </div>
            </div>
          </main>

          {/* Table of Contents Sidebar (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-8">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                  Table of Contents
                </h3>
                <nav>
                  <ul className="space-y-2 text-sm">
                    {tocItems.map((item) => (
                      <li
                        key={item.id}
                        className={item.level === 3 ? 'ml-4' : ''}
                      >
                        <a
                          href={`#${item.id}`}
                          className={`block py-1 transition-colors ${
                            activeId === item.id
                              ? 'font-semibold text-teal-600 dark:text-teal-400'
                              : 'text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400'
                          }`}
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {/* Quick Links */}
              <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                  Related Tools
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="/signup"
                      className="flex items-center text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                    >
                      <svg className="mr-2 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                      </svg>
                      <span>Net Worth Tracker</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="/signup"
                      className="flex items-center text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                    >
                      <svg className="mr-2 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      <span>Percentile Calculator</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function ShareButtons({ title }: { title: string }) {
  const url = typeof window !== 'undefined' ? window.location.href : ''

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 transition-colors"
        aria-label="Share on Twitter"
      >
        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 transition-colors"
        aria-label="Share on LinkedIn"
      >
        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      </a>
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 transition-colors"
        aria-label="Share on Facebook"
      >
        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>
      <button
        onClick={handleCopyLink}
        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 transition-colors"
        aria-label="Copy link"
      >
        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </button>
    </div>
  )
}
