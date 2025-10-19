'use client'

import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

interface MonthlyCashFlowPanelProps {
    income?: number
    expenses?: number
    netIncome?: number
}

/**
 * Monthly Cash Flow Panel
 * Requires Premium+ subscription (aiCategorization/transactionHistory features)
 */
export default function MonthlyCashFlowPanel({ income, expenses, netIncome }: MonthlyCashFlowPanelProps) {
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

            <div className="space-y-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/70 text-xs mb-0.5">Income</p>
                            <p className="text-lg font-bold">{formatCurrency(income)}</p>
                        </div>
                        <ArrowTrendingUpIcon className="w-6 h-6 text-[#FFC107]/70" />
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/70 text-xs mb-0.5">Expenses</p>
                            <p className="text-lg font-bold">{formatCurrency(expenses)}</p>
                        </div>
                        <ArrowTrendingDownIcon className="w-6 h-6 text-white/50" />
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/70 text-xs mb-0.5">Net Income</p>
                            <p className="text-lg font-bold">{formatCurrency(netIncome)}</p>
                        </div>
                        <BanknotesIcon className="w-6 h-6 text-[#FFC107]/70" />
                    </div>
                </div>
            </div>
            <p className="text-xs text-white/60 mt-3 text-center">Sync transactions to see cash flow analysis</p>
        </div>
    )
}
