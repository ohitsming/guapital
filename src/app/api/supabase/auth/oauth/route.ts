import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/env'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const siteUrl = getBaseUrl(origin);
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // After successful OAuth login, redirect to dashboard
      const redirectUrl = new URL(next, siteUrl);
      return NextResponse.redirect(redirectUrl)
    }
  }

  // return the user to an error page with instructions
  const redirectUrl = new URL('/auth/auth-code-error', siteUrl);
  return NextResponse.redirect(redirectUrl)
}
