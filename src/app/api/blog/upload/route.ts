import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import matter from 'gray-matter'
import { revalidatePath } from 'next/cache'

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
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
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file content
    const content = await file.text()

    // Parse MDX frontmatter
    const { data: frontmatter, content: mdxContent } = matter(content)

    // Validate required fields
    const requiredFields = ['title', 'slug', 'description', 'author', 'date', 'category']
    const missingFields = requiredFields.filter((field) => !frontmatter[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required frontmatter fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Insert into database
    const { data, error } = await supabase
      .from('blog_posts')
      .upsert(
        {
          slug: frontmatter.slug,
          title: frontmatter.title,
          description: frontmatter.description,
          content: mdxContent,
          category: frontmatter.category,
          tags: frontmatter.tags || [],
          published: true, // Auto-publish on upload
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'slug',
        }
      )
      .select()
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    // Trigger revalidation (direct, more reliable than HTTP fetch)
    try {
      revalidatePath(`/blog/${frontmatter.slug}`, 'page')
      revalidatePath('/blog', 'page')
      revalidatePath('/admin/blog', 'page')
      console.log('Revalidated blog paths after upload:', frontmatter.slug)
    } catch (revalidateError) {
      // Log to Sentry but don't fail the request
      const { captureException } = await import('@/utils/sentry')
      captureException(revalidateError, {
        operation: 'blog-revalidation',
        slug: frontmatter.slug,
        action: 'upload'
      }, 'warning')
      console.error('Revalidation error:', revalidateError)
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Post published successfully',
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
