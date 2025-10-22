'use client'

import { useEffect, useState } from 'react'
import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

interface CashFlowData {
    income: number
    expenses: number
    netIncome: number
    transactionCount: number
}

/**
 * Monthly Cash Flow Panel
 * Requires Premium+ subscription (aiCategorization/transactionHistory features)
 * Fetches and displays income, expenses, and net income for the current month
 */
export default function MonthlyCashFlowPanel() {
    const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchCashFlow()
    }, [])

    const fetchCashFlow = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/cashflow/monthly')

            if (!response.ok) {
                throw new Error('Failed to fetch cash flow data')
            }

            const data = await response.json()
            setCashFlow(data)
        } catch (err) {
            console.error('Error fetching cash flow:', err)
            setError(err instanceof Error ? err.message : 'Failed to load cash flow data')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount?: number) => {
        if (amount === undefined) return '-'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="bg-gradient-to-br from-[#004D40] to-[#00695C] rounded-xl p-4 shadow-md text-white">
            <h2 className="text-base font-bold mb-3">This Month</h2>

            {loading ? (
                <div className="space-y-2 animate-pulse">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="h-3 w-12 bg-white/20 rounded mb-2"></div>
                                <div className="h-5 w-24 bg-white/20 rounded"></div>
                            </div>
                            <div className="w-6 h-6 bg-white/20 rounded"></div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="h-3 w-16 bg-white/20 rounded mb-2"></div>
                                <div className="h-5 w-24 bg-white/20 rounded"></div>
                            </div>
                            <div className="w-6 h-6 bg-white/20 rounded"></div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="h-3 w-20 bg-white/20 rounded mb-2"></div>
                                <div className="h-5 w-24 bg-white/20 rounded"></div>
                            </div>
                            <div className="w-6 h-6 bg-white/20 rounded"></div>
                        </div>
                    </div>
                </div>
            ) : error ? (
                <div className="text-center py-4">
                    <p className="text-white/80 text-sm mb-1">Unable to load cash flow</p>
                    <p className="text-white/60 text-xs">{error}</p>
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/70 text-xs mb-0.5">Income</p>
                                    <p className="text-lg font-bold">{formatCurrency(cashFlow?.income)}</p>
                                </div>
                                <ArrowTrendingUpIcon className="w-6 h-6 text-[#FFC107]/70" />
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/70 text-xs mb-0.5">Expenses</p>
                                    <p className="text-lg font-bold">{formatCurrency(cashFlow?.expenses)}</p>
                                </div>
                                <ArrowTrendingDownIcon className="w-6 h-6 text-white/50" />
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/70 text-xs mb-0.5">Net Income</p>
                                    <p className={`text-lg font-bold ${(cashFlow?.netIncome || 0) >= 0 ? 'text-[#FFC107]' : 'text-red-300'}`}>
                                        {formatCurrency(cashFlow?.netIncome)}
                                    </p>
                                </div>
                                <BanknotesIcon className="w-6 h-6 text-[#FFC107]/70" />
                            </div>
                        </div>
                    </div>

                    {cashFlow && cashFlow.transactionCount > 0 ? (
                        <p className="text-xs text-white/60 mt-3 text-center">
                            Based on {cashFlow.transactionCount} transaction{cashFlow.transactionCount !== 1 ? 's' : ''}
                        </p>
                    ) : (
                        <p className="text-xs text-white/60 mt-3 text-center">
                            Sync transactions to see cash flow analysis
                        </p>
                    )}
                </>
            )}
        </div>
    )
}
