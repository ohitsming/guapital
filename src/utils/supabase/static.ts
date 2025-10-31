import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Static Supabase client for build-time data fetching (SSG)
 *
 * Use this client ONLY for:
 * - generateStaticParams()
 * - generateMetadata()
 * - Server Components during build time
 *
 * DO NOT use for authenticated requests or runtime data.
 * For runtime requests, use @/utils/supabase/server or @/utils/supabase/client
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
