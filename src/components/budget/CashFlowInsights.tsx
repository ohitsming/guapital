'use client'

import React, { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Chart } from 'react-google-charts'
import { ArrowPathIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { useSubscription } from '@/lib/context/SubscriptionContext'
import { formatCurrency } from '@/utils/formatters'
import { Dropdown } from '@/components/ui/Dropdown'

interface Transaction {
  id: string
  date: string
  merchant_name: string
  category: string[]
  amount: number
  ai_category?: string
}

interface CategorySpending {
  category: string
  amount: number
  percentOfTotal: number
  change: number // Month-over-month change
  transactions: number
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food and Drink': '#10B981',
  'Shopping': '#3B82F6',
  'Transportation': '#F59E0B',
  'Travel': '#8B5CF6',
  'Entertainment': '#EC4899',
  'Bills': '#EF4444',
  'Healthcare': '#14B8A6',
  'Income': '#00695C',
  'Other': '#6B7280',
}

export function CashFlowInsights() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('current')

  const { hasAccess, isLoading: subscriptionLoading } = useSubscription()

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/plaid/transactions?limit=1000')
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
    if (hasAccess('budgeting')) {
      fetchTransactions()
    } else {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess])

  // Calculate spending by category for current month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Get current month transactions
  const currentMonthTransactions = transactions.filter((txn) => {
    const txnDate = new Date(txn.date)
    return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear
  })

  // Get previous month transactions for comparison
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const lastMonthTransactions = transactions.filter((txn) => {
    const txnDate = new Date(txn.date)
    return txnDate.getMonth() === lastMonth && txnDate.getFullYear() === lastMonthYear
  })

  // Calculate spending by category
  const calculateCategorySpending = (txns: Transaction[]): Map<string, number> => {
    const spending = new Map<string, number>()
    txns
      .filter((txn) => txn.amount > 0) // Only expenses
      .forEach((txn) => {
        const category = txn.ai_category || txn.category[0] || 'Other'
        const current = spending.get(category) || 0
        spending.set(category, current + txn.amount)
      })
    return spending
  }

  // Calculate income
  const calculateIncome = (txns: Transaction[]): number => {
    return txns
      .filter((txn) => txn.amount < 0) // Negative amounts are income in Plaid
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0)
  }

  const currentSpending = calculateCategorySpending(currentMonthTransactions)
  const lastMonthSpending = calculateCategorySpending(lastMonthTransactions)
  const currentIncome = calculateIncome(currentMonthTransactions)
  const lastMonthIncome = calculateIncome(lastMonthTransactions)

  // Build category spending array with trends
  const categorySpendingData: CategorySpending[] = []
  const totalSpent = Array.from(currentSpending.values()).reduce((sum, val) => sum + val, 0)

  currentSpending.forEach((amount, category) => {
    const lastAmount = lastMonthSpending.get(category) || 0
    const change = lastAmount > 0 ? ((amount - lastAmount) / lastAmount) * 100 : 0
    const txnCount = currentMonthTransactions.filter(
      (txn) => (txn.ai_category || txn.category[0] || 'Other') === category && txn.amount > 0
    ).length

    categorySpendingData.push({
      category,
      amount,
      percentOfTotal: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
      change,
      transactions: txnCount,
    })
  })

  // Sort by amount descending
  categorySpendingData.sort((a, b) => b.amount - a.amount)

  // Calculate totals
  const netCashFlow = currentIncome - totalSpent
  const lastMonthTotal = Array.from(lastMonthSpending.values()).reduce((sum, val) => sum + val, 0)
  const spendingChange = lastMonthTotal > 0 ? ((totalSpent - lastMonthTotal) / lastMonthTotal) * 100 : 0
  const incomeChange = lastMonthIncome > 0 ? ((currentIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0

  // Prepare chart data
  const pieData = categorySpendingData.slice(0, 8).map((cat) => ({
    name: cat.category,
    value: cat.amount,
  }))

  const trendChartData = categorySpendingData.slice(0, 6).map((cat) => ({
    category: cat.category.length > 15 ? cat.category.slice(0, 15) + '...' : cat.category,
    amount: cat.amount,
  }))

  // Month selector options
  const monthOptions = [
    { value: 'current', label: 'This Month' },
    { value: 'last', label: 'Last Month' },
    { value: '90days', label: 'Last 90 Days' },
  ]

  // Wait for subscription to load before checking access
  if (subscriptionLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
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
  if (!hasAccess('budgeting')) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Cash Flow Insights</h1>
        <div className="bg-gradient-to-r from-[#004D40] to-[#00695C] rounded-xl p-8 text-center text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
          <p className="text-lg mb-6">
            Cash flow insights and spending analysis are available on Premium and Pro plans.
          </p>
          <a
            href="/pricing"
            className="inline-block px-6 py-3 bg-white text-[#004D40] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Upgrade to Premium
          </a>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-16 h-16 border-4 border-[#004D40]/20 border-t-[#004D40] rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-semibold text-gray-900">Loading cash flow insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Error loading cash flow data</p>
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

  if (transactions.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Cash Flow Insights</h1>
        <div className="bg-white rounded-xl p-12 shadow-md border-2 border-gray-200 text-center">
          <p className="text-gray-600 mb-4">
            No transactions yet. Connect your accounts to start tracking your cash flow.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cash Flow Insights</h1>
          <p className="text-gray-600">Understand where your money is coming from and going to</p>
        </div>
        <div className="flex items-center gap-3">
          <Dropdown
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={monthOptions}
            className="w-48"
          />
          <button
            onClick={fetchTransactions}
            disabled={isLoading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Refresh data"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(currentIncome)}</p>
          {incomeChange !== 0 && (
            <div className="flex items-center gap-1 mt-2">
              {incomeChange > 0 ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${incomeChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}% vs last month
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
          {spendingChange !== 0 && (
            <div className="flex items-center gap-1 mt-2">
              {spendingChange > 0 ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-red-600" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-green-600" />
              )}
              <span className={`text-sm font-medium ${spendingChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {spendingChange > 0 ? '+' : ''}{spendingChange.toFixed(1)}% vs last month
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Net Cash Flow</p>
          <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {currentIncome > 0 ? `${((netCashFlow / currentIncome) * 100).toFixed(1)}% savings rate` : '-'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Transactions</p>
          <p className="text-2xl font-bold text-[#004D40]">{currentMonthTransactions.length}</p>
          <p className="text-xs text-gray-500 mt-2">This month</p>
        </div>
      </div>

      {/* Cash Flow Sankey Diagram */}
      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Money Flow - Sankey Diagram</h2>
        <p className="text-sm text-gray-600 mb-4">
          Visualizing how your income flows into different spending categories and savings
        </p>
        {categorySpendingData.length > 0 ? (
          <Chart
            chartType="Sankey"
            width="100%"
            height="500px"
            data={[
              ['From', 'To', 'Amount'],
              // Income flows to spending categories
              ...categorySpendingData.slice(0, 8).map((cat) => [
                'Total Income',
                cat.category,
                cat.amount,
              ]),
              // Add savings if positive cash flow
              ...(netCashFlow > 0 ? [['Total Income', '💰 Savings', netCashFlow]] : []),
            ]}
            options={{
              sankey: {
                node: {
                  colors: [
                    '#00695C', // Income node (dark teal)
                    ...categorySpendingData.slice(0, 8).map((cat) => CATEGORY_COLORS[cat.category] || '#6B7280'),
                    '#10B981', // Savings node (green)
                  ],
                  label: {
                    fontName: 'system-ui',
                    fontSize: 14,
                    color: '#111827',
                    bold: true,
                  },
                  width: 20,
                  nodePadding: 20,
                },
                link: {
                  colorMode: 'gradient',
                  colors: [
                    ...categorySpendingData.slice(0, 8).map((cat) => CATEGORY_COLORS[cat.category] || '#6B7280'),
                    '#10B981',
                  ],
                },
              },
              tooltip: {
                textStyle: {
                  fontName: 'system-ui',
                  fontSize: 13,
                },
              },
            }}
          />
        ) : (
          <div className="h-[500px] flex items-center justify-center text-gray-500">
            No spending data to visualize
          </div>
        )}

        {/* Legend/Summary */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Total Income:</span>
              <span className="ml-2 text-green-600 font-bold">{formatCurrency(currentIncome)}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Total Spent:</span>
              <span className="ml-2 text-red-600 font-bold">{formatCurrency(totalSpent)}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Net Savings:</span>
              <span className={`ml-2 font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netCashFlow)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spending by Category Pie */}
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Spending Distribution</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / totalSpent) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[entry.name] || `hsl(${(index * 360) / pieData.length}, 70%, 50%)`}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No spending data for this period
            </div>
          )}
        </div>

        {/* Top Categories Bar Chart */}
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Spending Categories</h2>
          {trendChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <YAxis type="category" dataKey="category" stroke="#6B7280" style={{ fontSize: '12px' }} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="amount" fill="#004D40" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No spending data
            </div>
          )}
        </div>
      </div>

      {/* Category Details Table */}
      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Spending Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">% of Total</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Transactions</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">vs Last Month</th>
              </tr>
            </thead>
            <tbody>
              {categorySpendingData.map((cat, index) => (
                <tr key={cat.category} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#6B7280' }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900">{cat.category}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                    {formatCurrency(cat.amount)}
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-gray-600">
                    {cat.percentOfTotal.toFixed(1)}%
                  </td>
                  <td className="text-right py-3 px-4 text-sm text-gray-600">{cat.transactions}</td>
                  <td className="text-right py-3 px-4">
                    {cat.change !== 0 ? (
                      <div className="flex items-center justify-end gap-1">
                        {cat.change > 0 ? (
                          <ArrowTrendingUpIcon className="w-4 h-4 text-red-600" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-4 h-4 text-green-600" />
                        )}
                        <span className={`text-sm font-medium ${cat.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {cat.change > 0 ? '+' : ''}{cat.change.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
