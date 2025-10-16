import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { PRE_LAUNCH_MODE } from './lib/featureFlags'; 

export async function middleware(request: NextRequest) {
    try {
        // --- PRE_LAUNCH_MODE Check --- //
        if (PRE_LAUNCH_MODE) {
            const preLaunchAllowedPaths = [
                '/',
                '/pricing',
                '/about',
                '/terms',
                '/privacy',
                // '/api/supabase', // Allow Supabase general API routes
                '/favicon.ico',
                '/_next/static',
                '/_next/image',
            ];

            const isPreLaunchAllowedPath = preLaunchAllowedPaths.some(path => request.nextUrl.pathname == path);

            if (!isPreLaunchAllowedPath) {
                const url = request.nextUrl.clone();
                url.pathname = '/';
                return NextResponse.redirect(url);
            }
        }
        // --- END PRE_LAUNCH_MODE Check --- //

        const response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        })
        const supabase = createClient()

        // Refresh session if expired and user has a session
        const { data: { user } } = await supabase.auth.getUser()

        const protectedPaths = [
            '/dashboard',
            '/dashboard/earner',
            '/dashboard/business',
            '/onboarding',
        ]

        const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

        if (isProtectedPath) {
            // console.log('Protected path accessed:', request.nextUrl.pathname)
            if (!user) {
                console.log('No user found, redirecting to login.')
                // Redirect unauthenticated users to login
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/login'
                return NextResponse.redirect(redirectUrl)
            }

            // Check onboarding status and roles
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('onboarding, roles')
                .eq('id', user.id)
                .single()

            if (profileError || !profile) {
                console.error('Error fetching profile or profile not found:', profileError)
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/'
                return NextResponse.redirect(redirectUrl)
            }

            if (request.nextUrl.pathname === '/onboarding') {
                if (profile.onboarding) {
                    console.log('User already onboarded, redirecting to dashboard.')
                    const redirectUrl = request.nextUrl.clone()
                    redirectUrl.pathname = '/dashboard'
                    return NextResponse.redirect(redirectUrl)
                }
            } else if (!profile.onboarding && request.nextUrl.pathname !== '/onboarding') {
                console.log('User not onboarded, redirecting to onboarding page.')
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/onboarding'
                return NextResponse.redirect(redirectUrl)
            }

            const userRoles = profile.roles || []

            // New: Redirect based on roles when accessing /dashboard
            if (request.nextUrl.pathname === '/dashboard') {
                if (userRoles.length === 0) {
                    // User has no roles, stay on /dashboard
                    // No redirect needed as they are already on /dashboard
                } else if (userRoles.length === 1 && userRoles.includes('business')) {
                    // User has ONLY 'business' role
                    const redirectUrl = request.nextUrl.clone()
                    redirectUrl.pathname = '/dashboard/business'
                    return NextResponse.redirect(redirectUrl)
                } else if (userRoles.includes('earner')) {
                    // User has 'earner' role (either only earner, or both earner and business)
                    const redirectUrl = request.nextUrl.clone()
                    redirectUrl.pathname = '/dashboard/earner'
                    return NextResponse.redirect(redirectUrl)
                }
            }

            // Role-based access control
            if (request.nextUrl.pathname.startsWith('/dashboard/business')) {
                if (!userRoles.includes('business')) {
                    console.log('User without "business" role trying to access business dashboard.')
                    // Redirect them to the earner dashboard, which is the default.
                    const redirectUrl = request.nextUrl.clone()
                    redirectUrl.pathname = '/dashboard/earner'
                    return NextResponse.redirect(redirectUrl)
                }
            } else if (request.nextUrl.pathname.startsWith('/dashboard/earner')) {
                if (!userRoles.includes('earner')) {
                    console.log('User without "earner" role trying to access earner dashboard.')
                    // This is an edge case, as 'earner' is the default role.
                    // If they have a 'business' role, send them there, otherwise to home.
                    const redirectUrl = request.nextUrl.clone()
                    redirectUrl.pathname = userRoles.includes('business') ? '/dashboard/business' : '/'
                    return NextResponse.redirect(redirectUrl)
                }
            }
        }

        return response
    } catch (e) {
        // If an error occurs, redirect to a safe page or show an error
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/'
        return NextResponse.redirect(redirectUrl)
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - Any API routes you want to exclude from pre-launch mode checks
         */
        '/((?!_next/static|_next/image|favicon.ico|api|pre-launch-page).*)',
    ],
}