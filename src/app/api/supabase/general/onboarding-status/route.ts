import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
        console.error("Error fetching user:", userError);
    }
    
    if (user) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding')
            .eq('id', user.id)
            .single()
        
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ onboardingCompleted: profile?.onboarding ?? false })
    } else {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }
}
