import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const supabase = createClient()
    const { businessName, industry, industryOther, companySize, yourRole, goal_and_description } = await req.json()

    if (!businessName) {
        return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('businesses')
        .insert([
            {
                user_id: user.id,
                business_name: businessName,
                industry: industry,
                industry_other: industryOther,
                company_size: companySize,
                your_role: yourRole,
                goal_and_description: goal_and_description
            },
        ])

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update user's profile with 'business' role
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', user.id)
        .single()

    if (profileError) {
        console.error('Error fetching user profile for role update:', profileError)
        return NextResponse.json({ error: 'Failed to update user role.' }, { status: 500 })
    }

    const currentRoles = profileData?.roles || []
    if (!currentRoles.includes('business')) {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ roles: [...currentRoles, 'business'],  onboarding: true })
            .eq('id', user.id)

        if (updateError) {
            console.error('Error updating user roles:', updateError)
            return NextResponse.json({ error: 'Failed to update user role.' }, { status: 500 })
        }
    }

    return NextResponse.json({ data }, { status: 201 })
}
