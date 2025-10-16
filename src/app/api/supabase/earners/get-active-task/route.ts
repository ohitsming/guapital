import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find an active reservation for the user
    const { data: reservation, error: reservationError } = await supabase
        .from('task_reservations')
        .select('task_id, expires_at')
        .eq('user_id', user.id)
        .gt('expires_at', 'now()')
        .single()

    if (reservationError || !reservation) {
        return NextResponse.json({ error: 'No active task found' }, { status: 404 })
    }

    // Fetch the task details using the task_id from the reservation
    const { data: taskData, error: taskDataError } = await supabase
        .from('tasks')
        .select('id, title, description, campaign_budget, participant_quota, questions')
        .eq('id', reservation.task_id)
        .single()

    if (taskDataError || !taskData) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const individualPayout = taskData.campaign_budget && taskData.participant_quota
        ? taskData.campaign_budget / taskData.participant_quota
        : 0;

    const activeTask = {
        id: taskData.id,
        title: taskData.title,
        description: taskData.description,
        payout: individualPayout,
        questions: taskData.questions || [],
        expires_at: reservation.expires_at,
        timeEstimate: '30 minutes' // From reservation logic
    }

    return NextResponse.json({ task: activeTask })
}
