import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * On-Demand Revalidation API
 * Triggers Next.js to regenerate specific pages after blog updates
 *
 * Usage:
 * POST /api/revalidate?path=/blog/slug
 *
 * Note: This is called internally by the admin panel after publishing/editing posts.
 * No secret needed since it's only called from authenticated admin routes.
 */
export async function POST(request: NextRequest) {
  try {
    // Get path from query params
    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get('path')

    // Validate path
    if (!path) {
      return NextResponse.json(
        { message: 'Path is required' },
        { status: 400 }
      )
    }

    // Revalidate the path
    revalidatePath(path)

    return NextResponse.json(
      {
        revalidated: true,
        path,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { message: 'Error revalidating', error: String(error) },
      { status: 500 }
    )
  }
}
