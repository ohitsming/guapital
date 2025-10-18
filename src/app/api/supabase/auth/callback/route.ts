import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const siteUrl = process.env.NEXT_PUBLIC_ENV_URL || origin;
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // After successful login, check if user has user_settings (indicates onboarding completed)
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle()

      // If settings exist, user has completed onboarding
      if (settings) {
        const redirectUrl = new URL(next, siteUrl);
        return NextResponse.redirect(redirectUrl)
      } else {
        // New user - redirect to onboarding or dashboard
        // For now, just redirect to dashboard (we'll build onboarding later)
        const redirectUrl = new URL('/dashboard', siteUrl);
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // return the user to an error page with instructions
  const redirectUrl = new URL('/auth/auth-code-error', siteUrl);
  return NextResponse.redirect(redirectUrl)
}
