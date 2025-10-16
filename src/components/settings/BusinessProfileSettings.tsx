'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';

export default function BusinessProfileSettings() {
    const [isProfileEditing, setIsProfileEditing] = useState(false);

    const [businessName, setBusinessName] = useState('');
    const [businessDescription, setBusinessDescription] = useState('');

    const [initialProfileState, setInitialProfileState] = useState({ businessName: '', businessDescription: '' });

    useEffect(() => {
        const fetchBusinessProfile = async () => {
            try {
                const response = await fetch('/api/supabase/settings/business-profile');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setBusinessName(data.businessName || '');
                setBusinessDescription(data.businessDescription || '');
                setInitialProfileState({
                    businessName: data.businessName || '',
                    businessDescription: data.businessDescription || '',
                });
            } catch (error) {
                console.error('Failed to fetch business profile:', error);
            }
        };

        fetchBusinessProfile();
    }, []);

    const handleSaveProfile = async () => {
        try {
            const response = await fetch('/api/supabase/settings/business-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    businessName,
                    businessDescription,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Business profile saved:', data);
            setInitialProfileState({
                businessName,
                businessDescription,
            });
            setIsProfileEditing(false);
        } catch (error) {
            console.error('Failed to save business profile:', error);
        }
    };

    const handleCancelProfileEdit = () => {
        setBusinessName(initialProfileState.businessName);
        setBusinessDescription(initialProfileState.businessDescription);
        setIsProfileEditing(false);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md border border-neutral-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Edit Business Profile</h2>
                {!isProfileEditing && (
                    <Button type="button" onClick={() => setIsProfileEditing(true)}>Edit</Button>
                )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                <div className="space-y-6">
                    <TextField
                        label="Business Name"
                        id="businessName"
                        name="businessName"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        disabled={!isProfileEditing}
                    />
                    <TextField
                        label="Business Description"
                        id="businessDescription"
                        name="businessDescription"
                        type="textarea"
                        rows={4}
                        value={businessDescription}
                        onChange={(e) => setBusinessDescription(e.target.value)}
                        disabled={!isProfileEditing}
                    />
                </div>
                {isProfileEditing && (
                    <div className="mt-8 flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={handleCancelProfileEdit}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                )}
            </form>
        </div>
    );
}
