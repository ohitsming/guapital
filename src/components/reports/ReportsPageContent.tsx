'use client'

import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ArrowPathIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '@/utils/formatters'
import { useSubscription } from '@/lib/context/SubscriptionContext'
import { Dropdown } from '@/components/ui/Dropdown'

interface NetWorthSnapshot {
  snapshot_date: string
  total_assets: number
  total_liabilities: number
  net_worth: number
  breakdown: {
    cash: number
    investments: number
    crypto: number
    real_estate: number
    other: number
    credit_card_debt: number
    loans: number
  }
}

interface CategoryData {
  name: string
  value: number
  color: string
}

const CATEGORY_COLORS: Record<string, string> = {
  cash: '#10B981',
  investments: '#3B82F6',
  real_estate: '#8B5CF6',
  crypto: '#F59E0B',
  other: '#6B7280',
}

const COLORS = ['#004D40', '#00695C', '#00897B', '#26A69A', '#4DB6AC', '#80CBC4', '#B2DFDB']

export function ReportsPageContent() {
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'30' | '90' | '365'>('90')

  const { hasAccess, isLoading: subscriptionLoading } = useSubscription()

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/networth/history?days=${timeRange}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data')
      }

      setSnapshots(data.snapshots || [])
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (hasAccess('advancedReports')) {
      fetchData()
    } else {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, hasAccess])

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
  if (!hasAccess('advancedReports')) {
    return (
      <div className="p-4 lg:p-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Reports</h1>
        <div className="bg-gradient-to-r from-[#004D40] to-[#00695C] rounded-xl p-8 text-center text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
          <p className="text-lg mb-6">
            Advanced reports and analytics are available on Premium and Pro plans.
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

  // Time range dropdown options
  const timeRangeOptions = [
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: '365', label: 'Last Year' },
  ]

  // Prepare chart data
  const netWorthChartData = snapshots.map((snapshot) => ({
    date: new Date(snapshot.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    netWorth: snapshot.net_worth,
    assets: snapshot.total_assets,
    liabilities: snapshot.total_liabilities,
  }))

  // Get latest snapshot for current data
  const latestSnapshot = snapshots[snapshots.length - 1]
  const firstSnapshot = snapshots[0]

  // Calculate growth
  let netWorthGrowth = 0
  let netWorthGrowthPercent = 0
  if (latestSnapshot && firstSnapshot) {
    netWorthGrowth = latestSnapshot.net_worth - firstSnapshot.net_worth
    netWorthGrowthPercent = firstSnapshot.net_worth !== 0
      ? (netWorthGrowth / Math.abs(firstSnapshot.net_worth)) * 100
      : 0
  }

  // Prepare category breakdown data (assets only)
  const categoryData: CategoryData[] = []
  if (latestSnapshot?.breakdown) {
    const assetCategories = ['cash', 'investments', 'crypto', 'real_estate', 'other']
    assetCategories.forEach((category) => {
      const value = latestSnapshot.breakdown[category as keyof typeof latestSnapshot.breakdown]
      if (value > 0) {
        categoryData.push({
          name: category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          value,
          color: CATEGORY_COLORS[category] || '#6B7280',
        })
      }
    })
  }

  // Prepare liability breakdown data
  const liabilityData: CategoryData[] = []
  if (latestSnapshot?.breakdown) {
    const liabilityCategories = ['credit_card_debt', 'loans']
    liabilityCategories.forEach((category) => {
      const value = latestSnapshot.breakdown[category as keyof typeof latestSnapshot.breakdown]
      if (value > 0) {
        liabilityData.push({
          name: category === 'credit_card_debt' ? 'Credit Card Debt' : 'Loans',
          value,
          color: category === 'credit_card_debt' ? '#EF4444' : '#F97316',
        })
      }
    })
  }

  // Prepare monthly growth data
  const monthlyGrowthData = []
  for (let i = 1; i < snapshots.length; i++) {
    const current = snapshots[i]
    const previous = snapshots[i - 1]
    const growth = current.net_worth - previous.net_worth
    monthlyGrowthData.push({
      date: new Date(current.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      growth,
    })
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-16 h-16 border-4 border-[#004D40]/20 border-t-[#004D40] rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-semibold text-gray-900">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Error loading reports</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (snapshots.length === 0) {
    return (
      <div className="p-4 lg:p-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Reports</h1>
        <div className="bg-white rounded-xl p-8 lg:p-12 shadow-md border-2 border-gray-200 text-center">
          <p className="text-gray-600 mb-4">
            No historical data available yet. Reports will appear once you start tracking your net worth.
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
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Reports</h1>
          <p className="text-gray-600">Advanced analytics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Dropdown
            value={timeRange}
            onChange={(value) => setTimeRange(value as any)}
            options={timeRangeOptions}
            className="w-48"
          />
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Current Net Worth</p>
          <p className="text-2xl font-bold text-[#004D40]">
            {latestSnapshot ? formatCurrency(latestSnapshot.net_worth) : '$0'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Period Growth</p>
          <p className={`text-2xl font-bold ${netWorthGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netWorthGrowth >= 0 ? '+' : ''}
            {formatCurrency(netWorthGrowth)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {netWorthGrowth >= 0 ? (
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${netWorthGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netWorthGrowthPercent >= 0 ? '+' : ''}
              {netWorthGrowthPercent.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Assets</p>
          <p className="text-2xl font-bold text-green-600">
            {latestSnapshot ? formatCurrency(latestSnapshot.total_assets) : '$0'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Liabilities</p>
          <p className="text-2xl font-bold text-red-600">
            {latestSnapshot ? formatCurrency(latestSnapshot.total_liabilities) : '$0'}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Worth Trend */}
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200 lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Net Worth Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={netWorthChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke="#004D40"
                strokeWidth={3}
                dot={{ fill: '#004D40', r: 4 }}
                name="Net Worth"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Assets vs Liabilities */}
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Assets vs Liabilities</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={netWorthChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="assets" fill="#10B981" name="Assets" />
              <Bar dataKey="liabilities" fill="#EF4444" name="Liabilities" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Category Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Asset Breakdown by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${((entry.value / latestSnapshot.total_assets) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No asset data available
            </div>
          )}
        </div>

        {/* Liability Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Liability Breakdown</h2>
          {liabilityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={liabilityData as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${((entry.value / latestSnapshot.total_liabilities) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {liabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No liability data available
            </div>
          )}
        </div>

        {/* Daily Growth */}
        {monthlyGrowthData.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Net Worth Change</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar
                  dataKey="growth"
                  fill="#004D40"
                  name="Daily Change"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
