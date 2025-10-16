import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { getRecommendedMaxQuota } from '@/lib/quota';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createClient();
    const maxQuota = await getRecommendedMaxQuota(supabase);
    return NextResponse.json({ max_quota: maxQuota });
}
