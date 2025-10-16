'use client';

import { useEffect, useState } from 'react';
import { Container } from "@/components/Container";
import Link from 'next/link';

import { StatCardProps } from '@/lib/interfaces/stat';
import { RecentTask } from '@/lib/interfaces/recentTask';
import { BusinessStats } from '@/lib/interfaces/businessStats';

const StatCard: React.FC<StatCardProps> = ({ title, value, isLoading }) => (
    <div className="bg-white rounded-lg shadow border border-neutral-300 p-6">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {isLoading ? (
            <div className="mt-2 h-8 w-16 bg-gray-200 animate-pulse rounded-md"></div>
        ) : (
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        )}
    </div>
);
export default function Dashboard() {
    const [stats, setStats] = useState<BusinessStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/supabase/businesses/business-stats');
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data.');
                }
                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Campaigns" value={stats?.totalTasks ?? 0} isLoading={isLoading} />
                <StatCard title="Active Campaigns" value={stats?.activeTasks ?? 0} isLoading={isLoading} />
                <StatCard title="Completed Campaigns" value={stats?.completedTasks ?? 0} isLoading={isLoading} />
            </div>

            <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900">Campaigns</h2>
                {isLoading ? (
                    <ul className="mt-4 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <li key={i} className="rounded-lg bg-white p-4 shadow animate-pulse">
                                <div className="h-6 w-3/4 bg-gray-200 rounded-md"></div>
                                <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded-md"></div>
                                <div className="mt-1 h-4 w-1/3 bg-gray-200 rounded-md"></div>
                            </li>
                        ))}
                    </ul>
                ) : error ? (
                    <p className="mt-4 text-red-500">{error}</p>
                ) : stats?.recentTasks.length === 0 ? (
                    <p className="mt-4 text-gray-600">No recent tasks to display.</p>
                ) : (
                    <ul className="mt-4 space-y-4">
                        {stats?.recentTasks.map(task => (
                            <li key={task.id} className="rounded-lg bg-white p-4 shadow border border-neutral-200">
                                <Link href={`/dashboard/business/campaigns/${task.id}`}>
                                    <h3 className="text-lg font-semibold text-gray-900 hover:text-neutral-600">{task.title}</h3>
                                    <p className={`text-sm font-medium ${task.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                                        Status: {task.is_active ? 'Active' : 'Inactive'}
                                    </p>
                                    <p className="text-sm text-gray-600">Responses: {task.responseCount}/{task.participant_quota}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

