import { createClient } from '@/utils/supabase/server'
import { ArticleLayout } from '@/components/blog/ArticleLayout'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'

export default async function PreviewBlogPostPage({
  params
}: {
  params: { slug: string }
}) {
  const supabase = createClient()

  // Check if user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  if (!adminEmails.includes(user.email || '')) {
    notFound()
  }

  // Fetch post (including drafts)
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle()

  if (error) {
    console.error('Error fetching blog post:', error)
    notFound()
  }

  if (!post) {
    notFound()
  }

  // Prepare article metadata for layout
  const article = {
    title: post.title,
    description: post.description,
    author: 'Guapital Team',
    date: post.published_at || post.created_at,
    readingTime: post.reading_time_minutes ? `${post.reading_time_minutes} min` : '5 min',
    category: post.category || 'Uncategorized',
    tags: post.tags || [],
  }

  return (
    <div className="relative">
      {/* Preview Banner */}
      <div className="sticky top-0 z-50 border-b border-amber-300 bg-amber-100 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-amber-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-semibold text-amber-900">
              Preview Mode {!post.published_at && '(Draft)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/admin/blog/edit/${params.slug}`}
              className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
            >
              Edit
            </a>
            <a
              href="/admin/blog"
              className="rounded-lg border border-amber-300 bg-white px-4 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50"
            >
              Back to Admin
            </a>
          </div>
        </div>
      </div>

      {/* Rendered Content */}
      <ArticleLayout article={article}>
        <MDXRemote source={post.content} />
      </ArticleLayout>
    </div>
  )
}
