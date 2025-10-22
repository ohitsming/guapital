'use client'

import { useEffect, useState } from 'react'
import { NetWorthCalculation } from '@/lib/interfaces/networth'
import { TrendDataPoint } from '@/lib/interfaces/subscription'
import { PercentileResponse, AgeBracket } from '@/lib/interfaces/percentile'
import { useSubscription } from '@/lib/context/SubscriptionContext'
import HeroNetWorthCard from '@/components/dashboard/HeroNetWorthCard'
import AssetBreakdownPanel from '@/components/dashboard/AssetBreakdownPanel'
import LiabilityBreakdownPanel from '@/components/dashboard/LiabilityBreakdownPanel'
import ManualAssetsPanel from '@/components/dashboard/ManualAssetsPanel'
import MonthlyCashFlowPanel from '@/components/dashboard/MonthlyCashFlowPanel'
import RecentTransactionsPanel from '@/components/dashboard/RecentTransactionsPanel'
import PercentileOptInModal from '@/components/percentile/PercentileOptInModal'

interface DashboardContentProps {
    onAllDataDeleted?: () => void
}

export default function DashboardContent({ onAllDataDeleted }: DashboardContentProps) {
    const [netWorth, setNetWorth] = useState<NetWorthCalculation | null>(null)
    const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
    const [percentileData, setPercentileData] = useState<PercentileResponse | null>(null)
    const [showOptInModal, setShowOptInModal] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const { hasAccess, getLimit, isLoading: subscriptionLoading } = useSubscription()

    // Get history limit based on subscription tier
    const historyDays = hasAccess('history365Days') ? 365 : 30

    useEffect(() => {
        fetchNetWorth()
        fetchTrendData(historyDays)
        fetchPercentileData()
    }, [historyDays])

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
        <div className="px-4 py-4 mt-6 min-h-screen" style={{ background: '#F7F9F9' }}>
            {/* Loading State */}
            {loading && (
                <div className="mb-4 bg-white rounded-xl p-8 shadow-md border border-gray-200">
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-[#004D40]/20 border-t-[#FFC107] rounded-full animate-spin mb-3"></div>
                        <p className="text-base font-semibold text-[#004D40]">Calculating your net worth...</p>
                        <p className="text-xs text-gray-600 mt-1">Analyzing all your accounts</p>
                    </div>
                </div>
            )}

            {/* Hero Net Worth Card - Always shown when not loading */}
            {!loading && netWorth && (
                <HeroNetWorthCard
                    netWorth={netWorth}
                    trendData={trendData}
                    maxDays={historyDays}
                    onShowPercentileOptIn={() => setShowOptInModal(true)}
                    showPercentileButton={percentileData?.opted_in === false && netWorth.net_worth !== 0}
                    percentileData={percentileData}
                    onPercentileUpdate={fetchPercentileData}
                />
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="mb-4 bg-red-50 rounded-xl p-6 shadow-md border border-red-200">
                    <p className="text-red-900 font-semibold">Unable to load net worth data</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column - 2/3 width */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Accounts (Plaid + Manual Assets) - All tiers, showing top 3 assets and top 3 liabilities */}
                    <ManualAssetsPanel
                        onUpdate={fetchNetWorth}
                        onAllDataDeleted={onAllDataDeleted}
                        limitDisplay={3}
                        showSeeMoreButton={true}
                        hideCount={true}
                    />

                    {/* Recent Transactions - Premium+ only */}
                    {hasAccess('transactionHistory') && (
                        <RecentTransactionsPanel />
                    )}
                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-4">
                    {/* Asset Breakdown - Always shown when assets exist */}
                    {netWorth && netWorth.total_assets > 0 && (
                        <AssetBreakdownPanel
                            breakdown={netWorth.breakdown}
                            totalAssets={netWorth.total_assets}
                        />
                    )}

                    {/* Liability Breakdown - Only shown when liabilities exist */}
                    {netWorth && netWorth.total_liabilities > 0 && (
                        <LiabilityBreakdownPanel
                            breakdown={netWorth.breakdown}
                            totalLiabilities={netWorth.total_liabilities}
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
