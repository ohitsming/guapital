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
            return NextResponse.json({ error: 'Business not found for user.' }, { status: 404 });
        }

        const businessId = businessData.id;

        // 2. Fetch all tasks for the business
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('id, title, is_active, participant_quota, created_at')
            .eq('business_id', businessId);

        if (tasksError) {
            throw tasksError;
        }

        // 3. Fetch all responses for those tasks to calculate completion
        const taskIds = tasks.map(t => t.id);
        const { data: responses, error: responsesError } = await supabase
            .from('task_responses')
            .select('task_id, status')
            .in('task_id', taskIds);

        if (responsesError) {
            throw responsesError;
        }

        // 4. Calculate stats
        const totalTasks = tasks.length;
        const activeTasks = tasks.filter(t => t.is_active).length;
        
        const completedTasks = tasks.filter(task => {
            const taskResponses = responses.filter(r => r.task_id === task.id && r.status === 'completed');
            return taskResponses.length >= task.participant_quota;
        }).length;

        const recentTasks = tasks
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .map(task => {
                const responseCount = responses.filter(r => r.task_id === task.id).length;
                return { ...task, responseCount };
            });


        return NextResponse.json({
            totalTasks,
            activeTasks,
            completedTasks,
            recentTasks
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching business stats:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return NextResponse.json({ error: 'Failed to fetch business stats.', details: errorMessage }, { status: 500 });
    }
}
