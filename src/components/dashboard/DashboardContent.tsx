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

    // Responsive limit: 3 on mobile, 5 on desktop
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const accountLimit = isDesktop ? 5 : 3

    // Get history limit based on subscription tier
    const historyDays = hasAccess('history365Days') ? 365 : 30

    useEffect(() => {
        fetchNetWorth()
        fetchTrendData(historyDays)
        fetchPercentileData()
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
                    console.log('⚠️ Today\'s point already exists, skipping')
                    return prevData
                }
                console.log('🎯 Successfully added today\'s point')
                return [...prevData, todayDataPoint]
            })
        }
    }, [netWorth, trendData])

    const fetchNetWorth = async () => {
        try {
            setLoading(true)
            setError(null) // Clear previous errors
            const response = await fetch('/api/networth')
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch net worth')
            }
            const data = await response.json()
            setNetWorth(data)
        } catch (err) {
            console.error('Error fetching net worth:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch net worth')
        } finally {
            setLoading(false)
        }
    }

    const fetchTrendData = async (days: number) => {
        try {
            const response = await fetch(`/api/networth/history?days=${days}`)
            if (!response.ok) {
                throw new Error('Failed to fetch trend data')
            }
            const data = await response.json()
            setTrendData(data.trendData || [])
        } catch (err) {
            console.error('Error fetching trend data:', err)
            // Don't set error state - just log it, trend data is optional
            setTrendData([])
        }
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
            // Note: Removed automatic modal trigger - now user-initiated via button
        } catch (err) {
            console.error('Error fetching percentile data:', err)
            // Don't block dashboard on percentile errors
        } finally {
            setPercentileLoading(false)
        }
    }

    // Combined handler for net worth updates - also recalculates percentile
    const handleNetWorthUpdate = async () => {
        await fetchNetWorth()
        // Recalculate percentile (utility handles opt-in check automatically)
        await recalculatePercentile()
        // Refresh percentile display data
        await fetchPercentileData()
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
                    {hasAccess('transactionHistory') && (
                        <RecentTransactionsPanel />
                    )}
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
                    {hasAccess('transactionHistory') && (
                        <MonthlyCashFlowPanel />
                    )}
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
