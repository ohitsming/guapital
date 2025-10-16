'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ToastProvider, useToast } from '@/components/toast/ToastProvider';
import LoadingOverlay from '@/components/LoadingOverlay';

interface UserProfile {
    id: string;
    full_name: string | null;
    // Add other common profile fields here if needed
}

function ProfileSettingsContent() {
    const { showToast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/supabase/settings/profile');
                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }
                const data: UserProfile = await response.json();
                setProfile(data);
            } catch (error: any) {
                console.error('Error fetching profile:', error);
                showToast(error.message || 'Failed to load profile.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [showToast, router]);

    if (loading) {
        return <LoadingOverlay show={loading} message="Loading profile..." />;
    }

    return (
        <div className="container mx-auto py-12 px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Full Name
                        </label>
                        <p className="mt-1 text-lg text-gray-900">
                            {profile?.full_name || 'N/A'}
                        </p>
                    </div>
                    {/* Add other common profile fields here to display */}
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <ToastProvider>
            <ProfileSettingsContent />
        </ToastProvider>
    );
}