import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Get the business_id for the current user
        const { data: businessData, error: businessError } = await supabase
            .from('businesses')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (businessError || !businessData) {
            console.error('Error fetching business for user:', businessError);
            // Return an empty array if no business is found, as it's not a server error
            return NextResponse.json([], { status: 200 });
        }

        // 2. Fetch all tasks for that business
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*') // Select all columns for now
            .eq('business_id', businessData.id)
            .order('created_at', { ascending: false }); // Show newest first

        if (tasksError) {
            console.error('Error fetching tasks:', tasksError);
            return NextResponse.json({ error: 'Failed to fetch tasks.', details: tasksError.message }, { status: 500 });
        }

        return NextResponse.json(tasks, { status: 200 });

    } catch (error) {
        console.error('Unexpected error in fetching tasks:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
