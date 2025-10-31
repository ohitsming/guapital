import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle()

  if (error) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  if (!adminEmails.includes(user.email || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        title: body.title,
        description: body.description,
        content: body.content,
        category: body.category,
        tags: body.tags,
        published_at: body.published_at,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', params.slug)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Trigger revalidation
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/revalidate?path=/blog/${params.slug}`,
        { method: 'POST' }
      )
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/revalidate?path=/blog`,
        { method: 'POST' }
      )
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/revalidate?path=/admin/blog`,
        { method: 'POST' }
      )
    } catch (revalidateError) {
      console.error('Revalidation error:', revalidateError)
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { slug: string } }) {
  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  if (!adminEmails.includes(user.email || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { error } = await supabase.from('blog_posts').delete().eq('slug', params.slug)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger revalidation
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/revalidate?path=/blog`,
        { method: 'POST' }
      )
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/revalidate?path=/admin/blog`,
        { method: 'POST' }
      )
    } catch (revalidateError) {
      console.error('Revalidation error:', revalidateError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
