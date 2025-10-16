import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const supabase = createClient();

    // RLS policies will handle row-level access control, but we must authenticate the user first.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: task, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            // PGRST116 means no rows were found, which is a 404 for a specific resource.
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Task not found' }, { status: 404 });
            }
            console.error('Error fetching task:', error);
            return NextResponse.json({ error: 'Failed to fetch task.', details: error.message }, { status: 500 });
        }

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json(task, { status: 200 });

    } catch (error) {
        console.error('Unexpected error fetching task:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
