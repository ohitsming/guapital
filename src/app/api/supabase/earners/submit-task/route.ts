import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId, answers } = await request.json()

    if (!taskId || !answers) {
        return NextResponse.json({ error: 'Task ID and answers are required' }, { status: 400 })
    }

    // Fetch task questions to validate answers
    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('questions')
        .eq('id', taskId)
        .single()

    if (taskError || !task) {
        console.error('Error fetching task for validation:', taskError)
        return NextResponse.json({ error: 'Task not found or inaccessible' }, { status: 404 })
    }

    // Ensure all questions are answered
    const surveyQuestions = task.questions as Array<{ text: string; type: string; options?: string[] }>;
    if (answers.length !== surveyQuestions.length) {
        return NextResponse.json({ error: 'All questions must be answered.' }, { status: 400 })
    }

    for (let i = 0; i < surveyQuestions.length; i++) {
        const question = surveyQuestions[i];
        const answer = answers[i];

        // Check if answer exists and is not empty
        if (!answer || answer.answer === undefined || answer.answer === null || answer.answer === '') {
            return NextResponse.json({ error: 'All questions must be answered.' }, { status: 400 })
        }

        // Additional validation based on question type (optional but good practice)
        if (question.type === 'multiple-choice' || question.type === 'yes-no') {
            // Ensure the answer is one of the valid options
            if (question.options && !question.options.includes(answer.answer)) {
                return NextResponse.json({ error: `Invalid answer for question ${i + 1}.` }, { status: 400 })
            }
        } else if (question.type === 'rating-scale') {
            // Ensure rating is a number between 1 and 5
            const rating = parseInt(answer.answer);
            if (isNaN(rating) || rating < 1 || rating > 5) {
                return NextResponse.json({ error: `Invalid rating for question ${i + 1}.` }, { status: 400 })
            }
        }
        // For open-ended, just check if not empty (already done above)
    }

    const { data, error } = await supabase.rpc('submit_task_response', {
        p_user_id: user.id,
        p_task_id: taskId,
        p_answers: answers,
    })

    if (error) {
        console.error('Error submitting task response:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json({ result: data })
}
