'use client'

import { NetWorthBreakdown } from '@/lib/interfaces/networth'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowTrendingDownIcon, SparklesIcon, HomeIcon, DocumentTextIcon, BriefcaseIcon, CreditCardIcon, EllipsisHorizontalCircleIcon } from '@heroicons/react/24/outline'

// Brand colors for each liability category
const COLORS = {
    mortgage: '#EF4444',        // red
    personal_loan: '#F97316',   // orange
    business_debt: '#EAB308',   // yellow
    credit_debt: '#A855F7',     // purple
    other_debt: '#6B7280',      // gray
}

// Category icons
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    mortgage: HomeIcon,
    personal_loan: DocumentTextIcon,
    business_debt: BriefcaseIcon,
    credit_debt: CreditCardIcon,
    other_debt: EllipsisHorizontalCircleIcon,
}

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
    mortgage: 'Mortgage',
    personal_loan: 'Personal Loans',
    business_debt: 'Business Debt',
    credit_debt: 'Credit Cards',
    other_debt: 'Other Debt',
}

interface LiabilityBreakdownPanelProps {
    breakdown: NetWorthBreakdown | null
    totalLiabilities: number
    loading?: boolean
}

export default function LiabilityBreakdownPanel({ breakdown, totalLiabilities, loading = false }: LiabilityBreakdownPanelProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const getLiabilityChartData = () => {
        if (!breakdown) return []
        const data = []

        // Add each liability category if it has a value > 0
        if (breakdown.mortgage > 0) data.push({ name: 'Mortgage', value: breakdown.mortgage, color: COLORS.mortgage, category: 'mortgage' })
        if (breakdown.personal_loan > 0) data.push({ name: 'Personal Loans', value: breakdown.personal_loan, color: COLORS.personal_loan, category: 'personal_loan' })
        if (breakdown.business_debt > 0) data.push({ name: 'Business Debt', value: breakdown.business_debt, color: COLORS.business_debt, category: 'business_debt' })
        if (breakdown.credit_debt > 0) data.push({ name: 'Credit Cards', value: breakdown.credit_debt, color: COLORS.credit_debt, category: 'credit_debt' })
        if (breakdown.other_debt > 0) data.push({ name: 'Other Debt', value: breakdown.other_debt, color: COLORS.other_debt, category: 'other_debt' })

        return data
    }

    const liabilityChartData = getLiabilityChartData()

    // Get all liability items for display
    const getLiabilityItems = () => {
        if (!breakdown) return []

        const items: Array<{
            category: keyof typeof COLORS
            label: string
            value: number
            color: string
            icon: any
            percentage: number
        }> = []
        const categories: Array<keyof typeof COLORS> = ['mortgage', 'personal_loan', 'business_debt', 'credit_debt', 'other_debt']

        categories.forEach(category => {
            const value = breakdown[category]
            if (value > 0) {
                items.push({
                    category,
                    label: CATEGORY_LABELS[category],
                    value,
                    color: COLORS[category],
                    icon: CATEGORY_ICONS[category],
                    percentage: (value / totalLiabilities) * 100
                })
            }
        })

        // Sort by value descending
        return items.sort((a, b) => b.value - a.value)
    }

    const liabilityItems = getLiabilityItems()

    // Skeleton loader
    if (loading || !breakdown) {
        return (
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></div>
                    <div>
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>

                {/* Chart skeleton */}
                <div className="mb-4 h-[150px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border-8 border-gray-200"></div>
                </div>

                {/* Category skeletons */}
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-200 animate-pulse"></div>
                                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-gray-200 animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#004D40] to-[#00695C] flex items-center justify-center">
                    <ArrowTrendingDownIcon className="w-5 h-5 text-red-400" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-[#004D40]">Liabilities</h2>
                    <p className="text-xs text-gray-600">What you owe</p>
                </div>
            </div>

            {totalLiabilities > 0 ? (
                <>
                    {liabilityChartData.length > 0 && (
                        <div className="mb-4">
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie
                                        data={liabilityChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={60}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {liabilityChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className="space-y-2.5">
                        {liabilityItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <div key={item.category}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            <div className="flex items-center gap-1">
                                                <Icon className="w-3.5 h-3.5 text-gray-500" />
                                                <span className="text-xs font-medium text-gray-700">{item.label}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</span>
                                            <span className="text-xs font-bold text-gray-900">{formatCurrency(item.value)}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className="h-1.5 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${item.percentage}%`,
                                                backgroundColor: item.color
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Total liabilities summary */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600">Total Liabilities</span>
                            <span className="text-sm font-bold text-red-600">{formatCurrency(totalLiabilities)}</span>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 bg-gradient-to-br from-[#004D40]/5 to-[#00695C]/10 rounded-lg border-2 border-dashed border-[#004D40]/20">
                    <div className="w-12 h-12 rounded-full bg-[#004D40] flex items-center justify-center mb-3">
                        <SparklesIcon className="w-6 h-6 text-[#FFC107]" />
                    </div>
                    <p className="text-lg font-bold text-[#004D40] mb-1">Debt Free!</p>
                    <p className="text-xs text-gray-600">No liabilities tracked</p>
                </div>
            )}
        </div>
    )
}