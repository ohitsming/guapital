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
import { getLoanTermForCategory } from '@/lib/config/growth-rates'
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
  const [growthRateInput, setGrowthRateInput] = useState<string>('0')
  const [customLoanTerm, setCustomLoanTerm] = useState<number>(0)
  const [loanTermInput, setLoanTermInput] = useState<string>('0')
  const [customMonthlyContribution, setCustomMonthlyContribution] = useState<number>(0)
  const [monthlyContributionInput, setMonthlyContributionInput] = useState<string>('0')
  const [enableContributionToggle, setEnableContributionToggle] = useState<Record<string, boolean>>({})
  const [customRates, setCustomRates] = useState<Record<string, number>>({})
  const [customLoanTerms, setCustomLoanTerms] = useState<Record<string, number>>({})
  const [customMonthlyContributions, setCustomMonthlyContributions] = useState<Record<string, number>>({})
  const [originalProjections, setOriginalProjections] = useState<Record<string, AccountProjection>>({})
  const [isSaving, setIsSaving] = useState(false)

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

      // Store original projections for each account (to restore when user resets to original values)
      const originals: Record<string, AccountProjection> = {}
      data.projections.breakdown.assets.forEach(acc => {
        originals[acc.id] = { ...acc }
      })
      data.projections.breakdown.liabilities.forEach(acc => {
        originals[acc.id] = { ...acc }
      })
      setOriginalProjections(originals)
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
    return `${(rate * 100).toFixed(2)}%`
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

    // Get current rate (always stored as positive for liabilities now)
    const currentRate = customRates[account.id] ?? account.growthRate
    const rate = Math.abs(currentRate) * 100
    const rateValue = parseFloat(rate.toFixed(2))
    setCustomGrowthRate(rateValue)
    setGrowthRateInput(rateValue.toFixed(2))

    // Initialize loan term for liabilities with fallback to config defaults
    const defaultLoanTerm = getLoanTermForCategory(account.category)
    const loanTerm = customLoanTerms[account.id] ?? account.loanTermYears ?? defaultLoanTerm
    setCustomLoanTerm(loanTerm)
    setLoanTermInput(loanTerm.toString())

    // Initialize monthly contribution
    const monthlyContribution = customMonthlyContributions[account.id] ?? account.monthlyContribution ?? 0
    setCustomMonthlyContribution(monthlyContribution)
    setMonthlyContributionInput(monthlyContribution.toString())

    // Initialize toggle state - enable if account already has a contribution set
    if (monthlyContribution > 0) {
      setEnableContributionToggle(prev => ({
        ...prev,
        [account.id]: true
      }))
    }
  }

  const handleSaveGrowthRate = async () => {
    if (!editingAccount) return

    setIsSaving(true)
    const newRate = customGrowthRate / 100

    // Check if this is a liability
    const liabilityCategories = ['mortgage', 'personal_loan', 'business_debt', 'credit_debt', 'other_debt', 'auto', 'student', 'credit_card', 'loan', 'home_equity', 'line_of_credit']
    const isLiability = editingAccount.accountType === 'liability' ||
                       editingAccount.accountType === 'credit' ||
                       editingAccount.accountType === 'loan' ||
                       liabilityCategories.includes(editingAccount.category)

    // Save to database for both assets and liabilities
    try {
      const response = await fetch(`/api/assets/${editingAccount.id}/loan-details`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loan_term_years: isLiability ? customLoanTerm : null,
          interest_rate: newRate,
          monthly_contribution: customMonthlyContribution,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save changes')
      }

      console.log(isLiability ? '✓ Loan details saved to database' : '✓ Growth rate saved to database')
    } catch (error) {
      console.error('Error saving changes:', error)
      // Continue with local update even if API fails
    } finally {
      setIsSaving(false)
    }

    setCustomRates(prev => ({
      ...prev,
      [editingAccount.id]: newRate
    }))

    // Save custom loan term for liabilities
    setCustomLoanTerms(prev => ({
      ...prev,
      [editingAccount.id]: customLoanTerm
    }))

    // Save custom monthly contribution
    setCustomMonthlyContributions(prev => ({
      ...prev,
      [editingAccount.id]: customMonthlyContribution
    }))

    // Recalculate projections with new rate
    if (projections) {
      const updatedProjections = { ...projections }

      // Update the specific account in assets or liabilities
      const updateAccountRate = (accounts: AccountProjection[]) => {
        return accounts.map(acc => {
          if (acc.id === editingAccount.id) {
            const currentBalance = acc.currentBalance

            // Check if this is a liability using multiple methods
            const liabilityCategories = ['mortgage', 'personal_loan', 'business_debt', 'credit_debt', 'other_debt', 'auto', 'student', 'credit_card', 'loan', 'home_equity', 'line_of_credit']
            const isLiability = acc.accountType === 'liability' ||
                               acc.accountType === 'credit' ||
                               acc.accountType === 'loan' ||
                               liabilityCategories.includes(acc.category)

            console.log('DEBUG - Checking if liability:', {
              accountName: acc.name,
              accountType: acc.accountType,
              category: acc.category,
              isLiability
            })

            // Check if we're back to original values (within a small tolerance)
            const originalAccount = originalProjections[acc.id]
            if (originalAccount) {
              const originalRate = originalAccount.growthRate
              const originalTerm = originalAccount.loanTermYears ?? getLoanTermForCategory(originalAccount.category)
              const isBackToOriginal = Math.abs(newRate - originalRate) < 0.0001 && customLoanTerm === originalTerm

              // If back to original values for a liability, use the original projections from the API
              if (isLiability && isBackToOriginal && originalAccount.projectedValues) {
                return {
                  ...acc,
                  growthRate: newRate,
                  loanTermYears: customLoanTerm,
                  projectedValues: originalAccount.projectedValues
                }
              }
            }

            // Otherwise, recalculate projections with new rate and loan term
            const calculateLiabilityProjection = (balance: number, rate: number, term: number, years: number): number => {
              console.log('[Frontend Calculation]', {
                account: editingAccount.name,
                balance,
                rate,
                term,
                years,
                willBePaidOff: years >= term
              })

              // If no term or rate, assume constant balance
              if (!term || !rate) {
                console.log('[Frontend] Returning balance (no term/rate):', balance)
                return balance
              }

              // If projection years >= loan term, loan is fully paid off
              if (years >= term) {
                console.log('[Frontend] Loan paid off at year', years, '(term:', term, ')')
                return 0
              }

              // Calculate fixed monthly payment
              const monthlyRate = Math.abs(rate) / 12
              const totalMonths = term * 12
              const fixedMonthlyPayment = balance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)

              // Calculate remaining balance after N years
              let remainingBalance = balance
              const projectionMonths = years * 12

              for (let month = 0; month < projectionMonths; month++) {
                const monthlyInterest = remainingBalance * monthlyRate
                const principalPayment = fixedMonthlyPayment - monthlyInterest
                remainingBalance = Math.max(0, remainingBalance - principalPayment)
                if (remainingBalance <= 0) {
                  return 0
                }
              }

              return remainingBalance
            }

            // Helper function: calculate future value with monthly contributions
            const calculateAssetWithContributions = (balance: number, rate: number, years: number, monthlyContribution: number): number => {
              // Future value of current balance
              const fvOfBalance = balance * Math.pow(1 + rate, years)

              // Future value of monthly contributions (annuity formula)
              // FV = PMT × [((1+r)^n - 1) / r]
              const fvOfContributions = rate === 0
                ? monthlyContribution * 12 * years  // If no growth, just sum contributions
                : monthlyContribution * 12 * (Math.pow(1 + rate, years) - 1) / rate

              return fvOfBalance + fvOfContributions
            }

            const projectedValues = isLiability
              ? {
                  // For liabilities: calculate paydown with loan term
                  oneYear: calculateLiabilityProjection(currentBalance, newRate, customLoanTerm, 1),
                  fiveYears: calculateLiabilityProjection(currentBalance, newRate, customLoanTerm, 5),
                  tenYears: calculateLiabilityProjection(currentBalance, newRate, customLoanTerm, 10),
                  twentyYears: calculateLiabilityProjection(currentBalance, newRate, customLoanTerm, 20),
                  thirtyYears: calculateLiabilityProjection(currentBalance, newRate, customLoanTerm, 30),
                }
              : {
                  // For assets: compound growth with contributions
                  oneYear: calculateAssetWithContributions(currentBalance, newRate, 1, customMonthlyContribution),
                  fiveYears: calculateAssetWithContributions(currentBalance, newRate, 5, customMonthlyContribution),
                  tenYears: calculateAssetWithContributions(currentBalance, newRate, 10, customMonthlyContribution),
                  twentyYears: calculateAssetWithContributions(currentBalance, newRate, 20, customMonthlyContribution),
                  thirtyYears: calculateAssetWithContributions(currentBalance, newRate, 30, customMonthlyContribution),
                }

            console.log('='.repeat(80))
            console.log('FINAL PROJECTION RESULTS FOR:', editingAccount.name)
            console.log('='.repeat(80))
            console.log('Account Type:', acc.accountType)
            console.log('Is Liability:', isLiability)
            console.log('Current Balance:', currentBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' }))
            console.log('Interest Rate:', (newRate * 100).toFixed(2) + '%')
            console.log('Loan Term:', customLoanTerm, 'years')
            console.log('')
            console.log('PROJECTED VALUES:')
            console.log('  1 year: ', projectedValues.oneYear.toLocaleString('en-US', { style: 'currency', currency: 'USD' }))
            console.log('  5 years:', projectedValues.fiveYears.toLocaleString('en-US', { style: 'currency', currency: 'USD' }))
            console.log('  10 years:', projectedValues.tenYears.toLocaleString('en-US', { style: 'currency', currency: 'USD' }))
            console.log('  20 years:', projectedValues.twentyYears.toLocaleString('en-US', { style: 'currency', currency: 'USD' }))
            console.log('  30 years:', projectedValues.thirtyYears.toLocaleString('en-US', { style: 'currency', currency: 'USD' }))
            console.log('='.repeat(80))

            return {
              ...acc,
              growthRate: newRate,
              loanTermYears: isLiability ? customLoanTerm : acc.loanTermYears,
              projectedValues
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

      // Recalculate milestones
      const actualTotalAssets = updatedProjections.projections.breakdown.assets.reduce((sum, a) => sum + a.currentBalance, 0)
      const actualTotalLiabilities = updatedProjections.projections.breakdown.liabilities.reduce((sum, l) => sum + l.currentBalance, 0)
      const actualNetWorth = actualTotalAssets - actualTotalLiabilities

      const milestones: any = {}

      // Years to reach $1M
      if (actualNetWorth < 1000000 && actualNetWorth > 0) {
        const avgGrowthRate = updatedProjections.projections.breakdown.assets.length > 0
          ? updatedProjections.projections.breakdown.assets.reduce((sum, a) => sum + a.growthRate, 0) / updatedProjections.projections.breakdown.assets.length
          : 0.07

        const targetAssets = 1000000 + actualTotalLiabilities
        if (actualTotalAssets > 0 && targetAssets > actualTotalAssets) {
          const yearsToMillion = Math.log(targetAssets / actualTotalAssets) / Math.log(1 + avgGrowthRate)
          milestones.reachMillionaire = Math.max(0, yearsToMillion)
        }
      }

      // Years to double net worth
      if (actualNetWorth > 0) {
        const avgGrowthRate = updatedProjections.projections.breakdown.assets.length > 0
          ? updatedProjections.projections.breakdown.assets.reduce((sum, a) => sum + a.growthRate, 0) / updatedProjections.projections.breakdown.assets.length
          : 0.07

        const targetAssets = 2 * actualNetWorth + actualTotalLiabilities
        if (actualTotalAssets > 0 && targetAssets > actualTotalAssets) {
          const yearsToDouble = Math.log(targetAssets / actualTotalAssets) / Math.log(1 + avgGrowthRate)
          milestones.double = Math.max(0, yearsToDouble)
        }
      }

      updatedProjections.projections.milestones = milestones
      setProjections(updatedProjections)
    }

    setEditingAccount(null)

    // Refresh projections from API to get updated milestones
    await fetchProjections()
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

    // Calculate monthly payment for liabilities
    const calculateMonthlyPayment = (balance: number, annualRate: number, termYears: number): number => {
      if (!termYears || termYears === 0 || !annualRate) {
        // Revolving credit: use 3% minimum payment
        return balance * 0.03
      }

      const monthlyRate = Math.abs(annualRate) / 12
      const totalMonths = termYears * 12
      const numerator = monthlyRate * Math.pow(1 + monthlyRate, totalMonths)
      const denominator = Math.pow(1 + monthlyRate, totalMonths) - 1
      return balance * (numerator / denominator)
    }

    const monthlyPayment = isLiability && account.loanTermYears
      ? calculateMonthlyPayment(account.currentBalance, Math.abs(effectiveRate), account.loanTermYears)
      : null

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
              isLiability
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {formatPercentage(Math.abs(effectiveRate))}
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
        {monthlyPayment && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Est. Monthly Payment</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(monthlyPayment)}
                <span className="text-xs font-normal text-gray-500">/mo</span>
              </p>
            </div>
            {account.loanTermYears && (
              <p className="text-xs text-gray-400 mt-1">
                {account.loanTermYears}-year term @ {formatPercentage(Math.abs(effectiveRate))} APR
              </p>
            )}
          </div>
        )}
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
                    {projections.projections.breakdown.assets
                      .sort((a, b) => b.currentBalance - a.currentBalance)
                      .map(account =>
                        renderAccountProjection(account)
                      )}
                  </div>
                </div>
              )}

              {projections.projections.breakdown.liabilities.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Liabilities</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projections.projections.breakdown.liabilities
                      .sort((a, b) => b.currentBalance - a.currentBalance)
                      .map(account =>
                        renderAccountProjection(account)
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-2">
              <InformationCircleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-700">
                <h4 className="font-semibold mb-2 text-gray-900">Important Disclaimer</h4>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li><strong>Not Financial Advice:</strong> Guapital is not a registered investment advisor. These projections are automated calculations for educational purposes only and should not be considered personalized financial, investment, tax, or legal advice.</li>
                  <li><strong>Not a Recommendation:</strong> We do not provide recommendations to buy, sell, or hold any securities or investments. All projections are based on your inputs and generic assumptions.</li>
                  <li><strong>Historical Data Limitations:</strong> Growth rates are based on historical market averages. Past performance does not guarantee or predict future results.</li>
                  <li><strong>Market Volatility:</strong> Actual returns will vary significantly due to market conditions, economic factors, fees, taxes, inflation, and individual circumstances.</li>
                  <li><strong>Simplified Assumptions:</strong> Projections assume constant growth rates. Monthly contributions (if specified) are assumed to continue at the same rate indefinitely. Projections do not account for withdrawals, fees, taxes, salary changes, or life events. Real-world results will differ.</li>
                  <li><strong>Contribution Sustainability:</strong> If you&apos;ve specified monthly contributions, ensure these are sustainable based on your income and expenses. Projections assume contributions continue regardless of income, employment, or spending changes.</li>
                  <li><strong>Your Responsibility:</strong> You are solely responsible for your financial decisions. These tools do not constitute a recommendation for any course of action.</li>
                  <li><strong>Consult a Professional:</strong> For personalized financial planning, investment advice, or tax guidance, please consult with a qualified and registered financial advisor, CPA, or attorney.</li>
                </ul>
                <p className="mt-3 text-xs text-gray-600 font-medium border-t border-amber-200 pt-2">
                  By using this tool, you acknowledge that Guapital provides educational calculators only and does not provide investment advice or act as your financial advisor. All projections are hypothetical and for informational purposes only.
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
              <div className="bg-gray-100 p-4 rounded-lg space-y-2">
                <div className="font-mono text-sm">
                  <div className="font-semibold mb-1">Without Contributions:</div>
                  <div>Future Value = Current Balance × (1 + Rate)^Years</div>
                </div>
                <div className="font-mono text-sm mt-3">
                  <div className="font-semibold mb-1">With Monthly Contributions:</div>
                  <div>Future Value = Current Balance × (1 + Rate)^Years</div>
                  <div className="ml-4">+ Monthly Contribution × 12 × [(1 + Rate)^Years - 1] / Rate</div>
                </div>
              </div>
              <p className="text-xs text-gray-600 italic">
                💡 Add monthly contributions to each account for more accurate FIRE (Financial Independence, Retire Early) projections.
              </p>
            </div>
          </Modal>

          {/* Edit Growth Rate Modal */}
          <Modal
            isOpen={editingAccount !== null}
            onClose={() => setEditingAccount(null)}
            title={editingAccount ? (() => {
              const liabilityCategories = ['mortgage', 'personal_loan', 'business_debt', 'credit_debt', 'other_debt', 'auto', 'student', 'credit_card', 'loan', 'home_equity', 'line_of_credit']
              const isLiability = editingAccount.accountType === 'liability' ||
                                 editingAccount.accountType === 'credit' ||
                                 editingAccount.accountType === 'loan' ||
                                 liabilityCategories.includes(editingAccount.category)
              return isLiability ? "Edit Interest Rate" : "Edit Growth Rate"
            })() : "Edit Account"}
          >
            {editingAccount && (() => {
              const liabilityCategories = ['mortgage', 'personal_loan', 'business_debt', 'credit_debt', 'other_debt', 'auto', 'student', 'credit_card', 'loan', 'home_equity', 'line_of_credit']
              const isLiability = editingAccount.accountType === 'liability' || editingAccount.accountType === 'credit' || editingAccount.accountType === 'loan' || liabilityCategories.includes(editingAccount.category)

              return (
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
                      {isLiability ? 'Annual Interest Rate (%)' : 'Annual Growth Rate (%)'}
                    </label>
                    <input
                      id="growth-rate"
                      type="number"
                      step="0.01"
                      min="-100"
                      max="100"
                      value={growthRateInput}
                      onChange={(e) => {
                        const value = e.target.value
                        setGrowthRateInput(value)

                        // Update numeric value for calculations
                        const parsed = parseFloat(value)
                        if (!isNaN(parsed)) {
                          setCustomGrowthRate(parsed)
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value)
                        if (!isNaN(value)) {
                          const rounded = parseFloat(value.toFixed(2))
                          setCustomGrowthRate(rounded)
                          setGrowthRateInput(rounded.toFixed(2))
                        } else {
                          // If invalid, reset to previous value
                          setGrowthRateInput(customGrowthRate.toFixed(2))
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {formatPercentage(Math.abs(customRates[editingAccount.id] ?? editingAccount.growthRate))}
                    </p>
                    {isLiability && (
                      <p className="text-xs text-gray-600 mt-2 italic">
                        Note: For liabilities, enter the interest rate as a positive number (e.g., 6.5 for 6.5% APR). This will be used to calculate your debt paydown over time.
                      </p>
                    )}
                  </div>

                  {/* Loan Term Field (for liabilities only) */}
                  {isLiability && (
                    <div>
                      <label htmlFor="loan-term" className="block text-sm font-medium text-gray-700 mb-2">
                        Loan Term (years)
                      </label>
                      <input
                        id="loan-term"
                        type="number"
                        step="1"
                        min="0"
                        max="50"
                        value={loanTermInput}
                        onChange={(e) => {
                          const value = e.target.value
                          setLoanTermInput(value)

                          // Update numeric value for calculations
                          const parsed = parseFloat(value)
                          if (!isNaN(parsed)) {
                            setCustomLoanTerm(Math.round(parsed))
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value)
                          if (!isNaN(value) && value >= 0) {
                            const rounded = Math.round(value)
                            setCustomLoanTerm(rounded)
                            setLoanTermInput(rounded.toString())
                          } else {
                            // If invalid, reset to previous value
                            setLoanTermInput(customLoanTerm.toString())
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Current: {customLoanTerms[editingAccount.id] ?? editingAccount.loanTermYears ?? getLoanTermForCategory(editingAccount.category)} years
                        {!editingAccount.loanTermYears && !customLoanTerms[editingAccount.id] && (
                          <span className="text-gray-400"> (default)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600 mt-2 italic">
                        Enter 0 for revolving credit (e.g., credit cards with minimum payments). Otherwise, enter the loan term in years (e.g., 30 for a 30-year mortgage).
                      </p>
                    </div>
                  )}

                  {/* Monthly Contribution Field (for specific account types or manually enabled) */}
                  {(() => {
                    // Whitelist of account categories that support monthly contributions by default
                    const contributionEnabledCategories = [
                      // Retirement accounts
                      '401k', '403b', 'roth', 'ira', '529', 'hsa',
                      'sep_ira', 'simple_ira', 'roth_401k', 'pension', 'retirement',

                      // Investment accounts
                      'brokerage', 'investment', 'mutual_fund', 'stock_plan',

                      // Savings
                      'savings', 'cd', 'money_market',

                      // Crypto (DCA strategy)
                      'crypto', 'ethereum', 'bitcoin', 'polygon', 'base', 'arbitrum', 'optimism',
                      'crypto_ethereum', 'crypto_polygon', 'crypto_base', 'crypto_arbitrum', 'crypto_optimism',

                      // Business investment
                      'business',
                    ]

                    const categoryLower = editingAccount.category.toLowerCase()
                    const isDefaultEnabled = contributionEnabledCategories.some(cat =>
                      categoryLower.includes(cat.toLowerCase()) || cat.toLowerCase().includes(categoryLower)
                    )

                    const isManuallyEnabled = enableContributionToggle[editingAccount.id]
                    const shouldShowContribution = isLiability || isDefaultEnabled || isManuallyEnabled

                    // Show toggle for non-liability assets not in default whitelist
                    const shouldShowToggle = !isLiability && !isDefaultEnabled

                    return (
                      <>
                        {shouldShowToggle && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Enable Monthly Contributions</p>
                              <p className="text-xs text-gray-500 mt-0.5">Track ongoing deposits to this account</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isManuallyEnabled || false}
                                onChange={(e) => {
                                  setEnableContributionToggle(prev => ({
                                    ...prev,
                                    [editingAccount.id]: e.target.checked
                                  }))
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004D40]"></div>
                            </label>
                          </div>
                        )}

                        {shouldShowContribution && (
                  <div>
                    <label htmlFor="monthly-contribution" className="block text-sm font-medium text-gray-700 mb-2">
                      {isLiability ? 'Monthly Payment Override (Optional)' : 'Monthly Contribution (Optional)'}
                    </label>
                    <input
                      id="monthly-contribution"
                      type="number"
                      step="1"
                      min="0"
                      value={monthlyContributionInput}
                      onChange={(e) => {
                        const value = e.target.value
                        setMonthlyContributionInput(value)

                        // Update numeric value for calculations
                        const parsed = parseFloat(value)
                        if (!isNaN(parsed)) {
                          setCustomMonthlyContribution(Math.max(0, parsed))
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value)
                        if (!isNaN(value) && value >= 0) {
                          const rounded = Math.round(value)
                          setCustomMonthlyContribution(rounded)
                          setMonthlyContributionInput(rounded.toString())
                        } else {
                          // If invalid, reset to previous value
                          setMonthlyContributionInput(customMonthlyContribution.toString())
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(customMonthlyContributions[editingAccount.id] ?? editingAccount.monthlyContribution ?? 0)}
                      {!editingAccount.monthlyContribution && !customMonthlyContributions[editingAccount.id] && (
                        <span className="text-gray-400"> (not set)</span>
                      )}
                    </p>
                    {isLiability ? (
                      <p className="text-xs text-gray-600 mt-2 italic">
                        Override the calculated payment if you&apos;re paying extra to pay down debt faster. Leave at 0 to use calculated payment from loan terms.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-gray-600 mt-2 italic">
                          Expected monthly deposit to this account.
                        </p>
                        {editingAccount.category === '401k' && (
                          <p className="text-xs text-blue-600 mt-1">
                            💡 Annual 401(k) contribution limit (2025): $23,000 ($1,916/month)
                          </p>
                        )}
                        {editingAccount.category === 'ira' && (
                          <p className="text-xs text-blue-600 mt-1">
                            💡 Annual IRA contribution limit (2025): $7,000 ($583/month)
                          </p>
                        )}
                        {editingAccount.category === 'roth' && (
                          <p className="text-xs text-blue-600 mt-1">
                            💡 Annual Roth IRA contribution limit (2025): $7,000 ($583/month)
                          </p>
                        )}
                      </>
                    )}
                  </div>
                        )}
                      </>
                    )
                  })()}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-2">
                      {isLiability ? `Projected balance with ${Math.abs(customGrowthRate).toFixed(2)}% interest:` : `Projected value with ${customGrowthRate.toFixed(2)}% growth:`}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">10 years:</span>
                        <span className="ml-2 font-semibold text-[#004D40]">
                          {formatCurrency((() => {
                            const rate = customGrowthRate / 100
                            if (isLiability && customLoanTerm > 0) {
                              // Use liability projection with amortization
                              if (10 >= customLoanTerm) return 0 // Fully paid off

                              const monthlyRate = Math.abs(rate) / 12
                              const totalMonths = customLoanTerm * 12
                              const fixedMonthlyPayment = editingAccount.currentBalance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)

                              let remainingBalance = editingAccount.currentBalance
                              const projectionMonths = 10 * 12

                              for (let month = 0; month < projectionMonths; month++) {
                                const monthlyInterest = remainingBalance * monthlyRate
                                const principalPayment = fixedMonthlyPayment - monthlyInterest
                                remainingBalance = Math.max(0, remainingBalance - principalPayment)
                                if (remainingBalance <= 0) return 0
                              }

                              return remainingBalance
                            }
                            // Asset: compound growth with contributions
                            const fvOfBalance = editingAccount.currentBalance * Math.pow(1 + Math.abs(rate), 10)
                            const fvOfContributions = Math.abs(rate) === 0
                              ? customMonthlyContribution * 12 * 10
                              : customMonthlyContribution * 12 * (Math.pow(1 + Math.abs(rate), 10) - 1) / Math.abs(rate)
                            return fvOfBalance + fvOfContributions
                          })())}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">20 years:</span>
                        <span className="ml-2 font-semibold text-[#004D40]">
                          {formatCurrency((() => {
                            const rate = customGrowthRate / 100
                            if (isLiability && customLoanTerm > 0) {
                              // Use liability projection with amortization
                              if (20 >= customLoanTerm) return 0 // Fully paid off

                              const monthlyRate = Math.abs(rate) / 12
                              const totalMonths = customLoanTerm * 12
                              const fixedMonthlyPayment = editingAccount.currentBalance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)

                              let remainingBalance = editingAccount.currentBalance
                              const projectionMonths = 20 * 12

                              for (let month = 0; month < projectionMonths; month++) {
                                const monthlyInterest = remainingBalance * monthlyRate
                                const principalPayment = fixedMonthlyPayment - monthlyInterest
                                remainingBalance = Math.max(0, remainingBalance - principalPayment)
                                if (remainingBalance <= 0) return 0
                              }

                              return remainingBalance
                            }
                            // Asset: compound growth with contributions
                            const fvOfBalance = editingAccount.currentBalance * Math.pow(1 + Math.abs(rate), 20)
                            const fvOfContributions = Math.abs(rate) === 0
                              ? customMonthlyContribution * 12 * 20
                              : customMonthlyContribution * 12 * (Math.pow(1 + Math.abs(rate), 20) - 1) / Math.abs(rate)
                            return fvOfBalance + fvOfContributions
                          })())}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">30 years:</span>
                        <span className="ml-2 font-semibold text-[#004D40]">
                          {formatCurrency((() => {
                            const rate = customGrowthRate / 100
                            if (isLiability && customLoanTerm > 0) {
                              // Use liability projection with amortization
                              if (30 >= customLoanTerm) return 0 // Fully paid off

                              const monthlyRate = Math.abs(rate) / 12
                              const totalMonths = customLoanTerm * 12
                              const fixedMonthlyPayment = editingAccount.currentBalance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)

                              let remainingBalance = editingAccount.currentBalance
                              const projectionMonths = 30 * 12

                              for (let month = 0; month < projectionMonths; month++) {
                                const monthlyInterest = remainingBalance * monthlyRate
                                const principalPayment = fixedMonthlyPayment - monthlyInterest
                                remainingBalance = Math.max(0, remainingBalance - principalPayment)
                                if (remainingBalance <= 0) return 0
                              }

                              return remainingBalance
                            }
                            // Asset: compound growth with contributions
                            const fvOfBalance = editingAccount.currentBalance * Math.pow(1 + Math.abs(rate), 30)
                            const fvOfContributions = Math.abs(rate) === 0
                              ? customMonthlyContribution * 12 * 30
                              : customMonthlyContribution * 12 * (Math.pow(1 + Math.abs(rate), 30) - 1) / Math.abs(rate)
                            return fvOfBalance + fvOfContributions
                          })())}
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
                      disabled={isNaN(customGrowthRate) || isSaving}
                      className="flex-1 px-4 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                </div>
              )
            })()}
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