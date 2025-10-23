'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { NetWorthCalculation } from '@/lib/interfaces/networth'
import { TrendDataPoint } from '@/lib/interfaces/subscription'
import { PercentileResponse, AgeBracket } from '@/lib/interfaces/percentile'
import {
    SparklesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ChartBarIcon,
    ChevronDownIcon,
    InformationCircleIcon,
    TrophyIcon,
    LockClosedIcon,
} from '@heroicons/react/24/outline'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { useSubscription } from '@/lib/context/SubscriptionContext'
import PercentileLearnMoreModal from '@/components/percentile/PercentileLearnMoreModal'

interface HeroNetWorthCardProps {
    netWorth: NetWorthCalculation | null
    trendData?: TrendDataPoint[]
    maxDays?: number
    onShowPercentileOptIn?: () => void
    showPercentileButton?: boolean
    percentileData?: PercentileResponse | null
    onPercentileUpdate?: () => void
    loading?: boolean
    percentileLoading?: boolean
}

export default function HeroNetWorthCard({
    netWorth,
    trendData,
    maxDays = 30,
    onShowPercentileOptIn,
    showPercentileButton = false,
    percentileData,
    onPercentileUpdate,
    loading = false,
    percentileLoading = false
}: HeroNetWorthCardProps) {
    const [selectedDays, setSelectedDays] = useState(maxDays)
    const [isOpen, setIsOpen] = useState(false)
    const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const { hasAccess } = useSubscription()

    // Handler for opting out of percentile tracking
    const handleOptOut = async () => {
        try {
            const response = await fetch('/api/percentile/opt-in', {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to opt out')
            }

            // Refresh percentile data
            if (onPercentileUpdate) {
                onPercentileUpdate()
            }

            setIsLearnMoreOpen(false)
        } catch (error) {
            console.error('Error opting out:', error)
            throw error
        }
    }

    // Handler for changing age bracket
    const handleChangeAgeBracket = async (newBracket: AgeBracket) => {
        try {
            const response = await fetch('/api/percentile/opt-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ age_bracket: newBracket })
            })

            if (!response.ok) {
                throw new Error('Failed to change age bracket')
            }

            // Refresh percentile data
            if (onPercentileUpdate) {
                onPercentileUpdate()
            }
        } catch (error) {
            console.error('Error changing age bracket:', error)
            throw error
        }
    }

    const dayOptions = [
        { value: 30, label: 'Last 30 days' },
        { value: 90, label: 'Last 90 days' },
        { value: 365, label: 'Last 365 days' },
    ]

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelectDays = (days: number) => {
        setSelectedDays(days)
        setIsOpen(false)
    }
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    // Calculate progress based on selected time period
    const calculateProgress = () => {
        if (!netWorth || !trendData || trendData.length === 0) {
            return null
        }

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0]

        // Filter trend data based on selected period
        const now = new Date()
        const periodStart = new Date(now.getTime() - selectedDays * 24 * 60 * 60 * 1000)

        // Exclude today's snapshot to always use live data for current value
        const filteredData = trendData.filter(point => {
            const pointDate = new Date(point.date)
            const dateString = point.date.split('T')[0] // Handle both date and datetime formats
            return pointDate >= periodStart && dateString !== today
        })

        if (filteredData.length === 0) {
            return null
        }

        // Sort by date to get oldest value
        const sortedData = [...filteredData].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        const oldestValue = sortedData[0].value
        // Always use live net worth for current value (handles intraday updates)
        const currentValue = netWorth.net_worth
        const change = currentValue - oldestValue
        const percentChange = oldestValue !== 0 ? (change / Math.abs(oldestValue)) * 100 : 0

        return { change, percentChange }
    }

    const progress = calculateProgress()

    // Prepare chart data filtered by selected time period
    const chartData = useMemo(() => {
        if (!netWorth || !trendData || trendData.length === 0) {
            return []
        }

        const now = new Date()
        const periodStart = new Date(now.getTime() - selectedDays * 24 * 60 * 60 * 1000)
        const today = new Date().toISOString().split('T')[0]

        // Check if we only have today's snapshot (first-time user case)
        const isTodayOnly = trendData.length === 1 && trendData[0].date.split('T')[0] === today

        if (isTodayOnly) {
            // For brand new users with only today's snapshot, show it as a single point
            return trendData.map(point => ({
                date: point.date,
                value: point.value,
                displayDate: 'Today'
            }))
        }

        // Filter data by selected period, exclude today's snapshot (we'll use live data for today)
        const filtered = trendData.filter(point => {
            const pointDate = new Date(point.date)
            const dateString = point.date.split('T')[0]
            return pointDate >= periodStart && dateString !== today
        })

        // Sort by date
        const sorted = [...filtered].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        // Always add today's live net worth value if we have any historical data
        // This creates a trend line: historical snapshot(s) → today's live value
        if (sorted.length > 0) {
            sorted.push({
                date: today,
                value: netWorth.net_worth
            })
        }

        // Format for chart
        return sorted.map(point => ({
            date: point.date,
            value: point.value,
            displayDate: new Date(point.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            })
        }))
    }, [trendData, selectedDays, netWorth])

    // Custom tooltip for the chart
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">{payload[0].payload.displayDate}</p>
                    <p className="text-sm font-bold text-[#004D40]">
                        {formatCurrency(payload[0].value)}
                    </p>
                </div>
            )
        }
        return null
    }

    // Ghost Chart component for empty state
    const GhostChart = () => {
        // Generate sample data points showing a gentle upward trend
        const ghostData = [
            { date: 'Day 1', value: 100 },
            { date: 'Day 5', value: 102 },
            { date: 'Day 10', value: 105 },
            { date: 'Day 15', value: 103 },
            { date: 'Day 20', value: 108 },
            { date: 'Day 25', value: 110 },
            { date: 'Day 30', value: 112 },
        ]

        return (
            <div className="relative">
                <ResponsiveContainer width="100%" height={370}>
                    <AreaChart data={ghostData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <defs>
                            <linearGradient id="ghostGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FFC107" stopOpacity={0.05}/>
                                <stop offset="95%" stopColor="#FFC107" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.2)"
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis hide={true} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#FFC107"
                            strokeWidth={2}
                            strokeOpacity={0.25}
                            strokeDasharray="5 5"
                            fill="url(#ghostGradient)"
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>

                {/* Overlay message */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-white/5 backdrop-blur-[2px] rounded-lg"
                    aria-label="Preview of net worth trend chart"
                >
                    <ChartBarIcon className="w-10 h-10 text-[#FFC107] mb-2" />
                    <p className="text-white/90 text-sm font-medium">Start Building Your History</p>
                    <p className="text-white/60 text-xs mt-1">
                        Your net worth trend will appear here as you track over time
                    </p>
                </div>
            </div>
        )
    }

    // Skeleton loading component
    const SkeletonLoader = () => (
        <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-start justify-between mb-2 gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 bg-white/20 rounded"></div>
                        <div className="h-4 w-32 bg-white/20 rounded"></div>
                    </div>
                    <div className="mb-3">
                        {/* Net worth skeleton */}
                        <div className="h-10 w-48 bg-white/20 rounded mb-2"></div>
                        {/* Progress skeleton */}
                        <div className="h-8 w-64 bg-white/20 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Chart skeleton */}
            <div className="mb-3 bg-white/5 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                <div className="h-[370px] bg-white/10 rounded flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-[#FFC107] rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-white/60 text-sm">Calculating your net worth...</p>
                    </div>
                </div>
            </div>

            {/* Quick stats skeleton */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="h-3 w-12 bg-white/20 rounded mb-2"></div>
                    <div className="h-6 w-24 bg-white/20 rounded"></div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="h-3 w-16 bg-white/20 rounded mb-2"></div>
                    <div className="h-6 w-24 bg-white/20 rounded"></div>
                </div>
            </div>
        </div>
    )

    // If loading, show skeleton
    if (loading || !netWorth) {
        return (
            <div className="mb-4 relative overflow-hidden rounded-xl bg-gradient-to-br from-[#004D40] via-[#00695C] to-[#00796B] p-5 shadow-lg">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

                <div className="relative z-10">
                    <SkeletonLoader />
                </div>
            </div>
        )
    }

    return (
        <div className="mb-4 relative overflow-hidden rounded-xl bg-gradient-to-br from-[#004D40] via-[#00695C] to-[#00796B] p-5 shadow-lg">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

            <div className="relative z-10">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2 gap-4">
                    {/* Left: Title & Buttons */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-[#FFC107]" />
                                <h2 className="text-sm font-medium text-white/80">Your Total Net Worth</h2>
                            </div>

                            {/* Buttons for mobile/tablet */}
                            <div className="flex lg:hidden items-center gap-2">
                                {/* Percentile Opt-In Button */}
                                {showPercentileButton && onShowPercentileOptIn && (
                                    <button
                                        type="button"
                                        onClick={onShowPercentileOptIn}
                                        className="inline-flex items-center gap-1.5 text-xs border border-amber-400/40 bg-amber-500/20 text-amber-100 rounded-md px-3 py-1.5 backdrop-blur-sm hover:bg-amber-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-sm"
                                        title="See how your net worth compares to peers your age"
                                    >
                                        <TrophyIcon className="w-4 h-4" />
                                        <span className="font-medium">See Your Rank</span>
                                    </button>
                                )}

                                {/* Mobile Dropdown - Hidden, using main dropdown below */}
                            </div>
                        </div>
                        <div className="mb-3">
                            <p className="text-4xl font-bold text-white mb-2">
                                {formatCurrency(netWorth.net_worth)}
                            </p>

                            {/* Progress Indicator */}
                            {progress ? (
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                                            progress.change >= 0
                                                ? 'bg-emerald-500/20 border-emerald-400/30'
                                                : 'bg-red-500/20 border-red-400/30'
                                        }`}>
                                            {progress.change >= 0 ? (
                                                <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-300" />
                                            ) : (
                                                <ArrowTrendingDownIcon className="w-4 h-4 text-red-300" />
                                            )}
                                            <span className={`font-semibold text-sm ${
                                                progress.change >= 0 ? 'text-emerald-300' : 'text-red-300'
                                            }`}>
                                                {progress.change >= 0 ? '+' : ''}{formatCurrency(progress.change)}
                                            </span>
                                            <span className={`font-medium text-xs ${
                                                progress.change >= 0 ? 'text-emerald-300' : 'text-red-300'
                                            }`}>
                                                ({progress.change >= 0 ? '+' : ''}{progress.percentChange.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {netWorth.net_worth >= 0 && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/20">
                                                    <SparklesIcon className="w-4 h-4 text-[#FFC107]" />
                                                    <span className="text-white/90 font-medium text-xs">Building Wealth</span>
                                                </div>
                                            )}
                                            {/* Time period dropdown - always visible */}
                                            <div className="relative" ref={dropdownRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsOpen(!isOpen)}
                                                    className="inline-flex items-center gap-1.5 text-xs border border-white/20 bg-white/10 text-white/90 rounded-md px-3 py-1.5 backdrop-blur-sm hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                                                >
                                                    <span>{dayOptions.find(opt => opt.value === selectedDays)?.label || `Last ${selectedDays} days`}</span>
                                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {isOpen && (
                                                    <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                                        <div className="py-1">
                                                            {dayOptions.map((option) => {
                                                                const isLocked = !hasAccess('plaidSync') && (option.value === 90 || option.value === 365)
                                                                return (
                                                                    <button
                                                                        key={option.value}
                                                                        onClick={() => !isLocked && handleSelectDays(option.value)}
                                                                        disabled={isLocked}
                                                                        className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                                                                            isLocked
                                                                                ? 'text-gray-400 cursor-not-allowed opacity-60'
                                                                                : selectedDays === option.value
                                                                                ? 'bg-gray-100 text-gray-900 font-medium'
                                                                                : 'text-gray-700 hover:bg-gray-50'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <span>{option.label}</span>
                                                                            {isLocked && (
                                                                                <LockClosedIcon className="w-3.5 h-3.5 text-gray-400" />
                                                                            )}
                                                                        </div>
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Show "Building Wealth" badge when no progress data
                                netWorth.net_worth >= 0 && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-400/30 inline-flex">
                                        <SparklesIcon className="w-4 h-4 text-[#FFC107]" />
                                        <span className="text-emerald-300 font-semibold text-xs">Building Wealth</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Right: Percentile Ranking Card or Opt-In Button - Top Right Corner */}
                    {percentileData && percentileData.opted_in && typeof percentileData.current_percentile === 'number' ? (
                        // Show percentile rank when opted in
                        <div className="hidden lg:block w-64 flex-shrink-0 h-full relative">
                            <div className="p-4 h-full flex flex-col justify-center items-center">
                                {/* Header - Centered */}
                                <div className="flex flex-col items-center mb-4 gap-2">
                                    <div className="flex items-center gap-2">
                                        <TrophyIcon className="w-5 h-5 text-amber-400" />
                                        <h3 className="text-white/90 font-semibold text-sm">Your Wealth Rank</h3>
                                        <button
                                            onClick={() => setIsLearnMoreOpen(true)}
                                            className="text-white/60 hover:text-white/90 transition-colors"
                                            title="Learn more"
                                        >
                                            <InformationCircleIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* TOP X% Badge - Centered */}
                                <div className="flex flex-col items-center">
                                    <div className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-br from-amber-500/30 to-amber-600/30 border-2 border-amber-400/50 rounded-lg backdrop-blur-sm shadow-lg">
                                        <span className="text-amber-100 text-3xl font-bold">
                                            TOP {(() => {
                                                const topPercentile = 100 - percentileData.current_percentile;
                                                if (topPercentile < 1) {
                                                    // Floor to nearest hundredth for values below 1%, minimum 0.01%
                                                    const floored = Math.floor(topPercentile * 100) / 100;
                                                    return Math.max(floored, 0.01).toFixed(2);
                                                }
                                                return Math.round(topPercentile);
                                            })()}%
                                        </span>
                                    </div>
                                    <p className="text-white/60 text-xs mt-3">Ages {percentileData.age_bracket}</p>
                                </div>
                            </div>

                            {/* Loading Overlay */}
                            {percentileLoading && (
                                <div className="absolute inset-0 bg-[#004D40]/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <div className="w-8 h-8 border-3 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    ) : showPercentileButton && onShowPercentileOptIn ? (
                        // Show opt-in button when not opted in (desktop only)
                        <div className="hidden lg:flex items-start">
                            <button
                                type="button"
                                onClick={onShowPercentileOptIn}
                                className="inline-flex items-center gap-1.5 text-xs border border-amber-400/40 bg-amber-500/20 text-amber-100 rounded-md px-3 py-1.5 backdrop-blur-sm hover:bg-amber-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-sm"
                                title="See how your net worth compares to peers your age"
                            >
                                <TrophyIcon className="w-4 h-4" />
                                <span className="font-medium">See Your Rank</span>
                            </button>
                        </div>
                    ) : null}
                </div>

                        {/* Net Worth Trend Chart */}
                        <div className="mb-3 bg-white/5 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={370}>
                            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FFC107" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#FFC107" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="displayDate"
                                    stroke="rgba(255,255,255,0.3)"
                                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    interval="preserveStartEnd"
                                />
                                <YAxis hide={true} domain={['dataMin - dataMin * 0.02', 'dataMax + dataMax * 0.02']} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,193,7,0.5)', strokeWidth: 1 }} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#FFC107"
                                    strokeWidth={2}
                                    fill="url(#colorNetWorth)"
                                    dot={chartData.length === 1 ? { r: 6, fill: '#FFC107', strokeWidth: 2, stroke: '#fff' } : false}
                                    activeDot={{ r: 4, fill: '#FFC107' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <GhostChart />
                        )}
                        </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <p className="text-white/70 text-xs mb-0.5">Assets</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(netWorth.total_assets)}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <p className="text-white/70 text-xs mb-0.5">Liabilities</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(netWorth.total_liabilities)}</p>
                    </div>
                </div>
            </div>

            {/* Learn More Modal */}
            {percentileData && percentileData.opted_in && (
                <PercentileLearnMoreModal
                    isOpen={isLearnMoreOpen}
                    onClose={() => setIsLearnMoreOpen(false)}
                    ageBracket={percentileData.age_bracket || '26-28'}
                    totalUsers={percentileData.total_users || 0}
                    usesSeedData={percentileData.uses_seed_data || false}
                    onOptOut={handleOptOut}
                    onChangeAgeBracket={handleChangeAgeBracket}
                />
            )}
        </div>
    )
}
