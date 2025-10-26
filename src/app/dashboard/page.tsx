'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import GetStartedView from '@/components/dashboard/GetStartedView'
import DashboardContent from '@/components/dashboard/DashboardContent'
import { useSubscription } from '@/lib/context/SubscriptionContext'

export default function Dashboard() {
    const [hasAnyData, setHasAnyData] = useState<boolean | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    const { refetch } = useSubscription()

    const checkForData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            // Check if user has any data to determine which view to show
            const [plaidAccountsResult, manualAssetsResult, cryptoWalletsResult] = await Promise.all([
                supabase.from('plaid_accounts').select('id').eq('user_id', user.id).limit(1),
                supabase.from('manual_assets').select('id').eq('user_id', user.id).limit(1),
                supabase.from('crypto_wallets').select('id').eq('user_id', user.id).limit(1),
            ])

            const hasPlaidAccounts = (plaidAccountsResult.data?.length ?? 0) > 0
            const hasManualAssets = (manualAssetsResult.data?.length ?? 0) > 0
            const hasCryptoWallets = (cryptoWalletsResult.data?.length ?? 0) > 0
            const hasData = hasPlaidAccounts || hasManualAssets || hasCryptoWallets

            setHasAnyData(hasData)
        } catch (error) {
            console.error('Error checking for data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [router, supabase])

    useEffect(() => {
        checkForData()
    }, [checkForData])

    // Handle Stripe checkout success - refresh subscription
    useEffect(() => {
        const checkoutStatus = searchParams.get('checkout')
        if (checkoutStatus === 'success') {
            // Refetch subscription data after successful payment
            refetch()

            // Clean up URL parameter
            const newUrl = window.location.pathname
            window.history.replaceState({}, '', newUrl)
        }
    }, [searchParams, refetch])

    // Show loading state while checking for data
    // Also check hasAnyData === null to prevent flash of GetStartedView
    if (isLoading || hasAnyData === null) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#004D40]/20 border-t-[#FFC107] rounded-full animate-spin mb-3"></div>
                    <p className="text-base font-semibold text-[#004D40]">Loading...</p>
                </div>
            </div>
        )
    }

    // Show simplified "Get Started" view for new users with no data
    // Only show when hasAnyData is explicitly false (not null)
    if (hasAnyData === false) {
        return (
            <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
                <GetStartedView onDataAdded={checkForData} />
            </div>
        )
    }

    // Show full dashboard for users with data
    // Note: SubscriptionProvider is already wrapped in layout.tsx
    return <DashboardContent onAllDataDeleted={checkForData} />
}
