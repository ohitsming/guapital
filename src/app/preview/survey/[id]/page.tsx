'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@/components/Container';
import { Task } from '@/lib/interfaces/task';

export default function SurveyPreviewPage() {
    const params = useParams();
    const id = params.id as string;

    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchTask = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/supabase/earners/get-task?id=${id}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch survey details.');
                }
                const data = await response.json();
                setTask(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTask();
    }, [id]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
                <p>Loading survey preview...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
                <p className="text-red-500">Error: {error}</p>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
                <p>Survey not found.</p>
            </div>
        );
    }

    return (
        <Container className="py-12 pt-16 min-h-screen">
            <h1 className="text-3xl font-bold mb-2">Survey Preview: {task.title}</h1>
            <p className="text-gray-600 mb-8">{task.description}</p>

            <div className="space-y-6">
                {task.questions?.length > 0 ? (
                    task.questions.map((q, index) => (
                        <div key={index} className="p-6 border border-neutral-200 rounded-lg bg-white shadow-sm">
                            <p className="font-medium text-lg mb-2">{index + 1}. {q.text}</p>
                            <p className="text-sm text-gray-500 capitalize mb-4">Type: {q.type.replace('-', ' ')}</p>
                            
                            {q.type === 'multiple-choice' && q.options && q.options.length > 0 && (
                                <div className="space-y-2">
                                    {q.options.map((option, optIndex) => (
                                        <div key={optIndex} className="flex items-center">
                                            <input type="radio" id={`q${index}-opt${optIndex}`} name={`question-${index}`} className="mr-2" disabled />
                                            <label htmlFor={`q${index}-opt${optIndex}`} className="text-gray-700">{option}</label>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {q.type === 'yes-no' && (
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <input type="radio" id={`q${index}-yes`} name={`question-${index}`} className="mr-2" disabled />
                                        <label htmlFor={`q${index}-yes`} className="text-gray-700">Yes</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input type="radio" id={`q${index}-no`} name={`question-${index}`} className="mr-2" disabled />
                                        <label htmlFor={`q${index}-no`} className="text-gray-700">No</label>
                                    </div>
                                </div>
                            )}

                            {q.type === 'rating-scale' && (
                                <div className="flex items-center space-x-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span key={star} className="text-gray-400 text-2xl">★</span>
                                    ))}
                                </div>
                            )}

                            {q.type === 'open-ended' && (
                                <textarea className="w-full p-3 border border-neutral-300 rounded-md bg-gray-50" rows={4} placeholder="(Preview: User will type answer here)" disabled></textarea>
                            )}
                        </div>
                    ))
                ) : (
                    <p>No questions available for preview.</p>
                )}
            </div>
        </Container>
    );
}
