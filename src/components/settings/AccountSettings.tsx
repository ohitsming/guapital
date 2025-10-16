'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faLinkedin, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';

export default function AccountSettings() {
    const [isAccountEditing, setIsAccountEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [twitterUrl, setTwitterUrl] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [tiktokUrl, setTiktokUrl] = useState('');

    const [initialAccountState, setInitialAccountState] = useState({
        fullName: '',
        email: '',
        twitterUrl: '',
        linkedinUrl: '',
        instagramUrl: '',
        tiktokUrl: '',
    });

    useEffect(() => {
        const fetchAccountSettings = async () => {
            try {
                const response = await fetch('/api/supabase/settings/user-settings');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setFullName(data.fullName);
                setEmail(data.email);
                setTwitterUrl(data.twitterUrl || '');
                setLinkedinUrl(data.linkedinUrl || '');
                setInstagramUrl(data.instagramUrl || '');
                setTiktokUrl(data.tiktokUrl || '');
                setInitialAccountState({
                    fullName: data.fullName,
                    email: data.email,
                    twitterUrl: data.twitterUrl || '',
                    linkedinUrl: data.linkedinUrl || '',
                    instagramUrl: data.instagramUrl || '',
                    tiktokUrl: data.tiktokUrl || '',
                });
            } catch (error) {
                console.error('Failed to fetch account settings:', error);
            }
        };

        fetchAccountSettings();
    }, []);

    const handleSaveAccount = async () => {
        try {
            const response = await fetch('/api/supabase/settings/user-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName,
                    twitterUrl,
                    linkedinUrl,
                    instagramUrl,
                    tiktokUrl,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Account settings saved:', data);
            setInitialAccountState({
                fullName,
                email,
                twitterUrl,
                linkedinUrl,
                instagramUrl,
                tiktokUrl,
            });
            setIsAccountEditing(false);
        } catch (error) {
            console.error('Failed to save account settings:', error);
        }
    };

    const handleCancelAccountEdit = () => {
        setFullName(initialAccountState.fullName);
        setEmail(initialAccountState.email);
        setTwitterUrl(initialAccountState.twitterUrl);
        setLinkedinUrl(initialAccountState.linkedinUrl);
        setInstagramUrl(initialAccountState.instagramUrl);
        setTiktokUrl(initialAccountState.tiktokUrl);
        setIsAccountEditing(false);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-neutral-200">
                        <div className="relative h-40 bg-gray-200 rounded-t-lg">
                            {/* Placeholder for cover photo */}
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                                <div className="w-24 h-24 rounded-full bg-gray-300 border-4 border-white">
                                    {/* Placeholder for user avatar */}
                                </div>
                            </div>
                        </div>
                        <div className="mt-16 text-center">
                            <h2 className="text-xl font-bold">{fullName}</h2>
                            <p className="text-sm text-gray-500">{email}</p>
                            <div className="mt-4 flex justify-center space-x-4">
                                {twitterUrl && (
                                    <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                                        <FontAwesomeIcon icon={faTwitter} size="lg" />
                                    </a>
                                )}
                                {linkedinUrl && (
                                    <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                                        <FontAwesomeIcon icon={faLinkedin} size="lg" />
                                    </a>
                                )}
                                {instagramUrl && (
                                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                                        <FontAwesomeIcon icon={faInstagram} size="lg" />
                                    </a>
                                )}
                                {tiktokUrl && (
                                    <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                                        <FontAwesomeIcon icon={faTiktok} size="lg" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <div className="bg-white p-8 rounded-lg shadow-md border border-neutral-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Your Account Settings</h2>
                            <div className="flex gap-4">
                                <Button type="button" variant="outline" onClick={() => setShowPasswordModal(true)}>Change Password</Button>
                                {!isAccountEditing && (
                                    <Button type="button" onClick={() => setIsAccountEditing(true)}>Edit</Button>
                                )}
                            </div>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveAccount(); }}>
                            <div className="space-y-6">
                                <TextField
                                    label="Full Name"
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    disabled={!isAccountEditing}
                                />
                                <TextField
                                    label="Email Address"
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    disabled={true} // Email is read-only
                                />
                                <TextField
                                    label="Twitter Profile URL"
                                    id="twitterUrl"
                                    name="twitterUrl"
                                    type="url"
                                    value={twitterUrl}
                                    onChange={(e) => setTwitterUrl(e.target.value)}
                                    disabled={!isAccountEditing}
                                />
                                <TextField
                                    label="LinkedIn Profile URL"
                                    id="linkedinUrl"
                                    name="linkedinUrl"
                                    type="url"
                                    value={linkedinUrl}
                                    onChange={(e) => setLinkedinUrl(e.target.value)}
                                    disabled={!isAccountEditing}
                                />
                                <TextField
                                    label="Instagram Profile URL"
                                    id="instagramUrl"
                                    name="instagramUrl"
                                    type="url"
                                    value={instagramUrl}
                                    onChange={(e) => setInstagramUrl(e.target.value)}
                                    disabled={!isAccountEditing}
                                />
                                <TextField
                                    label="TikTok Profile URL"
                                    id="tiktokUrl"
                                    name="tiktokUrl"
                                    type="url"
                                    value={tiktokUrl}
                                    onChange={(e) => setTiktokUrl(e.target.value)}
                                    disabled={!isAccountEditing}
                                />
                            </div>
                            {isAccountEditing && (
                                <div className="mt-8 flex justify-end gap-4">
                                    <Button type="button" variant="outline" onClick={handleCancelAccountEdit}>Cancel</Button>
                                    <Button type="submit">Save Changes</Button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            {showPasswordModal && (
                <div className="fixed inset-0 bg-neutral-100 bg-opacity-50 flex items-center justify-center z-[99999]">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6">Change Password</h2>
                        <form>
                            <div className="space-y-6">
                                <TextField
                                    label="Current Password"
                                    id="currentPassword"
                                    name="currentPassword"
                                    type="password"
                                />
                                <TextField
                                    label="New Password"
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                />
                                <TextField
                                    label="Confirm New Password"
                                    id="confirmNewPassword"
                                    name="confirmNewPassword"
                                    type="password"
                                />
                            </div>
                            <div className="mt-8 flex justify-end gap-4">
                                <Button type="button" variant="outline" onClick={() => setShowPasswordModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Update Password</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}