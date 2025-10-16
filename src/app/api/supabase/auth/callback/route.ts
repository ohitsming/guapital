import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const siteUrl = process.env.NEXT_PUBLIC_ENV_URL || origin;
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    if (code) {
        // The auth code from Supabase sometimes includes a '}' character.
        const cleanedCode = code.replace(/}/g, '').replace(/%7D/g, '');
        const supabase = createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(cleanedCode)
        if (!error) {
            await supabase.auth.signOut()
            const redirectUrl = new URL('/auth/confirm/success', siteUrl)
            return NextResponse.redirect(redirectUrl)
        }
    }

    // Redirect to error page with details if available
    const errorRedirectUrl = new URL('/auth/auth-code-error', siteUrl)
    if (error) {
        errorRedirectUrl.searchParams.set('error', error)
    }
    if (error_description) {
        errorRedirectUrl.searchParams.set('error_description', error_description)
    }
    return NextResponse.redirect(errorRedirectUrl)
}
