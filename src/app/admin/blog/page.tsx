import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/utils/formatters'
import RevalidateButton from '@/components/blog/RevalidateButton'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Blog Admin | Guapital',
  description: 'Manage blog posts',
}

// Force dynamic rendering - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminBlogPage() {
  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  if (!adminEmails.includes(user.email || '')) {
    redirect('/dashboard')
  }

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
  }

  const publishedPosts = posts?.filter(p => p.published_at) || []
  const draftPosts = posts?.filter(p => !p.published_at) || []

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Admin</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage your blog posts and content
              </p>
            </div>
            <Link
              href="/admin/blog/upload"
              className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition hover:bg-teal-700"
            >
              + New Post
            </Link>
          </div>
          <div className="mt-4">
            <RevalidateButton />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Total Posts</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {posts?.length || 0}
            </dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Published</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600">
              {publishedPosts.length}
            </dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Drafts</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-amber-600">
              {draftPosts.length}
            </dd>
          </div>
        </div>

        {/* Drafts */}
        {draftPosts.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Drafts</h2>
            <div className="overflow-hidden bg-white shadow sm:rounded-lg">
              <ul className="divide-y divide-gray-200">
                {draftPosts.map((post) => (
                  <PostListItem key={post.id} post={post} isDraft />
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Published Posts */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-gray-900">Published Posts</h2>
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            {publishedPosts.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-500">
                No published posts yet
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {publishedPosts.map((post) => (
                  <PostListItem key={post.id} post={post} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PostListItem({ post, isDraft = false }: { post: any; isDraft?: boolean }) {
  return (
    <li className="px-6 py-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
            {isDraft && (
              <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                Draft
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{post.description}</p>
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span>Category: {post.category || 'N/A'}</span>
            <span>•</span>
            <span>
              {isDraft
                ? `Created ${formatDate(post.created_at)}`
                : `Published ${formatDate(post.published_at)}`}
            </span>
            {post.view_count && (
              <>
                <span>•</span>
                <span>{post.view_count} views</span>
              </>
            )}
          </div>
        </div>
        <div className="ml-6 flex items-center gap-2">
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View
          </Link>
          <Link
            href={`/admin/blog/edit/${post.slug}`}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Edit
          </Link>
        </div>
      </div>
    </li>
  )
}
