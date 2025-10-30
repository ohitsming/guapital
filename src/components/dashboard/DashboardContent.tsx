'use client'

import { useEffect, useState } from 'react'
import { NetWorthCalculation } from '@/lib/interfaces/networth'
import { TrendDataPoint } from '@/lib/interfaces/subscription'
import { PercentileResponse, AgeBracket } from '@/lib/interfaces/percentile'
import { useSubscription } from '@/lib/context/SubscriptionContext'
import { recalculatePercentile } from '@/utils/percentileUtils'
import HeroNetWorthCard from '@/components/dashboard/HeroNetWorthCard'
import AssetBreakdownPanel from '@/components/dashboard/AssetBreakdownPanel'
import LiabilityBreakdownPanel from '@/components/dashboard/LiabilityBreakdownPanel'
import ManualAssetsPanel from '@/components/dashboard/ManualAssetsPanel'
import MonthlyCashFlowPanel from '@/components/dashboard/MonthlyCashFlowPanel'
import RecentTransactionsPanel from '@/components/dashboard/RecentTransactionsPanel'
import PercentileOptInModal from '@/components/percentile/PercentileOptInModal'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface DashboardContentProps {
    onAllDataDeleted?: () => void
}

export default function DashboardContent({ onAllDataDeleted }: DashboardContentProps) {
    const [netWorth, setNetWorth] = useState<NetWorthCalculation | null>(null)
    const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
    const [percentileData, setPercentileData] = useState<PercentileResponse | null>(null)
    const [showOptInModal, setShowOptInModal] = useState(false)
    const [loading, setLoading] = useState(true)
    const [percentileLoading, setPercentileLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { hasAccess, getLimit, isLoading: subscriptionLoading } = useSubscription()

    // Responsive limit: 3 on mobile, 3 on desktop
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const accountLimit = 3

    // Get history limit based on subscription tier
    const historyDays = hasAccess('history365Days') ? 365 : 30

    // SessionStorage cache helper (same as AccountsPageContent for consistency)
    const CACHE_KEY = 'guapital_dashboard_cache'
    const CACHE_DURATION = 30000 // 30 seconds

    const getCachedData = () => {
        try {
            const cached = sessionStorage.getItem(CACHE_KEY)
            if (cached) {
                const { data, timestamp } = JSON.parse(cached)
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return data
                }
            }
        } catch (err) {
            console.error('Error reading cache:', err)
        }
        return null
    }

    const setCachedData = (data: any) => {
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now()
            }))
        } catch (err) {
            console.error('Error setting cache:', err)
        }
    }

    // Parallel data fetching with caching
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Try cache first
                const cached = getCachedData()
                if (cached && cached.historyDays === historyDays) {
                    setNetWorth(cached.netWorth)
                    setTrendData(cached.trendData)
                    setPercentileData(cached.percentileData)
                    setLoading(false)
                    setPercentileLoading(false)
                    return
                }

                setLoading(true)
                setPercentileLoading(true)
                setError(null)

                // Fetch all data in parallel
                const [netWorthResult, trendResult, percentileResult] = await Promise.allSettled([
                    fetch('/api/networth').then(res => res.ok ? res.json() : Promise.reject(res)),
                    fetch(`/api/networth/history?days=${historyDays}`).then(res => res.ok ? res.json() : Promise.reject(res)),
                    fetch('/api/percentile').then(res => res.ok ? res.json() : Promise.reject(res))
                ])

                // Process net worth
                if (netWorthResult.status === 'fulfilled') {
                    setNetWorth(netWorthResult.value)
                } else {
                    console.error('Error fetching net worth:', netWorthResult.reason)
                    setError('Failed to fetch net worth')
                }

                // Process trend data
                if (trendResult.status === 'fulfilled') {
                    setTrendData(trendResult.value.trendData || [])
                } else {
                    console.error('Error fetching trend data:', trendResult.reason)
                    setTrendData([])
                }

                // Process percentile data
                if (percentileResult.status === 'fulfilled') {
                    setPercentileData(percentileResult.value)
                } else {
                    console.error('Error fetching percentile data:', percentileResult.reason)
                }

                // Cache the results
                setCachedData({
                    netWorth: netWorthResult.status === 'fulfilled' ? netWorthResult.value : null,
                    trendData: trendResult.status === 'fulfilled' ? trendResult.value.trendData || [] : [],
                    percentileData: percentileResult.status === 'fulfilled' ? percentileResult.value : null,
                    historyDays
                })

            } catch (err) {
                console.error('Error fetching dashboard data:', err)
                setError(err instanceof Error ? err.message : 'Failed to load dashboard')
            } finally {
                setLoading(false)
                setPercentileLoading(false)
            }
        }

        fetchAllData()
    }, [historyDays])

    // Add today's net worth to trend data if it's not already there
    // This ensures the chart always shows the most current value
    useEffect(() => {
        if (!netWorth || trendData.length === 0) return

        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        const lastDataPoint = trendData[trendData.length - 1]
        const lastDate = lastDataPoint?.date.split('T')[0]

        // Only add if last data point is not today
        if (lastDataPoint && lastDate !== today) {
            const todayDataPoint: TrendDataPoint = {
                date: today,
                value: netWorth.net_worth,
            }

            // Use functional update to prevent infinite loops
            setTrendData(prevData => {
                // Double-check we haven't already added today's point
                const lastPoint = prevData[prevData.length - 1]
                if (lastPoint && lastPoint.date.split('T')[0] === today) {
                    return prevData
                }
                return [...prevData, todayDataPoint]
            })
        }
    }, [netWorth, trendData])

    const clearCache = () => {
        try {
            sessionStorage.removeItem(CACHE_KEY)
        } catch (err) {
            console.error('Error clearing cache:', err)
        }
    }

    const refetchData = async () => {
        clearCache()
        try {
            setLoading(true)
            setPercentileLoading(true)
            setError(null)

            // Fetch all data in parallel
            const [netWorthResult, trendResult, percentileResult] = await Promise.allSettled([
                fetch('/api/networth').then(res => res.ok ? res.json() : Promise.reject(res)),
                fetch(`/api/networth/history?days=${historyDays}`).then(res => res.ok ? res.json() : Promise.reject(res)),
                fetch('/api/percentile').then(res => res.ok ? res.json() : Promise.reject(res))
            ])

            // Process net worth
            if (netWorthResult.status === 'fulfilled') {
                setNetWorth(netWorthResult.value)
            } else {
                console.error('Error fetching net worth:', netWorthResult.reason)
                setError('Failed to fetch net worth')
            }

            // Process trend data
            if (trendResult.status === 'fulfilled') {
                setTrendData(trendResult.value.trendData || [])
            } else {
                console.error('Error fetching trend data:', trendResult.reason)
                setTrendData([])
            }

            // Process percentile data
            if (percentileResult.status === 'fulfilled') {
                setPercentileData(percentileResult.value)
            } else {
                console.error('Error fetching percentile data:', percentileResult.reason)
            }

            // Cache the results
            setCachedData({
                netWorth: netWorthResult.status === 'fulfilled' ? netWorthResult.value : null,
                trendData: trendResult.status === 'fulfilled' ? trendResult.value.trendData || [] : [],
                percentileData: percentileResult.status === 'fulfilled' ? percentileResult.value : null,
                historyDays
            })

        } catch (err) {
            console.error('Error fetching dashboard data:', err)
            setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        } finally {
            setLoading(false)
            setPercentileLoading(false)
        }
    }

    // Combined handler for net worth updates - also recalculates percentile
    const handleNetWorthUpdate = async () => {
        clearCache()
        await refetchData()
        // Recalculate percentile (utility handles opt-in check automatically)
        await recalculatePercentile()
    }

    const fetchPercentileData = async () => {
        try {
            setPercentileLoading(true)
            const response = await fetch('/api/percentile')
            if (!response.ok) {
                console.error('Failed to fetch percentile data')
                return
            }
            const data: PercentileResponse = await response.json()
            setPercentileData(data)
        } catch (err) {
            console.error('Error fetching percentile data:', err)
        } finally {
            setPercentileLoading(false)
        }
    }

    const handleOptIn = async (ageBracket: AgeBracket) => {
        try {
            const response = await fetch('/api/percentile/opt-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ age_bracket: ageBracket })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to opt in')
            }

            // Refresh percentile data
            await fetchPercentileData()
            setShowOptInModal(false)
        } catch (err) {
            console.error('Error opting in:', err)
            throw err // Re-throw to let modal handle error display
        }
    }

    return (
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-6 lg:py-10 min-h-screen" style={{ background: '#F7F9F9' }}>
            {/* Hero Net Worth Card - Always shown with skeleton during loading */}
            <HeroNetWorthCard
                netWorth={netWorth}
                trendData={trendData}
                maxDays={historyDays}
                onShowPercentileOptIn={() => setShowOptInModal(true)}
                showPercentileButton={!loading && percentileData?.opted_in === false && netWorth?.net_worth !== 0}
                percentileData={percentileData}
                onPercentileUpdate={fetchPercentileData}
                loading={loading}
                percentileLoading={percentileLoading}
            />

            {/* Error State */}
            {!loading && error && (
                <div className="mb-3 sm:mb-4 bg-red-50 rounded-xl p-3 sm:p-4 lg:p-6 shadow-md border border-red-200">
                    <p className="text-red-900 font-semibold text-sm sm:text-base">Unable to load net worth data</p>
                    <p className="text-red-700 text-xs sm:text-sm mt-1">{error}</p>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                {/* Left Column - 2/3 width */}
                <div className="lg:col-span-2 space-y-2 sm:space-y-3 lg:space-y-4">
                    {/* Accounts (Plaid + Manual Assets) - All tiers, showing top 3-5 assets and top 3-5 liabilities (responsive) */}
                    <ManualAssetsPanel
                        onUpdate={handleNetWorthUpdate}
                        onAllDataDeleted={onAllDataDeleted}
                        limitDisplay={accountLimit}
                        showSeeMoreButton={true}
                        hideCount={true}
                    />

                    {/* Recent Transactions - Premium+ only */}
                    {/* Temporarily hidden */}
                    {/* {hasAccess('transactionHistory') && (
                        <RecentTransactionsPanel />
                    )} */}
                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {/* Asset Breakdown - Always shown with skeleton during loading or when assets exist */}
                    {(loading || (netWorth && netWorth.total_assets > 0)) && (
                        <AssetBreakdownPanel
                            breakdown={netWorth?.breakdown || null}
                            totalAssets={netWorth?.total_assets || 0}
                            loading={loading}
                        />
                    )}

                    {/* Liability Breakdown - Always shown with skeleton during loading or when liabilities exist */}
                    {(loading || (netWorth && netWorth.total_liabilities > 0)) && (
                        <LiabilityBreakdownPanel
                            breakdown={netWorth?.breakdown || null}
                            totalLiabilities={netWorth?.total_liabilities || 0}
                            loading={loading}
                        />
                    )}

                    {/* Monthly Cash Flow - Premium+ only */}
                    {/* Temporarily hidden */}
                    {/* {hasAccess('transactionHistory') && (
                        <MonthlyCashFlowPanel />
                    )} */}
                </div>
            </div>

            {/* Percentile Opt-In Modal */}
            <PercentileOptInModal
                isOpen={showOptInModal}
                onClose={() => setShowOptInModal(false)}
                onOptIn={handleOptIn}
            />
        </div>
    )
}
