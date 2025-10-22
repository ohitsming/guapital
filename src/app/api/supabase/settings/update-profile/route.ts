import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { firstName, lastName } = await request.json()

    if (!firstName || !lastName) {
        return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 })
    }

    const fullName = `${firstName} ${lastName}`.trim()

    const { error } = await supabase
        .from('user_profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Profile updated successfully' })
}
