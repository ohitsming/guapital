import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { FormattedEarnerTask } from '@/lib/interfaces/earnerTask';
import { Task } from '@/lib/interfaces/task';
import { calculateTimeEstimate } from '@/utils/timeUtils';

export async function GET(request: Request) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Handle pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10', 10), 20);
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    // Call the RPC function to get available tasks.
    // This function handles complex logic like demographic filtering, quota checks (including reservations),
    // and filtering out already completed tasks.
    const { data: rpcData, error: rpcError, count: totalCount } = await supabase
        .rpc('get_available_tasks', { p_user_id: user.id }, { count: 'exact' })
        .range(start, end);

    if (rpcError) {
        console.error('Error calling get_available_tasks RPC:', rpcError);
        return new NextResponse(JSON.stringify({ error: rpcError.message }), { status: 500 });
    }

    // The RPC function now returns the business name and filters out the user's own business tasks.
    const tasks: Task[] = rpcData || [];

    // Format the data for the frontend
    const formattedTasks: FormattedEarnerTask[] = tasks.map(task => ({
        id: task.id,
        title: task.title,
        business: task.business_name || 'A Business',
        payout: task.campaign_budget / task.participant_quota,
        // Using placeholders for fields not in the current 'tasks' table
        timeEstimate: calculateTimeEstimate(task.questions),
        questions: task.questions ? task.questions.length : 0,
        category: 'General',
    }));

    // Note: The `totalCount` is from before filtering out the user's own business tasks.
    // This is an acceptable trade-off to avoid re-implementing all logic.
    return NextResponse.json({ tasks: formattedTasks, totalCount });
}
