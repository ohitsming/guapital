
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (error) {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { full_name } = await request.json()

    const { data, error } = await supabase
        .from('profiles')
        .update({ full_name })
        .eq('id', user.id)
        .select()
        .single()

    if (error) {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return NextResponse.json(data)
}
