'use client'

import { NetWorthBreakdown } from '@/lib/interfaces/networth'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowTrendingDownIcon, SparklesIcon } from '@heroicons/react/24/outline'

// Brand colors
const COLORS = {
    credit_card_debt: '#EF4444', // red
    loans: '#F97316', // orange
}

interface LiabilityBreakdownPanelProps {
    breakdown: NetWorthBreakdown
    totalLiabilities: number
}

export default function LiabilityBreakdownPanel({ breakdown, totalLiabilities }: LiabilityBreakdownPanelProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const getLiabilityChartData = () => {
        const data = []
        if (breakdown.credit_card_debt > 0) data.push({ name: 'Credit Cards', value: breakdown.credit_card_debt, color: COLORS.credit_card_debt })
        if (breakdown.loans > 0) data.push({ name: 'Loans', value: breakdown.loans, color: COLORS.loans })
        return data
    }

    const liabilityChartData = getLiabilityChartData()

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

                    <div className="space-y-2">
                        {breakdown.credit_card_debt > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.credit_card_debt }}></div>
                                        <span className="text-xs font-medium text-gray-700">Credit Card Debt</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900">{formatCurrency(breakdown.credit_card_debt)}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className="h-1.5 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${(breakdown.credit_card_debt / totalLiabilities) * 100}%`,
                                            backgroundColor: COLORS.credit_card_debt
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}
                        {breakdown.loans > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.loans }}></div>
                                        <span className="text-xs font-medium text-gray-700">Loans & Mortgages</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-900">{formatCurrency(breakdown.loans)}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className="h-1.5 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${(breakdown.loans / totalLiabilities) * 100}%`,
                                            backgroundColor: COLORS.loans
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}
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
