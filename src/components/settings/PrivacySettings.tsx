'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { SelectField } from '@/components/SelectField'
import { useToast } from '@/components/toast/ToastProvider'
import { AgeBracket } from '@/lib/interfaces/percentile'
import { ShieldCheckIcon, ChartBarIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const AGE_BRACKETS: { value: AgeBracket; label: string }[] = [
    { value: '18-21', label: '18-21 years' },
    { value: '22-25', label: '22-25 years' },
    { value: '26-28', label: '26-28 years' },
    { value: '29-32', label: '29-32 years' },
    { value: '33-35', label: '33-35 years' },
    { value: '36-40', label: '36-40 years' },
    { value: '41+', label: '41+ years' },
]

export function PrivacySettings() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [optedIn, setOptedIn] = useState(false)
    const [ageBracket, setAgeBracket] = useState<AgeBracket | ''>('')
    const [currentPercentile, setCurrentPercentile] = useState<number | null>(null)
    const [showOptInForm, setShowOptInForm] = useState(false)
    const { showToast } = useToast()

    useEffect(() => {
        fetchPercentileStatus()
    }, [])

    const fetchPercentileStatus = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/percentile')
            const data = await response.json()

            setOptedIn(data.opted_in || false)
            setAgeBracket(data.age_bracket || '')
            setCurrentPercentile(data.current_percentile || null)
        } catch (error) {
            console.error('Error fetching percentile status:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleOptIn = async () => {
        if (!ageBracket) {
            showToast('Please select your age bracket', 'error')
            return
        }

        try {
            setIsSaving(true)
            const response = await fetch('/api/percentile/opt-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ age_bracket: ageBracket }),
            })

            if (!response.ok) throw new Error('Failed to opt in')

            const data = await response.json()
            setOptedIn(true)
            setCurrentPercentile(data.current_percentile || null)
            setShowOptInForm(false)
            showToast('Successfully opted into percentile ranking!', 'success')
        } catch (error) {
            console.error('Error opting in:', error)
            showToast('Failed to opt in to percentile ranking', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    const handleOptOut = async () => {
        if (!confirm('Are you sure you want to opt out of percentile ranking? You can always opt back in later.')) {
            return
        }

        try {
            setIsSaving(true)
            const response = await fetch('/api/percentile/opt-in', {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Failed to opt out')

            setOptedIn(false)
            setCurrentPercentile(null)
            showToast('Successfully opted out of percentile ranking', 'success')
        } catch (error) {
            console.error('Error opting out:', error)
            showToast('Failed to opt out of percentile ranking', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Percentile Ranking Skeleton */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-80 bg-gray-200 rounded"></div>
                    </div>

                    <div className="px-6 py-6">
                        <div className="space-y-6">
                            {/* Status Card Skeleton */}
                            <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-48 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-32 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            </div>

                            {/* How it works Skeleton */}
                            <div>
                                <div className="h-5 w-28 bg-gray-200 rounded mb-2"></div>
                                <div className="space-y-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-4 w-full bg-gray-200 rounded"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Privacy Skeleton */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-64 bg-gray-200 rounded"></div>
                    </div>

                    <div className="px-6 py-6">
                        <div className="space-y-4">
                            <div>
                                <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
                                <div className="space-y-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-4 w-full bg-gray-200 rounded"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Percentile Ranking */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                        <ChartBarIcon className="h-5 w-5 text-[#004D40]" />
                        Percentile Ranking
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        See where you stand compared to others in your age group.
                    </p>
                </div>

                <div className="px-6 py-6">
                    {optedIn ? (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-800">
                                            Percentile ranking is enabled
                                        </p>
                                        <p className="text-xs text-green-700 mt-1">
                                            Age bracket: {ageBracket}
                                        </p>
                                        {currentPercentile !== null && (
                                            <p className="text-xs text-green-700 mt-1">
                                                Current percentile: Top {(100 - currentPercentile).toFixed(1)}%
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">How it works</h4>
                                <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                                    <li>Your net worth is compared anonymously with others in your age bracket</li>
                                    <li>Rankings are calculated daily based on your net worth snapshots</li>
                                    <li>Your data is never shared publicly or sold to third parties</li>
                                    <li>You can opt out anytime and your data will be excluded from rankings</li>
                                </ul>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <button
                                    onClick={handleOptOut}
                                    disabled={isSaving}
                                    className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-150 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <EyeSlashIcon className="h-4 w-4 mr-1.5" />
                                    {isSaving ? 'Opting out...' : 'Opt Out of Percentile Ranking'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    You haven&apos;t opted into percentile ranking yet. Enable it to see where you stand compared to others in your age group!
                                </p>
                            </div>

                            {!showOptInForm ? (
                                <div>
                                    <Button onClick={() => setShowOptInForm(true)}>
                                        Enable Percentile Ranking
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <SelectField
                                        label="Select Your Age Bracket"
                                        id="ageBracket"
                                        name="ageBracket"
                                        value={ageBracket}
                                        onChange={(e) => setAgeBracket(e.target.value as AgeBracket)}
                                    >
                                        <option value="">Select your age bracket</option>
                                        {AGE_BRACKETS.map((bracket) => (
                                            <option key={bracket.value} value={bracket.value}>
                                                {bracket.label}
                                            </option>
                                        ))}
                                    </SelectField>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleOptIn}
                                            disabled={isSaving || !ageBracket}
                                        >
                                            {isSaving ? 'Enabling...' : 'Enable Ranking'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowOptInForm(false)}
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Data Privacy */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                        <ShieldCheckIcon className="h-5 w-5 text-[#004D40]" />
                        Data Privacy
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        How we protect and use your data.
                    </p>
                </div>

                <div className="px-6 py-6">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Your data is secure</h4>
                            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                                <li>All data is encrypted at rest and in transit</li>
                                <li>We never sell your financial data to third parties</li>
                                <li>Bank credentials are handled securely through Plaid</li>
                                <li>You can export or delete your data anytime</li>
                            </ul>
                        </div>

                        <div className="pt-4">
                            <a
                                href="/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[#004D40] hover:text-[#00695C] font-medium"
                            >
                                Read our full Privacy Policy →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
