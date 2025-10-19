'use client'

import { useState, useRef, useEffect } from 'react'
import { NetWorthCalculation } from '@/lib/interfaces/networth'
import { TrendDataPoint } from '@/lib/interfaces/subscription'
import {
    SparklesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ChartBarIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline'

interface HeroNetWorthCardProps {
    netWorth: NetWorthCalculation
    trendData?: TrendDataPoint[]
    maxDays?: number
}

export default function HeroNetWorthCard({ netWorth, trendData, maxDays = 30 }: HeroNetWorthCardProps) {
    const [selectedDays, setSelectedDays] = useState(maxDays)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

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
        if (!trendData || trendData.length === 0) {
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

    return (
        <div className="mb-4 relative overflow-hidden rounded-xl bg-gradient-to-br from-[#004D40] via-[#00695C] to-[#00796B] p-5 shadow-lg">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-[#FFC107]" />
                        <h2 className="text-sm font-medium text-white/80">Your Total Net Worth</h2>
                    </div>

                    {/* Custom Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center gap-1.5 text-xs border border-white/20 bg-white/10 text-white/90 rounded-md px-3 py-1.5 backdrop-blur-sm hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                        >
                            <span>{dayOptions.find(opt => opt.value === selectedDays)?.label || `Last ${selectedDays} days`}</span>
                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isOpen && (
                            <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                <div className="py-1">
                                    {dayOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleSelectDays(option.value)}
                                            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                                                selectedDays === option.value
                                                    ? 'bg-gray-100 text-gray-900 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
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
                                {netWorth.net_worth >= 0 && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/20">
                                        <SparklesIcon className="w-4 h-4 text-[#FFC107]" />
                                        <span className="text-white/90 font-medium text-xs">Building Wealth</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-white/60 text-xs">
                                {selectedDays === 30 ? 'Past 30 days' : selectedDays === 90 ? 'Past 90 days' : 'Past 365 days'}
                            </p>
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

                {/* Net Worth Trend Chart */}
                <div className="mb-3 bg-white/5 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                    <div className="flex items-center justify-center h-24 text-white/50 text-xs">
                        <ChartBarIcon className="w-8 h-8 mr-2 text-white/30" />
                        <span>Track your progress over time</span>
                    </div>
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
        </div>
    )
}
