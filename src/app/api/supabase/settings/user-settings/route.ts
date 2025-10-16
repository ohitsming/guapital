import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

    if (profileError) {
        return new NextResponse(JSON.stringify({ error: profileError.message }), { status: 500 })
    }

    const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('twitter_url, linkedin_url, instagram_url, tiktok_url')
        .eq('user_id', user.id)
        .single()

    if (settingsError) {
        // If no settings row exists, return default social media values
        if (settingsError.code === 'PGRST116') {
            return NextResponse.json({
                fullName: profileData.full_name,
                email: profileData.email,
                twitterUrl: '',
                linkedinUrl: '',
                instagramUrl: '',
                tiktokUrl: '',
            })
        }
        return new NextResponse(JSON.stringify({ error: settingsError.message }), { status: 500 })
    }

    return NextResponse.json({
        fullName: profileData.full_name,
        email: profileData.email,
        twitterUrl: settingsData.twitter_url,
        linkedinUrl: settingsData.linkedin_url,
        instagramUrl: settingsData.instagram_url,
        tiktokUrl: settingsData.tiktok_url,
    })
}

export async function POST(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { fullName, twitterUrl, linkedinUrl, instagramUrl, tiktokUrl } = await request.json()

    // Update full_name in profiles table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

    if (profileError) {
        return new NextResponse(JSON.stringify({ error: profileError.message }), { status: 500 })
    }

    // Upsert social media links in user_settings table
    const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
            user_id: user.id,
            twitter_url: twitterUrl,
            linkedin_url: linkedinUrl,
            instagram_url: instagramUrl,
            tiktok_url: tiktokUrl,
        }, { onConflict: 'user_id' })

    if (settingsError) {
        return new NextResponse(JSON.stringify({ error: settingsError.message }), { status: 500 })
    }

    return NextResponse.json({ message: 'Account settings updated successfully' })
}