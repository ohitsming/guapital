import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // Fetch user profile to get onboarding status
    const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('onboarding')
        .eq('id', user.id)
        .single()

    if (userProfileError && userProfileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', userProfileError)
        return NextResponse.json({ error: userProfileError.message }, { status: 500 })
    }

    // Fetch earner profile
    const { data: earnerProfile, error: earnerError } = await supabase
        .from('earners')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Fetch business profile
    const { data: businessProfile, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (earnerError && earnerError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching earner profile:', earnerError)
        return NextResponse.json({ error: earnerError.message }, { status: 500 })
    }

    if (businessError && businessError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching business profile:', businessError)
        return NextResponse.json({ error: businessError.message }, { status: 500 })
    }

    return NextResponse.json({
        onboardingCompleted: userProfile?.onboarding || false,
        earnerProfile: earnerProfile || null,
        businessProfile: businessProfile || null,
    })
}
