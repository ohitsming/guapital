import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  checkRateLimit,
  getRateLimitCategory,
  getRateLimitIdentifier,
} from '@/lib/ratelimit'

export async function middleware(request: NextRequest) {
  // =====================================================
  // Rate Limiting (with user-based identification)
  // =====================================================
  // Protect API routes from abuse
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Get user ID first (for per-user rate limiting)
    // This prevents shared IP issues (offices, NATs, coffee shops)
    let userId: string | undefined = undefined

    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {
              // No-op for read-only auth check
            },
          },
        }
      )

      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    } catch (error) {
      // If auth check fails, continue with IP-based rate limiting
      console.error('Rate limit auth check failed:', error)
    }

    // Determine rate limit category based on path
    const category = getRateLimitCategory(request.nextUrl.pathname)

    // Get identifier (prefers user ID, falls back to IP)
    const identifier = getRateLimitIdentifier(request, userId)

    // Check rate limit
    const rateLimitResult = await checkRateLimit(identifier, category)

    // Return 429 if rate limit exceeded
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
          limit: rateLimitResult.limit,
          remaining: 0,
          reset: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': rateLimitResult.resetSeconds.toString(),
          },
        }
      )
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set(
      'X-RateLimit-Remaining',
      rateLimitResult.remaining.toString()
    )
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

    // Continue to Supabase auth check with rate limit headers
    return response
  }

  // =====================================================
  // Supabase Auth
  // =====================================================
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect authenticated users from login/signup/home to dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}