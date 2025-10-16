'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingOverlay from '@/components/LoadingOverlay'
import { UserIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline'

export default function OnboardingPage() {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const checkOnboardingStatus = async () => {
            const res = await fetch('/api/supabase/general/onboarding-status', {
                method: 'POST',
            })
            const data = await res.json()

            if (res.ok && data.onboardingCompleted) {
                router.push('/dashboard')
            }
        }

        checkOnboardingStatus()
    }, [router])

    const handleNameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)
        setError(null)

        const res = await fetch('/api/supabase/settings/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firstName, lastName }),
        })

        const data = await res.json()

        if (res.ok) {
            handleTypeSelect('business');
        } else {
            setError(data.error || 'An unknown error occurred')
            setLoading(false)
        }
    }

    const handleTypeSelect = (userType: 'earner' | 'business') => {
        setLoading(true)
        if (userType === 'earner') {
            router.push('/dashboard/onboarding-earner')
        } else {
            router.push('/dashboard/onboarding-business')
        }
    }

    return (
        <div className='h-[75vh]'>
            <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
                    {step === 1 && (
                        <>
                            <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                                Welcome to LocalMoco!
                            </h2>
                            <p className="mt-4 text-center text-base text-gray-600">
                                Let&apos;s get you set up.
                            </p>
                            <form onSubmit={handleNameSubmit} className="mt-10 space-y-6">
                                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                    <div className="sm:col-span-3">
                                        <label htmlFor="first-name" className="block text-sm/6 font-medium text-gray-900">
                                            First name
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                name="first-name"
                                                id="first-name"
                                                autoComplete="given-name"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                required
                                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-neutral-950 sm:text-sm/6"
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-900">
                                            Last name
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                                name="last-name"
                                                id="last-name"
                                                autoComplete="family-name"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                required
                                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-neutral-950 sm:text-sm/6"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading || !firstName || !lastName}
                                        className="flex w-full justify-center rounded-md bg-neutral-950 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:bg-neutral-300 disabled:hover:bg-neutral-300 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : 'Continue'}
                                    </button>
                                </div>
                                {error && <p className="mt-4 text-center text-red-600">{error}</p>}
                            </form>
                        </>
                    )}

                </div>
            </div>
            <LoadingOverlay show={loading} message="Our digital gnomes are working tirelessly..." />
        </div>
    )
}