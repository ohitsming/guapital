import { createClient } from '@/utils/supabase/server'
import { ArticleLayout } from '@/components/blog/ArticleLayout'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { NetWorthChart } from '@/components/blog/charts'

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic'

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
    <ArticleLayout article={article}>
      <MDXRemote
        source={post.content}
        components={{
          NetWorthChart,
        }}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        }}
      />
    </ArticleLayout>
  )
}
