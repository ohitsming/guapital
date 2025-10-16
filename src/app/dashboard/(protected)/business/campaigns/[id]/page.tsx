'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container } from '@/components/Container';
import { Task } from '@/lib/interfaces/task';
import CriteriaDisplay from '@/components/CriteriaDisplay';
import Link from 'next/link';
import { Button } from '@/components/Button'; // Corrected import
import { TargetingCriteria } from '@/lib/interfaces/criteria'; // Import TargetingCriteria

// Helper function to check if targeting criteria has any data
const hasTargetingCriteria = (criteria: TargetingCriteria | undefined): boolean => {
    if (!criteria) return false;
    for (const key in criteria) {
        const value = (criteria as any)[key];
        if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
            return true;
        }
    }
    return false;
};

export default function CampaignDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchTask = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/supabase/earners/get-task?id=${id}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch campaign details.');
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

    const handleDelete = async () => {
        try {
            const response = await fetch('/api/supabase/businesses/delete-campaign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ campaignId: id }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete campaign.');
            }

            console.log('Campaign deleted successfully.');
            setShowDeleteModal(false);
            router.push('/dashboard/business'); // Redirect to campaigns list
        } catch (err) {
            console.error('Error deleting campaign:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during deletion.');
            setShowDeleteModal(false); // Close modal even on error
        }
    };

    if (isLoading) {
        return <Container><p>Loading campaign details...</p></Container>;
    }

    if (error) {
        return <Container><p className="text-red-500">Error: {error}</p></Container>;
    }

    if (!task) {
        return <Container><p>Campaign not found.</p></Container>;
    }

    return (
        <Container>
            <div className="py-12">
                <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
                <p className="text-gray-600 mb-8">{task.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    <div className="md:col-span-2 space-y-8">
                        {/* Questions Section */}
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold">Survey Questions</h2>
                                <div className="flex gap-2">
                                    <Link href={`/dashboard/business/campaigns/${task.id}/edit`}>
                                        <Button type="button" className="px-4 py-2 text-sm" 
                                            style={{backgroundColor: 'rgb(199, 199, 199)', color: 'black'}}>Edit</Button>
                                    </Link>
                                    <Link href={`/preview/survey/${task.id}`} target="_blank" rel="noopener noreferrer">
                                        <Button type="button" className="px-4 py-2 text-sm">Preview</Button>
                                    </Link>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {task.questions?.length > 0 ? (
                                    task.questions.map((q, index) => (
                                        <div key={index} className="p-4 rounded-lg bg-gray-50">
                                            <p className="font-medium">{index + 1}. {q.text}</p>
                                            <p className="text-sm text-gray-500 capitalize mt-1">Type: {q.type.replace('-', ' ')}</p>
                                            {q.options && q.options.length > 0 && q.type !== 'rating-scale' && (
                                                <ul className="list-disc pl-6 mt-2 text-sm text-gray-700">
                                                    {q.options.map((opt, i) => <li key={i}>{opt}</li>)}
                                                </ul>
                                            )}
                                            
                                        </div>
                                    ))
                                ) : (
                                    <p>No questions found for this campaign.</p>
                                )}
                            </div>
                        </div>

                        {/* Targeting Criteria Section */}
                        {task.targeting_criteria && hasTargetingCriteria(task.targeting_criteria) && (
                            <div>
                                <h2 className="text-2xl font-semibold mb-4">Targeting Criteria</h2>
                                <div className="p-4 border rounded-lg bg-gray-50">
                                    <CriteriaDisplay criteria={task.targeting_criteria} />
                                </div>
                            </div>
                        )}

                        {/* Danger Zone */}
                        <div className="mt-12 p-6 border border-red-800 rounded-lg">
                            <h2 className="text-2xl font-bold text-red-800">Danger Zone</h2>
                            <p className="text-gray-600 mt-2 mb-4">These actions are irreversible. Please be certain.</p>
                            <Button
                                type="button"
                                className="px-4 py-2 text-sm bg-red-800 hover:bg-red-900 text-white"
                                onClick={() => setShowDeleteModal(true)}>
                                Delete Task
                            </Button>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="space-y-4">
                         <div className="p-6 border border-neutral-300 rounded-lg shadow-sm bg-white">
                            <h3 className="text-xl font-semibold mb-4">Campaign Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">Status:</span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {task.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">Budget:</span>
                                    <span>${task.campaign_budget}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">Participant Quota:</span>
                                    <span>{task.participant_quota}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">Created:</span>
                                    <span>{new Date(task.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-neutral-100 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
                        <h2 className="text-2xl font-bold mb-4">Confirm Deletion</h2>
                        <p className="mb-6">Are you sure you want to delete this survey? This action cannot be undone.</p>
                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-black"
                                onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleDelete}>
                                Confirm Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Container>
    );
}