'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/Button'
import { TextField } from '@/components/TextField'
import { DropdownSelect } from '@/components/ui/DropdownSelect'
import { useToast } from '@/components/toast/ToastProvider'
import { AgeBracket } from '@/lib/interfaces/percentile'

const AGE_BRACKETS: { value: AgeBracket; label: string }[] = [
    { value: '18-21', label: '18-21 years' },
    { value: '22-25', label: '22-25 years' },
    { value: '26-28', label: '26-28 years' },
    { value: '29-32', label: '29-32 years' },
    { value: '33-35', label: '33-35 years' },
    { value: '36-40', label: '36-40 years' },
    { value: '41+', label: '41+ years' },
]

interface ProfileData {
    fullName: string
    email: string
    ageBracket: AgeBracket | ''
    dateOfBirth: string
    percentileOptedIn: boolean
}

export function ProfileSettings() {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const { showToast } = useToast()

    const [formData, setFormData] = useState<ProfileData>({
        fullName: '',
        email: '',
        ageBracket: '',
        dateOfBirth: '',
        percentileOptedIn: false,
    })

    const [initialData, setInitialData] = useState<ProfileData>({
        fullName: '',
        email: '',
        ageBracket: '',
        dateOfBirth: '',
        percentileOptedIn: false,
    })

    const fetchProfileData = useCallback(async () => {
        try {
            setIsLoading(true)

            // Fetch basic profile data
            const profileRes = await fetch('/api/supabase/settings/user-settings')
            if (!profileRes.ok) throw new Error('Failed to fetch profile')
            const profileData = await profileRes.json()

            // Fetch demographics data
            const demoRes = await fetch('/api/percentile')
            const demoData = await demoRes.json()

            const data: ProfileData = {
                fullName: profileData.fullName || '',
                email: profileData.email || '',
                ageBracket: demoData.age_bracket || '',
                dateOfBirth: '', // We don't expose actual DOB for privacy
                percentileOptedIn: demoData.opted_in || false,
            }

            setFormData(data)
            setInitialData(data)
        } catch (error) {
            console.error('Error fetching profile:', error)
            showToast('Failed to load profile data', 'error')
        } finally {
            setIsLoading(false)
        }
    }, [showToast])

    useEffect(() => {
        fetchProfileData()
    }, [fetchProfileData])

    const handleSave = async () => {
        try {
            setIsSaving(true)

            // Update basic profile info
            const profileRes = await fetch('/api/supabase/settings/user-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                }),
            })

            if (!profileRes.ok) throw new Error('Failed to update profile')

            // Update demographics if age bracket changed and user is opted in
            if (formData.ageBracket && formData.ageBracket !== initialData.ageBracket && formData.percentileOptedIn) {
                const demoRes = await fetch('/api/percentile/opt-in', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        age_bracket: formData.ageBracket,
                    }),
                })

                if (!demoRes.ok) throw new Error('Failed to update age bracket')
            }

            setInitialData(formData)
            setIsEditing(false)
            showToast('Profile updated successfully', 'success')
        } catch (error) {
            console.error('Error saving profile:', error)
            showToast('Failed to save profile', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setFormData(initialData)
        setIsEditing(false)
    }

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 w-96 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-10 w-32 bg-gray-200 rounded"></div>
                    </div>
                </div>

                <div className="px-6 py-6">
                    <div className="space-y-6">
                        {/* Basic Information Skeleton */}
                        <div>
                            <div className="h-5 w-32 bg-gray-200 rounded mb-4"></div>
                            <div className="space-y-4">
                                <div>
                                    <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-10 w-full bg-gray-200 rounded"></div>
                                </div>
                                <div>
                                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-10 w-full bg-gray-200 rounded"></div>
                                    <div className="h-3 w-64 bg-gray-200 rounded mt-1"></div>
                                </div>
                            </div>
                        </div>

                        {/* Demographics Skeleton */}
                        <div className="pt-6 border-t border-gray-200">
                            <div className="h-5 w-28 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 w-full bg-gray-200 rounded mb-4"></div>
                            <div>
                                <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                                <div className="h-10 w-full bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                            Profile Information
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Update your personal information and demographics for percentile ranking.
                        </p>
                    </div>
                    {!isEditing && (
                        <Button onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            <div className="px-6 py-6">
                <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h4>
                        <div className="space-y-4">
                            <TextField
                                label="Full Name"
                                id="fullName"
                                name="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                disabled={!isEditing}
                                autoComplete="name"
                            />
                            <TextField
                                label="Email Address"
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                disabled={true}
                                autoComplete="email"
                                description="Email cannot be changed. Contact support if needed."
                            />
                        </div>
                    </div>

                    {/* Demographics for Percentile Ranking */}
                    {formData.percentileOptedIn && (
                        <div className="pt-6 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Demographics</h4>
                            <p className="text-xs text-gray-500 mb-4">
                                Used for calculating your percentile ranking. Changes may affect your ranking.
                            </p>
                            <div className="space-y-4">
                                <DropdownSelect
                                    label="Age Bracket"
                                    options={AGE_BRACKETS}
                                    value={formData.ageBracket}
                                    onChange={(value) => setFormData({ ...formData, ageBracket: value as AgeBracket })}
                                    disabled={!isEditing}
                                    placeholder="Select your age bracket"
                                />
                            </div>
                        </div>
                    )}

                    {!formData.percentileOptedIn && (
                        <div className="pt-6 border-t border-gray-200">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    You haven&apos;t opted into percentile ranking yet. Enable it from the Privacy tab to see where you stand!
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
