import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ exists: false, error: 'User not authenticated' }, { status: 401 });
    }

    try {
        const { data: earnerData, error: earnerError } = await supabase
            .from('earners')
            .select('user_id')
            .eq('user_id', user.id)
            .single();

        if (earnerError && earnerError.code !== 'PGRST116') { // PGRST116 means no rows found
            throw earnerError;
        }

        return NextResponse.json({ exists: !!earnerData }, { status: 200 });
    } catch (error: any) {
        console.error('API Earner Onboarding Status error:', error);
        return NextResponse.json({ exists: false, error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}
