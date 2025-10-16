
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { TargetingCriteria } from '@/lib/interfaces/criteria';
import { getRecommendedMaxQuota } from '@/lib/quota';

export async function POST(request: Request) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskData = await request.json();

    // Basic validation
    if (!taskData.title || !taskData.campaign_budget || !taskData.participant_quota || !taskData.questions) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const maxQuota = await getRecommendedMaxQuota(supabase);
    if (taskData.participant_quota > maxQuota) {
        return NextResponse.json({ error: `Participant quota cannot exceed the recommended maximum of ${maxQuota}.` }, { status: 400 });
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
            return NextResponse.json({ error: 'Could not find associated business for this user.' }, { status: 404 });
        }

        // 2. Prepare the data for insertion
        const taskToInsert = {
            business_id: businessData.id,
            title: taskData.title,
            description: taskData.description,
            campaign_budget: taskData.campaign_budget,
            participant_quota: taskData.participant_quota,
            questions: taskData.questions, // Already in JSON format
            targeting_criteria: taskData.targeting_criteria as TargetingCriteria, // Already in JSON format
            is_active: true, // Default to active
        };

        // 3. Insert the new task
        const { data: newTask, error: insertError } = await supabase
            .from('tasks')
            .insert(taskToInsert)
            .select()
            .single();

        if (insertError) {
            console.error('Error creating task:', insertError);
            return NextResponse.json({ error: 'Failed to create task.', details: insertError.message }, { status: 500 });
        }

        return NextResponse.json(newTask, { status: 201 });

    } catch (error) {
        console.error('Unexpected error in task creation:', error);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
