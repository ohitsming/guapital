'use client';

import Link from "next/link";
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";
import { useEffect, useState } from "react";

interface Campaign {
    id: string;
    title: string;
    description: string;
    campaign_budget: number;
    participant_quota: number;
    is_active: boolean;
}

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const response = await fetch('/api/supabase/businesses/business-tasks');
                if (!response.ok) {
                    throw new Error('Failed to fetch campaigns');
                }
                const data = await response.json();
                setCampaigns(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCampaigns();
    }, []);

    const getStatus = (isActive: boolean) => {
        // You can expand this logic later if you add more statuses like 'draft' or 'completed'
        return isActive ? { text: 'Active', className: 'bg-green-100 text-green-800' } : { text: 'Inactive', className: 'bg-gray-100 text-gray-800' };
    };

    return (
        <Container className="">
            <div className="mx-auto py-12">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Campaigns</h1>
                    <Button href="/dashboard/business/campaigns/new">
                        Create New Campaign
                    </Button>
                </div>

                {isLoading ? (
                    <p>Loading campaigns...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : campaigns.length === 0 ? (
                    <p className="mt-4 text-gray-600">You don&apos;t have any campaigns yet. Click &quot;Create New Campaign&quot; to get started!</p>
                ) : campaigns.length === 0 ? (
                    <p className="mt-4 text-gray-600">You don&apos;t have any campaigns yet. Click &quot;Create New Campaign&quot; to get started!</p>
                ) : (
                    <div>
                        {/* Mobile view - Card layout */}
                        <div className="md:hidden">
                            {campaigns.map((campaign) => {
                                const status = getStatus(campaign.is_active);
                                return (
                                    <div key={campaign.id} className="bg-white shadow-md rounded-lg p-4 mb-4">
                                        <div className="flex justify-between items-start">
                                            <h2 className="text-lg font-bold text-gray-900">{campaign.title}</h2>
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>
                                                {status.text}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                                        <div className="flex justify-between items-center mt-4 text-sm">
                                            <div className="text-gray-700">
                                                <span className="font-semibold">Budget:</span> ${campaign.campaign_budget}
                                            </div>
                                            <div className="text-gray-700">
                                                <span className="font-semibold">Quota:</span> {campaign.participant_quota}
                                            </div>
                                        </div>
                                        <div className="mt-4 text-right">
                                            <Link href={`/dashboard/business/campaigns/${campaign.id}`} className="text-neutral-600 hover:text-neutral-900 font-medium">
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop view - Table layout */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                        <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                                        <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quota</th>
                                        <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {campaigns.map((campaign) => {
                                        const status = getStatus(campaign.is_active);
                                        return (
                                            <tr key={campaign.id}>
                                                <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">{campaign.title}</td>
                                                <td className="py-4 px-6 text-sm text-gray-500">{campaign.description}</td>
                                                <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">${campaign.campaign_budget}</td>
                                                <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">{campaign.participant_quota}</td>
                                                <td className="py-4 px-6 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 whitespace-nowrap text-sm font-medium">
                                                    <Link href={`/dashboard/business/campaigns/${campaign.id}`} className="text-neutral-600 hover:text-neutral-900">
                                                        View
                                                    </Link>
                                                    {/* Add edit link if applicable based on status */}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Container>
    )
}