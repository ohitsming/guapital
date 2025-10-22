'use client'

import { useState } from 'react'
import {
    TrophyIcon,
    ChartBarIcon,
    InformationCircleIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    SparklesIcon
} from '@heroicons/react/24/outline'
import type { PercentileResponse } from '@/lib/interfaces/percentile'
import PercentileLearnMoreModal from './PercentileLearnMoreModal'

interface PercentileRankCardProps {
    data: PercentileResponse
    onRefresh?: () => void
}

export default function PercentileRankCard({ data, onRefresh }: PercentileRankCardProps) {
    const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false)

    if (!data.opted_in || data.current_percentile === null || data.current_percentile === undefined) {
        return null
    }

    const percentile = data.current_percentile
    const topPercentile = 100 - percentile
    const displayPercentile = topPercentile < 1 ? topPercentile.toFixed(1) : Math.round(topPercentile)

    // Determine badge color based on percentile
    const getBadgeColor = () => {
        if (percentile >= 99) return 'from-purple-500 to-pink-600' // Top 1%
        if (percentile >= 95) return 'from-yellow-500 to-orange-600' // Top 5%
        if (percentile >= 90) return 'from-blue-500 to-indigo-600' // Top 10%
        if (percentile >= 75) return 'from-green-500 to-teal-600' // Top 25%
        if (percentile >= 50) return 'from-gray-500 to-gray-600' // Top 50%
        return 'from-gray-400 to-gray-500' // Below median
    }

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Format percentile change
    const formatPercentileChange = (change: number | null) => {
        if (change === null || change === 0) return null

        const isPositive = change > 0
        const Icon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
        const colorClass = isPositive ? 'text-green-600' : 'text-red-600'
        const bgClass = isPositive ? 'bg-green-50' : 'bg-red-50'

        return (
            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${colorClass} ${bgClass}`}>
                <Icon className="h-3 w-3" />
                <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
                <span className="text-gray-600">this month</span>
            </div>
        )
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${getBadgeColor()} p-6 text-white`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <TrophyIcon className="h-8 w-8" />
                            <div>
                                <h3 className="text-sm font-medium opacity-90">Your Wealth Rank</h3>
                                <p className="text-3xl font-bold mt-1">
                                    TOP {displayPercentile}%
                                </p>
                                <p className="text-sm opacity-75 mt-0.5">
                                    Ages {data.age_bracket}
                                </p>
                            </div>
                        </div>

                        {/* Rank badge */}
                        {data.rank_position && data.total_users && (
                            <div className="text-right">
                                <p className="text-2xl font-bold">#{data.rank_position}</p>
                                <p className="text-xs opacity-75">of {data.total_users.toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Current stats */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Your net worth</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(data.net_worth || 0)}
                            </p>
                        </div>

                        {/* Percentile change */}
                        {data.insights?.percentile_change_30d && formatPercentileChange(data.insights.percentile_change_30d)}
                    </div>

                    {/* Progress bar to next milestone */}
                    {data.milestones?.next && data.milestones.next.gap > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-1 text-gray-700">
                                    <SparklesIcon className="h-4 w-4 text-amber-500" />
                                    <span className="font-medium">Next: {data.milestones.next.label}</span>
                                </div>
                                <span className="text-gray-600">{formatCurrency(data.milestones.next.required_net_worth)}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(data.milestones.next.current_progress, 100)}%` }}
                                />
                            </div>

                            <p className="text-xs text-gray-600">
                                Need {formatCurrency(data.milestones.next.gap)} more to reach {data.milestones.next.label}
                            </p>
                        </div>
                    )}

                    {/* Achieved milestones */}
                    {data.milestones && data.milestones.achieved.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <TrophyIcon className="h-4 w-4 text-amber-500" />
                            <span className="text-sm text-gray-600">
                                {data.milestones.total_unlocked} milestone{data.milestones.total_unlocked !== 1 ? 's' : ''} unlocked
                            </span>
                        </div>
                    )}

                    {/* Disclaimer */}
                    {data.uses_seed_data && (
                        <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-md">
                            <InformationCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-gray-600">
                                    Based on {data.total_users} Guapital user{data.total_users !== 1 ? 's' : ''} + Federal Reserve data.{' '}
                                    <button
                                        onClick={() => setIsLearnMoreOpen(true)}
                                        className="text-teal-600 hover:text-teal-700 font-medium underline"
                                    >
                                        Learn more
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    {!data.uses_seed_data && data.total_users && (
                        <div className="flex items-start space-x-2 p-3 bg-teal-50 rounded-md">
                            <ChartBarIcon className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-teal-800 font-medium">
                                    Based on {data.total_users.toLocaleString()} real Guapital users in your age group
                                </p>
                            </div>
                        </div>
                    )}

                    {/* View Details Button (for future detailed page) */}
                    {/* Commented out for MVP
                    <button className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        View Detailed Ranking
                    </button>
                    */}
                </div>
            </div>

            {/* Learn More Modal */}
            <PercentileLearnMoreModal
                isOpen={isLearnMoreOpen}
                onClose={() => setIsLearnMoreOpen(false)}
                ageBracket={data.age_bracket || '26-28'}
                totalUsers={data.total_users || 0}
                usesSeedData={data.uses_seed_data || false}
            />
        </>
    )
}
