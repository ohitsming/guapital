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
      // After successful login, check if onboarding is completed.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        // Handle error, maybe redirect to an error page
        console.error(profileError)
        const redirectUrl = new URL('/auth/auth-code-error', siteUrl);
        return NextResponse.redirect(redirectUrl)
      }

      if (profile.onboarding) {
        const redirectUrl = new URL(next, siteUrl);
        return NextResponse.redirect(redirectUrl)
      } else {
        const redirectUrl = new URL('/onboarding', siteUrl);
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // return the user to an error page with instructions
  const redirectUrl = new URL('/auth/auth-code-error', siteUrl);
  return NextResponse.redirect(redirectUrl)
}
