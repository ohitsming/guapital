import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic'

/**
 * GET all published blog posts (minimal data for revalidation)
 * Used by admin panel to get list of slugs for cache revalidation
 */
export async function GET() {
  try {
    const supabase = createClient()

    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, title')
      .eq('published', true)
      .order('published_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
