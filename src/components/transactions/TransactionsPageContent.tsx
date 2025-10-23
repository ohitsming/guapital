'use client'

import React, { useState, useEffect } from 'react'
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { useSubscription } from '@/lib/context/SubscriptionContext'
import { formatCurrency } from '@/utils/formatters'
import { Dropdown } from '@/components/ui/Dropdown'
import { PaymentModal } from '@/components/stripe'

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
  account_name: string
  account_type: string
  institution_name: string
}

export function TransactionsPageContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showPending, setShowPending] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const { hasAccess, isLoading: subscriptionLoading } = useSubscription()

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/plaid/transactions?limit=200')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions')
      }

      setTransactions(data.transactions || [])
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (hasAccess('transactionHistory')) {
      fetchTransactions()
    } else {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess])

  const handleRefresh = async () => {
    // First sync transactions
    setIsLoading(true)
    try {
      await fetch('/api/plaid/sync-transactions', { method: 'POST' })
      // Then fetch them
      await fetchTransactions()
    } catch (err) {
      console.error('Error syncing transactions:', err)
      setIsLoading(false)
    }
  }

  // Filter transactions
  let filteredTransactions = transactions

  // Date range filter
  if (dateRange !== 'all') {
    const daysAgo = parseInt(dateRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

    filteredTransactions = filteredTransactions.filter((txn) => {
      const txnDate = new Date(txn.date)
      return txnDate >= cutoffDate
    })
  }

  // Pending filter
  if (!showPending) {
    filteredTransactions = filteredTransactions.filter((txn) => !txn.pending)
  }

  // Category filter
  if (categoryFilter !== 'all') {
    filteredTransactions = filteredTransactions.filter((txn) => {
      const primaryCategory = txn.category[0]?.toLowerCase() || ''
      const aiCategory = txn.ai_category?.toLowerCase() || ''
      return primaryCategory.includes(categoryFilter.toLowerCase()) || aiCategory.includes(categoryFilter.toLowerCase())
    })
  }

  // Search filter
  if (searchQuery) {
    filteredTransactions = filteredTransactions.filter((txn) =>
      txn.merchant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.institution_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Calculate totals
  const totalSpent = filteredTransactions
    .filter((txn) => txn.amount > 0)
    .reduce((sum, txn) => sum + txn.amount, 0)

  const totalIncome = filteredTransactions
    .filter((txn) => txn.amount < 0)
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)

  const netCashFlow = totalIncome - totalSpent

  // Get unique categories for filter
  const allCategories = new Set<string>()
  transactions.forEach((txn) => {
    if (txn.category[0]) allCategories.add(txn.category[0])
    if (txn.ai_category) allCategories.add(txn.ai_category)
  })

  // Date range dropdown options
  const dateRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '60', label: 'Last 60 days' },
    { value: '90', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ]

  // Category filter dropdown options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...Array.from(allCategories)
      .sort()
      .map((cat) => ({ value: cat, label: cat })),
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Wait for subscription to load before checking access
  if (subscriptionLoading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-16 h-16 border-4 border-[#004D40]/20 border-t-[#004D40] rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-semibold text-gray-900">Loading...</p>
        </div>
      </div>
    )
  }

  // Access gate for non-Premium users
  if (!hasAccess('transactionHistory')) {
    return (
      <>
        <div className="p-4 lg:p-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Transactions</h1>
          <div className="bg-gradient-to-r from-[#004D40] to-[#00695C] rounded-xl p-8 text-center text-white shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
            <p className="text-lg mb-6">
              Transaction history and categorization is available on Premium plans.
            </p>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-8 py-3 bg-white text-[#004D40] font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      </>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-16 h-16 border-4 border-[#004D40]/20 border-t-[#004D40] rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-semibold text-gray-900">Loading transactions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Error loading transactions</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
          <button
            onClick={fetchTransactions}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
        <p className="text-gray-600">View and analyze your transaction history</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredTransactions.filter((t) => t.amount > 0).length} transactions
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredTransactions.filter((t) => t.amount < 0).length} transactions
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Net Cash Flow</p>
          <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netCashFlow)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{filteredTransactions.length} total transactions</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search and Actions Row */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                title="Sync transactions"
              >
                <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                Sync
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3">
            <Dropdown
              value={dateRange}
              onChange={setDateRange}
              options={dateRangeOptions}
              className="w-48"
            />

            <Dropdown
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
              className="w-48"
            />

            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={showPending}
                onChange={(e) => setShowPending(e.target.checked)}
                className="w-4 h-4 text-[#004D40] focus:ring-[#004D40] rounded"
              />
              <span className="text-sm font-medium text-gray-700">Show Pending</span>
            </label>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-md border-2 border-gray-200 text-center">
          <p className="text-gray-600 mb-4">
            {searchQuery || categoryFilter !== 'all' ? 'No transactions match your filters' : 'No transactions yet'}
          </p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors"
          >
            Sync Transactions
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <div className="space-y-2">
            {filteredTransactions.map((txn) => (
              <div
                key={txn.id}
                className={`flex items-center justify-between p-4 border-2 rounded-xl hover:shadow-md transition-all ${
                  txn.pending ? 'border-yellow-200 bg-yellow-50/50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h3 className="text-base font-semibold text-gray-900">{txn.merchant_name}</h3>
                    {txn.pending && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        Pending
                      </span>
                    )}
                    {txn.ai_category && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {txn.ai_category}
                        {txn.ai_confidence && ` (${Math.round(txn.ai_confidence * 100)}%)`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>{formatDate(txn.date)}</span>
                    <span>•</span>
                    <span>{txn.account_name}</span>
                    <span>•</span>
                    <span>{txn.institution_name}</span>
                    {txn.category[0] && (
                      <>
                        <span>•</span>
                        <span className="text-gray-500">{txn.category[0]}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="ml-4">
                  <p
                    className={`text-xl font-bold ${txn.amount > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {txn.amount > 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(txn.amount))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
