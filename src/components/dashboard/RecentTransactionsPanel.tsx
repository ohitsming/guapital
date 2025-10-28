'use client'

import { useEffect, useState, useCallback } from 'react'
import EmptyState from '@/components/dashboard/EmptyState'
import { ReceiptPercentIcon } from '@heroicons/react/24/outline'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useToast } from '@/components/toast/ToastProvider'

interface Transaction {
    id: string
    transaction_id: string
    date: string
    authorized_date?: string
    merchant_name: string
    category: string[]
    amount: number
    currency: string
    pending: boolean
    ai_category?: string
    ai_confidence?: number
    account_name?: string
    account_type?: string
    institution_name?: string
}

interface RecentTransactionsPanelProps {
    limit?: number
}

/**
 * Recent Transactions Panel
 * Requires Premium+ subscription (transactionHistory feature)
 */
export default function RecentTransactionsPanel({ limit = 50 }: RecentTransactionsPanelProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { showToast } = useToast()

    const fetchTransactions = useCallback(async (showErrorToast: boolean = false) => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch(`/api/plaid/transactions?limit=${limit}`)

            if (!response.ok) {
                const errorData = await response.json()
                const errorMessage = errorData.error || 'Failed to fetch transactions'
                throw new Error(errorMessage)
            }

            const data = await response.json()
            setTransactions(data.transactions || [])
        } catch (err) {
            console.error('Error fetching transactions:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions'
            setError(errorMessage)
            // Only show toast if explicitly requested (e.g., after sync)
            if (showErrorToast) {
                showToast(errorMessage, 'error')
            }
        } finally {
            setLoading(false)
        }
    }, [limit, showToast])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const getCategoryDisplay = (txn: Transaction) => {
        if (txn.ai_category) {
            return txn.ai_category
        }
        if (txn.category && txn.category.length > 0) {
            return txn.category[0]
        }
        return 'Uncategorized'
    }

    const getAmountColor = (amount: number) => {
        // In Plaid, positive amounts are debits (money out), negative amounts are credits (money in)
        return amount > 0 ? 'text-red-600' : 'text-green-600'
    }

    // Hide panel completely if no transactions (after loading completes)
    if (!loading && !error && transactions.length === 0) {
        return null
    }

    return (
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-[#004D40]">Recent Transactions</h2>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 animate-pulse">
                            <div className="flex-1 min-w-0">
                                <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 w-48 bg-gray-200 rounded mb-1"></div>
                                <div className="h-3 w-24 bg-gray-200 rounded"></div>
                            </div>
                            <div className="ml-4">
                                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {transactions.map((txn) => (
                        <div
                            key={txn.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {txn.merchant_name}
                                    </p>
                                    {txn.pending && (
                                        <span className="px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                            Pending
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                    <span>{getCategoryDisplay(txn)}</span>
                                    <span>•</span>
                                    <span>{txn.account_name}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {formatDate(txn.date)}
                                </p>
                            </div>
                            <div className="ml-4 text-right">
                                <p className={`text-sm font-bold ${getAmountColor(txn.amount)}`}>
                                    {txn.amount > 0 ? '-' : '+'}{formatCurrency(Math.abs(txn.amount))}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
