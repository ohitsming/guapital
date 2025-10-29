'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '@/utils/api'
import {
  ChartBarIcon,
  TrophyIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  InformationCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import type {
  TrajectoryProjectionResponse,
  AccountProjection,
} from '@/lib/interfaces/trajectory-projection'
import Modal from '@/components/Modal'

// Category labels for account types
const CATEGORY_LABELS: Record<string, string> = {
  // Asset categories (manual)
  real_estate: 'Real Estate',
  vehicle: 'Vehicle',
  private_equity: 'Private Equity',
  collectibles: 'Collectibles',
  cash: 'Cash',
  investment: 'Investment',
  private_stock: 'Private Stock',
  bonds: 'Bonds',
  p2p_lending: 'P2P Lending',
  crypto: 'Cryptocurrency',
  other: 'Other Assets',

  // Liability categories (manual)
  mortgage: 'Mortgage',
  personal_loan: 'Personal Loan',
  business_debt: 'Business Debt',
  credit_debt: 'Credit/IOU',
  other_debt: 'Other Debt',

  // Plaid account types - Depository
  checking: 'Checking',
  savings: 'Savings',
  hsa: 'HSA',
  cd: 'CD',
  money_market: 'Money Market',
  paypal: 'PayPal',
  prepaid: 'Prepaid',
  cash_management: 'Cash Management',
  ebt: 'EBT',

  // Plaid account types - Credit
  credit_card: 'Credit Card',

  // Plaid account types - Loan
  auto: 'Auto Loan',
  business: 'Business Loan',
  commercial: 'Commercial Loan',
  construction: 'Construction Loan',
  consumer: 'Consumer Loan',
  home_equity: 'Home Equity',
  line_of_credit: 'Line of Credit',
  loan: 'Loan',
  student: 'Student Loan',

  // Plaid account types - Investment
  '401k': '401(k)',
  '403b': '403(b)',
  '457b': '457(b)',
  '529': '529 Plan',
  brokerage: 'Brokerage',
  ira: 'IRA',
  isa: 'ISA',
  keogh: 'Keogh',
  lif: 'LIF',
  lira: 'LIRA',
  lrif: 'LRIF',
  lrsp: 'LRSP',
  mutual_fund: 'Mutual Fund',
  non_taxable_brokerage_account: 'Non-Taxable Brokerage',
  pension: 'Pension',
  plan: 'Investment Plan',
  prif: 'PRIF',
  profit_sharing_plan: 'Profit Sharing',
  rdsp: 'RDSP',
  resp: 'RESP',
  retirement: 'Retirement',
  rlif: 'RLIF',
  roth: 'Roth IRA',
  roth_401k: 'Roth 401(k)',
  rrif: 'RRIF',
  rrsp: 'RRSP',
  sarsep: 'SARSEP',
  sep_ira: 'SEP IRA',
  simple_ira: 'SIMPLE IRA',
  sipp: 'SIPP',
  stock_plan: 'Stock Plan',
  tfsa: 'TFSA',
  trust: 'Trust',
  ugma: 'UGMA',
  utma: 'UTMA',
  variable_annuity: 'Variable Annuity',

  // Crypto
  crypto_ethereum: 'Ethereum',
  crypto_polygon: 'Polygon',
  crypto_base: 'Base',
  crypto_arbitrum: 'Arbitrum',
  crypto_optimism: 'Optimism',
}

export function TrajectoryPageContent() {
  const [projections, setProjections] = useState<TrajectoryProjectionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1' | '5' | '10' | '20' | '30'>('10')
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountProjection | null>(null)
  const [customGrowthRate, setCustomGrowthRate] = useState<number>(0)
  const [customRates, setCustomRates] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchProjections()
  }, [])

  const fetchProjections = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiGet('/api/trajectory/projection')

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch projections')
      }

      const data: TrajectoryProjectionResponse = await response.json()
      setProjections(data)
    } catch (err) {
      console.error('Error fetching projections:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projections')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '$0'
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (rate: number): string => {
    return `${(rate * 100).toFixed(1)}%`
  }

  const getProjectedValue = () => {
    if (!projections) return 0
    switch (selectedTimeframe) {
      case '1': return projections.projections.projections.oneYear
      case '5': return projections.projections.projections.fiveYears
      case '10': return projections.projections.projections.tenYears
      case '20': return projections.projections.projections.twentyYears
      case '30': return projections.projections.projections.thirtyYears
      default: return projections.projections.projections.tenYears
    }
  }

  const getGrowthMultiple = () => {
    if (!projections) return 0
    const projected = getProjectedValue()
    const current = projections.currentStatus.netWorth
    if (current <= 0) return 0
    return projected / current
  }

  const formatAccountTypeTitle = (accountType?: string): string => {
    if (!accountType) return ''

    const typeMapping: Record<string, string> = {
      'depository': 'Depository',
      'credit': 'Credit',
      'loan': 'Loan',
      'investment': 'Investment',
      'brokerage': 'Brokerage',
      'asset': 'Asset',
      'liability': 'Liability',
      'crypto': 'Crypto',
    }

    return typeMapping[accountType.toLowerCase()] || accountType.charAt(0).toUpperCase() + accountType.slice(1)
  }

  const handleEditGrowthRate = (account: AccountProjection) => {
    setEditingAccount(account)
    const rate = (customRates[account.id] ?? account.growthRate) * 100
    setCustomGrowthRate(parseFloat(rate.toFixed(2)))
  }

  const handleSaveGrowthRate = () => {
    if (!editingAccount) return

    const newRate = customGrowthRate / 100
    setCustomRates(prev => ({
      ...prev,
      [editingAccount.id]: newRate
    }))

    // Recalculate projections with new rate
    if (projections) {
      const updatedProjections = { ...projections }

      // Update the specific account in assets or liabilities
      const updateAccountRate = (accounts: AccountProjection[]) => {
        return accounts.map(acc => {
          if (acc.id === editingAccount.id) {
            const currentBalance = acc.currentBalance
            const isLiability = acc.accountType === 'liability' || acc.accountType === 'credit' || acc.accountType === 'loan'

            // For liabilities, we need to recalculate using the API
            // because it requires loan term data for proper paydown calculation
            // For now, just update the rate and mark as needing recalc
            return {
              ...acc,
              growthRate: newRate,
              projectedValues: isLiability
                ? {
                    // For liabilities, keep existing projections
                    // (would need full API call to recalculate properly with loan terms)
                    oneYear: acc.projectedValues.oneYear,
                    fiveYears: acc.projectedValues.fiveYears,
                    tenYears: acc.projectedValues.tenYears,
                    twentyYears: acc.projectedValues.twentyYears,
                    thirtyYears: acc.projectedValues.thirtyYears,
                  }
                : {
                    // For assets: compound growth
                    oneYear: currentBalance * Math.pow(1 + newRate, 1),
                    fiveYears: currentBalance * Math.pow(1 + newRate, 5),
                    tenYears: currentBalance * Math.pow(1 + newRate, 10),
                    twentyYears: currentBalance * Math.pow(1 + newRate, 20),
                    thirtyYears: currentBalance * Math.pow(1 + newRate, 30),
                  }
            }
          }
          return acc
        })
      }

      updatedProjections.projections.breakdown.assets = updateAccountRate(
        updatedProjections.projections.breakdown.assets
      )
      updatedProjections.projections.breakdown.liabilities = updateAccountRate(
        updatedProjections.projections.breakdown.liabilities
      )

      // Recalculate total projections
      const totalProjections = {
        oneYear: 0,
        fiveYears: 0,
        tenYears: 0,
        twentyYears: 0,
        thirtyYears: 0,
      }

      updatedProjections.projections.breakdown.assets.forEach(asset => {
        totalProjections.oneYear += asset.projectedValues.oneYear
        totalProjections.fiveYears += asset.projectedValues.fiveYears
        totalProjections.tenYears += asset.projectedValues.tenYears
        totalProjections.twentyYears += asset.projectedValues.twentyYears
        totalProjections.thirtyYears += asset.projectedValues.thirtyYears
      })

      // Subtract growing liabilities (use projected values, not current balance)
      updatedProjections.projections.breakdown.liabilities.forEach(liability => {
        totalProjections.oneYear -= liability.projectedValues.oneYear
        totalProjections.fiveYears -= liability.projectedValues.fiveYears
        totalProjections.tenYears -= liability.projectedValues.tenYears
        totalProjections.twentyYears -= liability.projectedValues.twentyYears
        totalProjections.thirtyYears -= liability.projectedValues.thirtyYears
      })

      updatedProjections.projections.projections = totalProjections
      setProjections(updatedProjections)
    }

    setEditingAccount(null)
  }

  const getEffectiveGrowthRate = (account: AccountProjection): number => {
    return customRates[account.id] ?? account.growthRate
  }

  const renderAccountProjection = (account: AccountProjection) => {
    const effectiveRate = getEffectiveGrowthRate(account)
    const projectedValue = (() => {
      switch (selectedTimeframe) {
        case '1': return account.projectedValues.oneYear
        case '5': return account.projectedValues.fiveYears
        case '10': return account.projectedValues.tenYears
        case '20': return account.projectedValues.twentyYears
        case '30': return account.projectedValues.thirtyYears
        default: return account.projectedValues.tenYears
      }
    })()

    // Determine if this is an asset or liability for badge color
    const liabilityCategories = ['mortgage', 'personal_loan', 'business_debt', 'credit_debt', 'other_debt', 'auto', 'student', 'credit_card', 'loan', 'home_equity', 'line_of_credit']
    const isLiability = account.accountType === 'liability' || account.accountType === 'credit' || account.accountType === 'loan' || liabilityCategories.includes(account.category)
    const categoryLabel = CATEGORY_LABELS[account.category] || account.category

    return (
      <div key={account.id} className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-medium text-gray-900">{account.name}</h4>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-lg border whitespace-nowrap ${
                isLiability
                  ? 'text-red-700 bg-red-50 border-red-200'
                  : 'text-green-700 bg-green-50 border-green-200'
              }`}>
                {categoryLabel}
              </span>
            </div>
            {account.accountType && (
              <p className="text-xs text-gray-500">{formatAccountTypeTitle(account.accountType)}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            <button
              onClick={() => handleEditGrowthRate(account)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Edit growth rate"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <span className={`text-xs px-2 py-1 rounded-full ${
              effectiveRate >= 0
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {formatPercentage(effectiveRate)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Current</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(account.currentBalance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Projected</p>
            <p className="text-lg font-semibold text-[#004D40]">
              {formatCurrency(projectedValue)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              Trajectory
            </h1>
            <p className="mt-2 text-gray-600">
              Your wealth projection based on account growth rates
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          {/* Main Projection Card Skeleton */}
          <div className="bg-gradient-to-br from-[#004D40] to-[#00695C] rounded-xl shadow-lg p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                {/* Header */}
                <div className="h-8 w-56 bg-white/20 rounded mb-6"></div>

                {/* Timeframe buttons */}
                <div className="flex gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 w-12 bg-white/10 rounded-lg"></div>
                  ))}
                </div>

                {/* Large number */}
                <div className="h-14 w-48 bg-white/20 rounded mb-2"></div>
                <div className="h-6 w-32 bg-white/15 rounded mb-1"></div>
                <div className="h-4 w-40 bg-white/10 rounded mb-6"></div>

                {/* Progress bar */}
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <div className="h-4 w-16 bg-white/15 rounded"></div>
                    <div className="h-4 w-16 bg-white/15 rounded"></div>
                  </div>
                  <div className="bg-white/20 rounded-full h-3 mb-2">
                    <div className="bg-amber-400/50 h-full w-1/3 rounded-full"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-white/15 rounded"></div>
                    <div className="h-4 w-20 bg-white/15 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="h-4 w-24 bg-white/20 rounded mb-2"></div>
                    <div className="h-8 w-20 bg-white/30 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Milestones Skeleton */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="h-8 w-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 w-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Breakdown Skeleton */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-6">
              {/* Assets section */}
              <div>
                <div className="h-5 w-16 bg-gray-200 rounded mb-3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <div>
                          <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                          <div className="h-4 w-20 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <div className="h-3 w-12 bg-gray-200 rounded mb-1"></div>
                          <div className="h-6 w-20 bg-gray-200 rounded"></div>
                        </div>
                        <div>
                          <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                          <div className="h-6 w-20 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchProjections}
            className="mt-4 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      ) : projections ? (
        <>
          {/* Main Projection Card */}
          <div className="bg-gradient-to-br from-[#004D40] to-[#00695C] rounded-xl shadow-lg p-8 text-white mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-amber-400" />
                  Wealth Projection
                  <button
                    onClick={() => setShowCalculationModal(true)}
                    className="ml-2 text-white/80 hover:text-white transition-colors"
                    aria-label="How projections are calculated"
                  >
                    <InformationCircleIcon className="h-6 w-6" />
                  </button>
                </h2>

                {/* Timeframe Selector */}
                <div className="flex gap-2 mb-6">
                  {(['1', '5', '10', '20', '30'] as const).map((years) => (
                    <button
                      key={years}
                      onClick={() => setSelectedTimeframe(years)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        selectedTimeframe === years
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {years}Y
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-5xl font-bold mb-2">
                      {formatCurrency(getProjectedValue())}
                    </div>
                    <div className="text-lg opacity-90">
                      In {selectedTimeframe} {parseInt(selectedTimeframe) === 1 ? 'year' : 'years'}
                    </div>
                    <div className="text-sm opacity-75 mt-2">
                      {getGrowthMultiple() > 0 && (
                        <span>{getGrowthMultiple().toFixed(1)}x your current net worth</span>
                      )}
                    </div>
                  </div>

                  {/* Progress visualization */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Current</span>
                      <span>Projected</span>
                    </div>
                    <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (projections.currentStatus.netWorth / getProjectedValue()) * 100)}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm mt-2 opacity-90">
                      <span>{formatCurrency(projections.currentStatus.netWorth)}</span>
                      <span>{formatCurrency(getProjectedValue())}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm opacity-75 mb-1">Current Net Worth</div>
                  <div className="text-3xl font-bold">
                    {formatCurrency(projections.currentStatus.netWorth)}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm opacity-75 mb-1">Total Accounts</div>
                  <div className="text-3xl font-bold">
                    {projections.currentStatus.accountCount}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm opacity-75 mb-1">Avg Growth Rate</div>
                  <div className="text-3xl font-bold">
                    {formatPercentage(projections.insights.averageGrowthRate)}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm opacity-75 mb-1">Assets</div>
                  <div className="text-3xl font-bold">
                    {formatCurrency(projections.currentStatus.totalAssets)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones */}
          {projections.projections.milestones && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrophyIcon className="h-6 w-6" />
                Milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projections.projections.milestones.reachMillionaire && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-amber-50 to-white">
                    <div className="text-2xl mb-2">💰</div>
                    <div className="text-sm text-gray-600 mb-1">Millionaire Status</div>
                    <div className="text-xl font-bold text-gray-900">
                      {Math.round(projections.projections.milestones.reachMillionaire)} years
                    </div>
                  </div>
                )}
                {projections.projections.milestones.double && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-2xl mb-2">📈</div>
                    <div className="text-sm text-gray-600 mb-1">Double Net Worth</div>
                    <div className="text-xl font-bold text-gray-900">
                      {Math.round(projections.projections.milestones.double)} years
                    </div>
                  </div>
                )}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-sm text-gray-600 mb-1">10-Year Target</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(projections.projections.projections.tenYears)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Breakdown */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ChartBarIcon className="h-6 w-6" />
              Account-Level Projections
            </h3>

            <div className="space-y-6">
              {projections.projections.breakdown.assets.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Assets</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projections.projections.breakdown.assets.map(account =>
                      renderAccountProjection(account)
                    )}
                  </div>
                </div>
              )}

              {projections.projections.breakdown.liabilities.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Liabilities</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projections.projections.breakdown.liabilities.map(account =>
                      renderAccountProjection(account)
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-2">
              <InformationCircleIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <h4 className="font-semibold mb-2 text-gray-700">Disclaimer</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Not Financial Advice:</strong> These projections are educational estimates only and should not be considered professional financial advice.</li>
                  <li><strong>Based on Historical Averages:</strong> Growth rates are based on historical market averages and do not guarantee future performance.</li>
                  <li><strong>Market Volatility:</strong> Actual returns will vary significantly due to market conditions, economic factors, and individual circumstances.</li>
                  <li><strong>Assumptions:</strong> Projections assume no additional contributions, withdrawals, or changes to your accounts.</li>
                  <li><strong>Consult a Professional:</strong> For personalized financial planning, please consult with a qualified financial advisor.</li>
                </ul>
                <p className="mt-2 text-xs text-gray-500 italic">
                  Use these projections as a general planning tool to understand potential growth trajectories, not as a guarantee of future wealth.
                </p>
              </div>
            </div>
          </div>

          {/* Calculation Modal */}
          <Modal
            isOpen={showCalculationModal}
            onClose={() => setShowCalculationModal(false)}
            title="How Projections Are Calculated"
          >
            <div className="text-sm text-gray-700 space-y-4">
              <p>
                Each account is assigned a growth rate based on its category using historical market averages.
                For example, stocks and retirement accounts use 7% annual growth, savings accounts use 2%,
                and crypto uses 15-20%. Liabilities are projected to decrease as you pay them down based on
                typical interest rates.
              </p>
              <p>
                All calculations use compound interest formulas:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-center">
                Future Value = Current Balance × (1 + Growth Rate)^Years
              </div>
            </div>
          </Modal>

          {/* Edit Growth Rate Modal */}
          <Modal
            isOpen={editingAccount !== null}
            onClose={() => setEditingAccount(null)}
            title="Edit Growth Rate"
          >
            {editingAccount && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-700 mb-1">Account</p>
                  <p className="font-medium text-gray-900">{editingAccount.name}</p>
                  {editingAccount.accountType && (
                    <p className="text-xs text-gray-500">{formatAccountTypeTitle(editingAccount.accountType)}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="growth-rate" className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Growth Rate (%)
                  </label>
                  <input
                    id="growth-rate"
                    type="number"
                    step="0.01"
                    min="-100"
                    max="100"
                    value={customGrowthRate}
                    onChange={(e) => setCustomGrowthRate(parseFloat(e.target.value))}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value)
                      if (!isNaN(value)) {
                        setCustomGrowthRate(parseFloat(value.toFixed(2)))
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Previous: {formatPercentage(customRates[editingAccount.id] ?? editingAccount.growthRate)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-2">Preview with {customGrowthRate.toFixed(1)}%:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">10 years:</span>
                      <span className="ml-2 font-semibold text-[#004D40]">
                        {formatCurrency(editingAccount.currentBalance * Math.pow(1 + customGrowthRate / 100, 10))}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">20 years:</span>
                      <span className="ml-2 font-semibold text-[#004D40]">
                        {formatCurrency(editingAccount.currentBalance * Math.pow(1 + customGrowthRate / 100, 20))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingAccount(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGrowthRate}
                    disabled={isNaN(customGrowthRate)}
                    className="flex-1 px-4 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </Modal>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <BanknotesIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Accounts Found</h3>
          <p className="text-gray-600">
            Add accounts to see your net worth trajectory projection.
          </p>
        </div>
      )}
    </div>
  )
}