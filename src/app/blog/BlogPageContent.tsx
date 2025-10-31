'use client'

import { formatDate } from '@/utils/formatters'
import { BlogArticle } from '@/lib/blog-database'

interface BlogPageContentProps {
  initialArticles: BlogArticle[]
  categories: string[]
}

export function BlogPageContent({ initialArticles }: BlogPageContentProps) {
  // Always feature the 'welcome-to-guapital' post on the left
  const welcomePost = initialArticles.find(article => article.slug === 'welcome-to-guapital')
  const featuredPost = welcomePost || initialArticles[0]

  // Get remaining posts (exclude featured post, show up to 3)
  const posts = initialArticles
    .filter(article => article.slug !== featuredPost?.slug)
    .slice(0, 3)

  if (!featuredPost) {
    return (
      <div className="py-24 sm:py-32 ">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
              Wealth Building Insights
            </h2>
            <p className="mt-2 text-lg/8 text-gray-600 dark:text-gray-400">
              Expert guidance on net worth tracking, percentile rankings, and achieving financial independence.
            </p>
            <p className="mt-6 text-base text-gray-600 dark:text-gray-400">
              No articles published yet. Check back soon!
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Generate author initials for avatar
  const getAuthorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="bg-white py-12 sm:py-16 md:py-24 lg:py-32 dark:bg-gray-900">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-8 px-4 sm:px-6 sm:gap-y-12 lg:grid-cols-2 lg:px-8">
        {/* Featured Post - Always on the left */}
        <article className="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-lg lg:order-1">
          <time
            dateTime={featuredPost.date}
            className="block text-xs sm:text-sm/6 text-gray-600 dark:text-gray-400"
          >
            {formatDate(featuredPost.date)}
          </time>
          <h2
            id="featured-post"
            className="mt-3 sm:mt-4 text-pretty text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white leading-tight"
          >
            {featuredPost.title}
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg/8 text-gray-600 dark:text-gray-400">
            {featuredPost.description}
          </p>
          <div className="mt-4 sm:mt-6 flex flex-col gap-4 sm:gap-6 lg:mt-4">
            <div className="flex">
              <a
                href={`/blog/${featuredPost.slug}`}
                aria-describedby="featured-post"
                className="text-sm sm:text-sm/6 font-semibold text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 inline-flex items-center gap-1"
              >
                Continue reading <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
            <div className="flex border-t border-gray-900/10 pt-4 dark:border-white/10 lg:pt-8">
              <div className="flex gap-x-2 sm:gap-x-2.5 text-sm sm:text-sm/6 font-semibold text-gray-900 dark:text-white items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white text-xs flex-shrink-0">
                  {getAuthorInitials(featuredPost.author)}
                </div>
                <span className="truncate">{featuredPost.author}</span>
              </div>
            </div>
          </div>
        </article>

        {/* Recent Posts - Always on the right */}
        <div className="mx-auto w-full max-w-2xl border-t border-gray-900/10 pt-8 sm:pt-12 lg:mx-0 lg:max-w-none lg:border-t-0 lg:pt-0 lg:order-2 dark:border-white/10">
          <div className="-my-8 sm:-my-12 divide-y divide-gray-900/10 dark:divide-white/10">
            {posts.length > 0 ? (
              posts.map((post) => (
                <article key={post.slug} className="py-8 sm:py-12">
                  <div className="group relative max-w-xl">
                    <time
                      dateTime={post.date}
                      className="block text-xs sm:text-sm/6 text-gray-600 dark:text-gray-400"
                    >
                      {formatDate(post.date)}
                    </time>
                    <h2 className="mt-2 text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-gray-600 dark:text-white dark:group-hover:text-gray-300 leading-tight">
                      <a href={`/blog/${post.slug}`}>
                        <span className="absolute inset-0" />
                        {post.title}
                      </a>
                    </h2>
                    <p className="mt-3 sm:mt-4 text-sm sm:text-sm/6 text-gray-600 dark:text-gray-400 line-clamp-3">
                      {post.description}
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-4 flex">
                    <div className="relative flex gap-x-2 sm:gap-x-2.5 text-sm sm:text-sm/6 font-semibold text-gray-900 dark:text-white items-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white text-xs flex-shrink-0">
                        {getAuthorInitials(post.author)}
                      </div>
                      <span className="truncate">{post.author}</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="py-8 sm:py-12">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  More articles coming soon!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View All Articles Link */}
      {initialArticles.length > 4 && (
        <div className="mx-auto mt-12 sm:mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <a
              href="/blog/archive"
              className="rounded-md bg-teal-600 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 transition-colors"
            >
              View all articles
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
