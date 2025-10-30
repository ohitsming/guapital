'use client'

import { usePathname } from 'next/navigation'
import { Container } from '@/components/Container'
import { Prose } from '@/components/Prose'
import { formatDate } from '@/utils/formatters'

export function BlogArticleLayout({
  children,
  article,
}: {
  children: React.ReactNode
  article: {
    title: string
    description: string
    author: string
    date: string
    readingTime?: string
  }
}) {
  const pathname = usePathname()

  return (
    <Container className="mt-16 lg:mt-32">
      <div className="xl:relative">
        <div className="mx-auto max-w-2xl">
          {/* Back Link */}
          <a
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Blog
          </a>

          {/* Article Header */}
          <header className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl mb-4">
              {article.title}
            </h1>
            <p className="text-lg text-zinc-600 mb-6">{article.description}</p>

            <div className="flex items-center gap-4 text-sm text-zinc-500 border-t border-zinc-200 pt-6">
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-800">{article.author}</span>
              </div>
              <span className="text-zinc-300">•</span>
              <time dateTime={article.date}>{formatDate(article.date)}</time>
              {article.readingTime && (
                <>
                  <span className="text-zinc-300">•</span>
                  <span>{article.readingTime} read</span>
                </>
              )}
            </div>
          </header>

          {/* Article Content */}
          <Prose>{children}</Prose>

          {/* Share Section */}
          <div className="mt-16 pt-8 border-t border-zinc-200">
            <h3 className="text-lg font-semibold text-zinc-800 mb-4">
              Share this article
            </h3>
            <div className="flex items-center gap-4">
              <ShareButton
                platform="twitter"
                url={`https://guapital.com${pathname}`}
                title={article.title}
              />
              <ShareButton
                platform="linkedin"
                url={`https://guapital.com${pathname}`}
                title={article.title}
              />
              <ShareButton
                platform="facebook"
                url={`https://guapital.com${pathname}`}
                title={article.title}
              />
              <CopyLinkButton url={`https://guapital.com${pathname}`} />
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 p-8 border border-teal-100">
            <h3 className="text-2xl font-bold text-zinc-800 mb-3">
              Ready to track your net worth?
            </h3>
            <p className="text-zinc-600 mb-6">
              Join thousands of young adults building wealth with Guapital. See where you stand with
              percentile rankings.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </div>
    </Container>
  )
}

function ShareButton({
  platform,
  url,
  title,
}: {
  platform: 'twitter' | 'linkedin' | 'facebook'
  url: string
  title: string
}) {
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  }

  const icons = {
    twitter: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    linkedin: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    facebook: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  }

  return (
    <a
      href={shareUrls[platform]}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-3 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
      aria-label={`Share on ${platform}`}
    >
      {icons[platform]}
    </a>
  )
}

function CopyLinkButton({ url }: { url: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-3 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
      aria-label="Copy link"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
        />
      </svg>
    </button>
  )
}

export default BlogArticleLayout
