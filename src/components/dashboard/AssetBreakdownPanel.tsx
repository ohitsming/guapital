'use client'

import { NetWorthBreakdown } from '@/lib/interfaces/networth'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'

// Brand colors
const COLORS = {
    cash: '#3B82F6', // blue
    investments: '#10B981', // green
    crypto: '#8B5CF6', // purple
    real_estate: '#F59E0B', // amber
    other: '#6B7280', // gray
}

interface AssetBreakdownPanelProps {
    breakdown: NetWorthBreakdown | null
    totalAssets: number
    loading?: boolean
}

export default function AssetBreakdownPanel({ breakdown, totalAssets, loading = false }: AssetBreakdownPanelProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const getAssetChartData = () => {
        if (!breakdown) return []
        const data = []
        if (breakdown.cash > 0) data.push({ name: 'Cash', value: breakdown.cash, color: COLORS.cash })
        if (breakdown.investments > 0) data.push({ name: 'Investments', value: breakdown.investments, color: COLORS.investments })
        if (breakdown.crypto > 0) data.push({ name: 'Crypto', value: breakdown.crypto, color: COLORS.crypto })
        if (breakdown.real_estate > 0) data.push({ name: 'Real Estate', value: breakdown.real_estate, color: COLORS.real_estate })
        if (breakdown.other > 0) data.push({ name: 'Other', value: breakdown.other, color: COLORS.other })
        return data
    }

    const assetChartData = getAssetChartData()

    // Skeleton loader
    if (loading || !breakdown) {
        return (
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></div>
                    <div>
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
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
                                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
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
                    <ArrowTrendingUpIcon className="w-5 h-5 text-[#FFC107]" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-[#004D40]">Assets</h2>
                    <p className="text-xs text-gray-600">What you own</p>
                </div>
            </div>

            {assetChartData.length > 0 && (
                <div className="mb-4">
                    <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                            <Pie
                                data={assetChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {assetChartData.map((entry, index) => (
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
                {breakdown.cash > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.cash }}></div>
                                <span className="text-xs font-medium text-gray-700">Cash</span>
                            </div>
                            <span className="text-xs font-bold text-gray-900">{formatCurrency(breakdown.cash)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                                className="h-1.5 rounded-full transition-all duration-500"
                                style={{
                                    width: `${(breakdown.cash / totalAssets) * 100}%`,
                                    backgroundColor: COLORS.cash
                                }}
                            ></div>
                        </div>
                    </div>
                )}
                {breakdown.investments > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.investments }}></div>
                                <span className="text-xs font-medium text-gray-700">Investments</span>
                            </div>
                            <span className="text-xs font-bold text-gray-900">{formatCurrency(breakdown.investments)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                                className="h-1.5 rounded-full transition-all duration-500"
                                style={{
                                    width: `${(breakdown.investments / totalAssets) * 100}%`,
                                    backgroundColor: COLORS.investments
                                }}
                            ></div>
                        </div>
                    </div>
                )}
                {breakdown.crypto > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.crypto }}></div>
                                <span className="text-xs font-medium text-gray-700">Crypto</span>
                            </div>
                            <span className="text-xs font-bold text-gray-900">{formatCurrency(breakdown.crypto)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                                className="h-1.5 rounded-full transition-all duration-500"
                                style={{
                                    width: `${(breakdown.crypto / totalAssets) * 100}%`,
                                    backgroundColor: COLORS.crypto
                                }}
                            ></div>
                        </div>
                    </div>
                )}
                {breakdown.real_estate > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.real_estate }}></div>
                                <span className="text-xs font-medium text-gray-700">Real Estate</span>
                            </div>
                            <span className="text-xs font-bold text-gray-900">{formatCurrency(breakdown.real_estate)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                                className="h-1.5 rounded-full transition-all duration-500"
                                style={{
                                    width: `${(breakdown.real_estate / totalAssets) * 100}%`,
                                    backgroundColor: COLORS.real_estate
                                }}
                            ></div>
                        </div>
                    </div>
                )}
                {breakdown.other > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.other }}></div>
                                <span className="text-xs font-medium text-gray-700">Other</span>
                            </div>
                            <span className="text-xs font-bold text-gray-900">{formatCurrency(breakdown.other)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                                className="h-1.5 rounded-full transition-all duration-500"
                                style={{
                                    width: `${(breakdown.other / totalAssets) * 100}%`,
                                    backgroundColor: COLORS.other
                                }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Total assets summary */}
            <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600">Total Assets</span>
                    <span className="text-sm font-bold text-[#004D40]">{formatCurrency(totalAssets)}</span>
                </div>
            </div>
        </div>
    )
}
