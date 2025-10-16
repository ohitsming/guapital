'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingOverlay from '@/components/LoadingOverlay'

export default function Dashboard() {
    const [businessProfile, setBusinessProfile] = useState(null)
    const [onboardingCompleted, setOnboardingCompleted] = useState(false)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchAndRedirect = async () => {
            try {
                const resProfiles = await fetch('/api/supabase/settings/user-profiles')
                const data = await resProfiles.json()

                if (data.error) {
                    console.error('Error fetching user profiles:', data.error)
                    // Handle error, maybe redirect to an error page or login
                    router.push('/login')
                    return
                }

                setBusinessProfile(data.businessProfile)
                setOnboardingCompleted(data.onboardingCompleted)

                // Redirection Logic
                if (!data.onboardingCompleted) {
                    router.push('/onboarding')
                } else if (data.businessProfile) {
                    router.push('/dashboard/business')
                } else {
                    // Fallback, user is onboarded but doesn't have a business profile
                    router.push('/onboarding')
                }

            } catch (error: any) {
                console.error('Error fetching user profiles:', error)
                router.push('/login') // Redirect to login on network error
            } finally {
                setLoading(false)
            }
        }

        fetchAndRedirect()
    }, [router]);

    if (loading) {
        return <LoadingOverlay show={loading} message="Loading your dashboard..." />
    }

    // This component should not render anything if redirection happens correctly
    return null
}
