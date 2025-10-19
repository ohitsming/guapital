'use client'

import EmptyState from '@/components/dashboard/EmptyState'
import { ReceiptPercentIcon } from '@heroicons/react/24/outline'

interface Transaction {
    id: string
    name: string
    amount: number
    date: string
    category?: string
}

interface RecentTransactionsPanelProps {
    transactions?: Transaction[]
    limit?: number
}

/**
 * Recent Transactions Panel
 * Requires Premium+ subscription (transactionHistory feature)
 */
export default function RecentTransactionsPanel({ transactions, limit = 10 }: RecentTransactionsPanelProps) {
    return (
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
            <h2 className="text-base font-bold text-[#004D40] mb-3">Recent Transactions</h2>
            <EmptyState
                icon={<ReceiptPercentIcon className="w-8 h-8 text-[#004D40]/40" />}
                title="No transactions yet"
                description="Your recent transaction history will appear here once you connect and sync your accounts."
                className="min-h-[120px]"
            />
        </div>
    )
}
