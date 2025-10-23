import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/env'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const siteUrl = getBaseUrl(origin);
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const type = searchParams.get('type') // 'signup' for email confirmation

  if (code) {
    const supabase = createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if this is an email confirmation from signup
      if (type === 'signup') {
        // Email confirmed - redirect to confirmation page
        const redirectUrl = new URL('/auth/email-confirmed', siteUrl);
        return NextResponse.redirect(redirectUrl)
      }

      // OAuth or existing user login - check if user has user_settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle()

      // If settings exist, redirect to next page (usually dashboard)
      if (settings) {
        const redirectUrl = new URL(next, siteUrl);
        return NextResponse.redirect(redirectUrl)
      } else {
        // New user from OAuth - redirect to dashboard
        // (user_settings will be created by trigger)
        const redirectUrl = new URL('/dashboard', siteUrl);
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // return the user to an error page with instructions
  const redirectUrl = new URL('/auth/auth-code-error', siteUrl);
  return NextResponse.redirect(redirectUrl)
}
