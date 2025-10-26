'use client'

import { useEffect, useState, useCallback } from 'react'
import EmptyState from '@/components/dashboard/EmptyState'
import { ReceiptPercentIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
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
    const [syncing, setSyncing] = useState(false)
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

    const handleSync = async () => {
        try {
            setSyncing(true)
            setError(null) // Clear any existing errors

            const response = await fetch('/api/plaid/sync-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days: 90 })
            })

            if (!response.ok) {
                const errorData = await response.json()

                // Provide specific error messages based on status
                if (response.status === 404) {
                    showToast('No connected accounts found. Please connect a bank account first.', 'error')
                } else if (response.status === 401) {
                    showToast('Please log in again to sync transactions.', 'error')
                } else {
                    const errorMessage = errorData.details || errorData.error || 'Failed to sync transactions'
                    showToast(`Sync failed: ${errorMessage}`, 'error')
                }
                return
            }

            const data = await response.json()

            // Show success message with details
            if (data.transactions_synced > 0) {
                showToast(`Successfully synced ${data.transactions_synced} transaction${data.transactions_synced !== 1 ? 's' : ''} from ${data.items_processed} account${data.items_processed !== 1 ? 's' : ''}.`, 'success')
            } else {
                showToast('Sync completed. No new transactions found.', 'info')
            }

            // Refresh transactions after sync (show errors via toast)
            await fetchTransactions(true)
        } catch (err) {
            console.error('Error syncing transactions:', err)
            showToast('Unable to sync transactions. Please try again later.', 'error')
        } finally {
            setSyncing(false)
        }
    }

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
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#004D40] hover:bg-[#004D40]/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Sync transactions"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync'}
                </button>
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
