import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

    if (profileError) {
        // If no profile exists, return error with details
        console.error('Error fetching user profile:', profileError)
        return new NextResponse(JSON.stringify({ error: profileError.message, code: profileError.code }), { status: 500 })
    }

    return NextResponse.json({
        fullName: profileData.full_name || '',
        email: profileData.email || '',
    })
}

export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { fullName } = await request.json()

    // Update full_name in user_profiles table
    const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

    if (profileError) {
        console.error('Error updating user profile:', profileError)
        return new NextResponse(JSON.stringify({ error: profileError.message }), { status: 500 })
    }

    return NextResponse.json({ message: 'Profile updated successfully' })
}