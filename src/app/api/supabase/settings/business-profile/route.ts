import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('businesses')
        .select('business_name, industry, industry_other, company_size, your_role, goal_and_description')
        .eq('user_id', user.id)
        .single()

    if (error) {
        // If no business profile exists, return default values
        if (error.code === 'PGRST116') {
            return NextResponse.json({
                businessName: '',
                businessWebsite: '', // This field is not in the DB, will need to be handled client-side or added
                businessDescription: '',
            })
        }
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return NextResponse.json({
        businessName: data.business_name,
        // businessWebsite: data.website, // Assuming 'website' field exists in 'businesses' table
        businessDescription: data.goal_and_description,
    })
}

export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { businessName, businessDescription } = await request.json()

    const { data, error } = await supabase
        .from('businesses')
        .update({
            business_name: businessName,
            goal_and_description: businessDescription,
        })
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) {
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return NextResponse.json(data)
}