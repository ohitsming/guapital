import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    const supabase = createClient();

    try {
        const { data, error } = await supabase.from('interests').select('id, name');

        if (error) {
            console.error('Error fetching interests from API:', error);
            return NextResponse.json({ error: 'Failed to load interests.' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        console.error('Unexpected error in interests API:', err);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
