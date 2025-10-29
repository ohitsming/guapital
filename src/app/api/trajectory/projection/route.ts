/**
 * API endpoint for Net Worth Trajectory Projections
 * Calculates future net worth based on account categories and growth rates
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  TrajectoryProjectionResponse,
  AccountProjection,
  NetWorthProjection,
  GrowthRateConfig,
  getGrowthRate,
  calculateFutureValue,
  DEFAULT_GROWTH_RATES,
} from '@/lib/interfaces/trajectory-projection'
import {
  calculateRemainingBalance,
  getGrowthRateForCategory,
  getLoanTermForCategory,
} from '@/lib/config/growth-rates'

/**
 * Calculate projected liability balance over time with loan paydown
 * Returns decreasing balances as principal is paid down
 */
function calculateLiabilityProjection(
  currentBalance: number,
  interestRate: number,
  termYears: number,
  years: number
): number {
  // If no term or interest rate, assume it stays constant (e.g., credit cards making minimum payments)
  if (!termYears || !interestRate) {
    return currentBalance
  }

  // Calculate FIXED monthly payment based on original loan terms
  // This payment stays constant throughout the loan
  const monthlyRate = Math.abs(interestRate) / 12
  const totalMonths = termYears * 12
  const fixedMonthlyPayment = currentBalance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)

  // Calculate remaining balance after N years of fixed payments
  let balance = currentBalance
  const projectionMonths = years * 12

  for (let month = 0; month < projectionMonths; month++) {
    // Calculate interest on current balance
    const monthlyInterest = balance * monthlyRate

    // Principal payment = fixed payment - interest
    const principalPayment = fixedMonthlyPayment - monthlyInterest

    // Reduce balance by principal payment
    balance = Math.max(0, balance - principalPayment)

    // If balance is paid off, return 0
    if (balance <= 0) {
      return 0
    }
  }

  return balance
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate current net worth directly (avoid circular fetch issues)
    // We'll calculate this from the accounts we fetch below
    let currentNetWorth = { total_assets: 0, total_liabilities: 0, net_worth: 0 }

    // Fetch all user accounts (Plaid, manual, and crypto)
    const [plaidAccounts, manualAssets, cryptoWallets] = await Promise.all([
      // Plaid accounts
      supabase
        .from('plaid_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true),

      // Manual assets
      supabase
        .from('manual_assets')
        .select('*')
        .eq('user_id', user.id),

      // Crypto wallets
      supabase
        .from('crypto_holdings')
        .select(`
          id,
          symbol,
          balance,
          usd_value,
          crypto_wallets (
            id,
            wallet_name,
            wallet_address,
            chain
          )
        `)
        .eq('user_id', user.id),
    ])

    // Process accounts into projections
    const assetProjections: AccountProjection[] = []
    const liabilityProjections: AccountProjection[] = []
    let totalAssets = 0
    let totalLiabilities = 0

    // Process Plaid accounts
    if (plaidAccounts.data) {
      for (const account of plaidAccounts.data) {
        const balance = account.current_balance || 0
        const isLiability = account.account_type === 'credit' || account.account_type === 'loan' || balance < 0
        const category = account.account_subtype || account.account_type || 'other'
        const growthRate = getGrowthRate(category)

        console.log('DEBUG - Plaid Account:', {
          name: account.account_name,
          account_type: account.account_type,
          account_subtype: account.account_subtype,
          balance,
          isLiability
        })

        // For Plaid liabilities, use defaults from config (no user-provided loan data)
        const loanInterestRate = isLiability ? getGrowthRateForCategory(category) : growthRate
        const loanTermYears = isLiability ? getLoanTermForCategory(category) : null

        const projection: AccountProjection = {
          id: account.id,
          name: account.account_name,
          category: category,
          accountType: account.account_type, // Add Plaid account type
          currentBalance: Math.abs(balance),
          growthRate: growthRate,
          projectedValues: isLiability && loanTermYears !== null
            ? {
                // For liabilities with payments: balance DECREASES over time
                oneYear: calculateLiabilityProjection(Math.abs(balance), loanInterestRate, loanTermYears, 1),
                fiveYears: calculateLiabilityProjection(Math.abs(balance), loanInterestRate, loanTermYears, 5),
                tenYears: calculateLiabilityProjection(Math.abs(balance), loanInterestRate, loanTermYears, 10),
                twentyYears: calculateLiabilityProjection(Math.abs(balance), loanInterestRate, loanTermYears, 20),
                thirtyYears: calculateLiabilityProjection(Math.abs(balance), loanInterestRate, loanTermYears, 30),
              }
            : {
                // For assets: balance INCREASES with growth rate
                oneYear: calculateFutureValue(Math.abs(balance), Math.abs(growthRate), 1),
                fiveYears: calculateFutureValue(Math.abs(balance), Math.abs(growthRate), 5),
                tenYears: calculateFutureValue(Math.abs(balance), Math.abs(growthRate), 10),
                twentyYears: calculateFutureValue(Math.abs(balance), Math.abs(growthRate), 20),
                thirtyYears: calculateFutureValue(Math.abs(balance), Math.abs(growthRate), 30),
              }
        }

        if (isLiability) {
          totalLiabilities += Math.abs(balance)
          liabilityProjections.push(projection)
        } else {
          totalAssets += balance
          assetProjections.push(projection)
        }
      }
    }

    // Process manual assets
    if (manualAssets.data) {
      for (const asset of manualAssets.data) {
        const balance = asset.current_value || 0
        const category = asset.category || asset.asset_type || 'manual_asset'

        // Check if it's a liability by asset_type, negative balance, or liability category
        const liabilityCategories = ['mortgage', 'personal_loan', 'business_debt', 'credit_debt', 'auto_loan', 'student_loan', 'other_debt', 'loan']
        const isLiability = asset.asset_type === 'liability' || balance < 0 || liabilityCategories.includes(category.toLowerCase())

        const growthRate = getGrowthRate(category)

        console.log('DEBUG - Manual Asset:', {
          name: asset.asset_name,
          asset_type: asset.asset_type,
          category: asset.category,
          balance,
          isLiability
        })

        // For liabilities, use actual loan data if available, otherwise defaults
        const loanInterestRate = isLiability
          ? (asset.interest_rate ?? getGrowthRateForCategory(category))
          : growthRate

        const loanTermYears = isLiability
          ? (asset.loan_term_years ?? getLoanTermForCategory(category))
          : null

        const projection: AccountProjection = {
          id: asset.id,
          name: asset.asset_name,
          category: category,
          accountType: asset.asset_type, // Add manual asset type
          currentBalance: Math.abs(balance),
          growthRate: growthRate,
          projectedValues: isLiability && loanTermYears !== null
            ? {
                // For liabilities with payments: balance DECREASES over time
                oneYear: calculateLiabilityProjection(Math.abs(balance), loanInterestRate, loanTermYears, 1),
                fiveYears: calculateLiabilityProjection(Math.abs(balance), loanInterestRate, loanTermYears, 5),
                tenYears: calculateLiabilityProjection(Math.abs(balance), loanInterestRate, loanTermYears, 10),
                twentyYears: calculateLiabilityProjection(Math.abs(balance), loanInterestRate, loanTermYears, 20),
                thirtyYears: calculateLiabilityProjection(Math.abs(balance), loanInterestRate, loanTermYears, 30),
              }
            : {
                // For assets: balance INCREASES with growth rate
                oneYear: calculateFutureValue(Math.abs(balance), Math.abs(growthRate), 1),
                fiveYears: calculateFutureValue(Math.abs(balance), Math.abs(growthRate), 5),
                tenYears: calculateFutureValue(Math.abs(balance), Math.abs(growthRate), 10),
                twentyYears: calculateFutureValue(Math.abs(balance), Math.abs(growthRate), 20),
                thirtyYears: calculateFutureValue(Math.abs(balance), Math.abs(growthRate), 30),
              }
        }

        if (isLiability) {
          totalLiabilities += Math.abs(balance)
          liabilityProjections.push(projection)
        } else {
          totalAssets += balance
          assetProjections.push(projection)
        }
      }
    }

    // Process crypto holdings
    if (cryptoWallets.data) {
      // Group by wallet
      const walletTotals = new Map<string, { name: string; total: number; chain: string }>()

      for (const holding of cryptoWallets.data) {
        // TypeScript has trouble with Supabase's foreign key type inference
        const wallet: any = holding.crypto_wallets
        if (wallet && wallet.id) {
          const walletId: string = wallet.id
          const current = walletTotals.get(walletId) || {
            name: wallet.wallet_name || 'Crypto Wallet',
            total: 0,
            chain: wallet.chain || 'ethereum'
          }
          current.total += holding.usd_value || 0
          walletTotals.set(walletId, current)
        }
      }

      // Create projections for each wallet
      for (const [walletId, wallet] of walletTotals.entries()) {
        const category = wallet.chain.toLowerCase()
        const growthRate = getGrowthRate(category)

        const projection: AccountProjection = {
          id: walletId,
          name: wallet.name,
          category: `crypto_${category}`,
          accountType: 'crypto', // Add crypto type
          currentBalance: wallet.total,
          growthRate: growthRate,
          projectedValues: {
            oneYear: calculateFutureValue(wallet.total, growthRate, 1),
            fiveYears: calculateFutureValue(wallet.total, growthRate, 5),
            tenYears: calculateFutureValue(wallet.total, growthRate, 10),
            twentyYears: calculateFutureValue(wallet.total, growthRate, 20),
            thirtyYears: calculateFutureValue(wallet.total, growthRate, 30),
          }
        }

        totalAssets += wallet.total
        assetProjections.push(projection)
      }
    }

    // Calculate the actual net worth from the accounts we've processed
    const actualTotalAssets = totalAssets
    const actualTotalLiabilities = totalLiabilities
    const actualNetWorth = actualTotalAssets - actualTotalLiabilities

    // Calculate aggregate projections
    const totalProjections = {
      oneYear: 0,
      fiveYears: 0,
      tenYears: 0,
      twentyYears: 0,
      thirtyYears: 0,
    }

    // Sum asset projections
    for (const asset of assetProjections) {
      totalProjections.oneYear += asset.projectedValues.oneYear
      totalProjections.fiveYears += asset.projectedValues.fiveYears
      totalProjections.tenYears += asset.projectedValues.tenYears
      totalProjections.twentyYears += asset.projectedValues.twentyYears
      totalProjections.thirtyYears += asset.projectedValues.thirtyYears
    }

    // Subtract liability projections
    // Liabilities grow based on their interest rates (negative growth rates)
    for (const liability of liabilityProjections) {
      totalProjections.oneYear -= liability.projectedValues.oneYear
      totalProjections.fiveYears -= liability.projectedValues.fiveYears
      totalProjections.tenYears -= liability.projectedValues.tenYears
      totalProjections.twentyYears -= liability.projectedValues.twentyYears
      totalProjections.thirtyYears -= liability.projectedValues.thirtyYears
    }

    console.log('DEBUG - Projection Calculation:', {
      actualTotalAssets,
      actualTotalLiabilities,
      actualNetWorth,
      assetsOneYear: assetProjections.reduce((sum, a) => sum + a.projectedValues.oneYear, 0),
      liabilitiesOneYear: liabilityProjections.reduce((sum, l) => sum + l.currentBalance, 0),
      netWorthOneYear: totalProjections.oneYear,
    })

    // Calculate milestones
    const milestones: any = {}

    // Years to reach $1M
    if (actualNetWorth < 1000000 && actualNetWorth > 0) {
      // Account for constant liabilities: Future NW = Future Assets - Current Liabilities
      // Future Assets = Current Assets * (1 + r)^t
      // Target: Future Assets - Current Liabilities = 1,000,000
      // So: Future Assets = 1,000,000 + Current Liabilities
      const avgGrowthRate = assetProjections.length > 0
        ? assetProjections.reduce((sum, a) => sum + a.growthRate, 0) / assetProjections.length
        : 0.07

      const targetAssets = 1000000 + actualTotalLiabilities
      if (actualTotalAssets > 0 && targetAssets > actualTotalAssets) {
        const yearsToMillion = Math.log(targetAssets / actualTotalAssets) / Math.log(1 + avgGrowthRate)
        milestones.reachMillionaire = Math.max(0, yearsToMillion)
      }
    }

    // Years to double
    if (actualNetWorth > 0) {
      // Target: Assets * (1 + r)^t - Liabilities = 2 * Current Net Worth
      // So: Assets * (1 + r)^t = 2 * Current Net Worth + Liabilities
      const avgGrowthRate = assetProjections.length > 0
        ? assetProjections.reduce((sum, a) => sum + a.growthRate, 0) / assetProjections.length
        : 0.07

      const targetAssets = 2 * actualNetWorth + actualTotalLiabilities
      if (actualTotalAssets > 0 && targetAssets > actualTotalAssets) {
        const yearsToDouble = Math.log(targetAssets / actualTotalAssets) / Math.log(1 + avgGrowthRate)
        milestones.double = Math.max(0, yearsToDouble)
      }
    }

    // Generate insights
    const avgGrowthRate = assetProjections.length > 0
      ? assetProjections.reduce((sum, a) => sum + a.growthRate, 0) / assetProjections.length
      : 0

    const bestPerformer = assetProjections.reduce((best, current) =>
      current.growthRate > best.growthRate ? current : best,
      assetProjections[0] || { name: 'N/A', growthRate: 0 }
    )

    const worstPerformer = assetProjections.reduce((worst, current) =>
      current.growthRate < worst.growthRate ? current : worst,
      assetProjections[0] || { name: 'N/A', growthRate: 0 }
    )

    const recommendations: string[] = []

    // Add recommendations based on portfolio
    if (avgGrowthRate < 0.05) {
      recommendations.push('Consider moving funds from low-yield accounts to higher-growth investments')
    }

    const cryptoPercentage = actualTotalAssets > 0
      ? assetProjections.filter(a => a.category.includes('crypto')).reduce((sum, a) => sum + a.currentBalance, 0) / actualTotalAssets
      : 0

    if (cryptoPercentage > 0.3) {
      recommendations.push('Your crypto allocation exceeds 30% - consider diversifying for risk management')
    } else if (cryptoPercentage === 0 && actualTotalAssets > 10000) {
      recommendations.push('Consider a small allocation (5-10%) to crypto for portfolio diversification')
    }

    const cashPercentage = actualTotalAssets > 0
      ? assetProjections.filter(a => a.category === 'checking' || a.category === 'savings').reduce((sum, a) => sum + a.currentBalance, 0) / actualTotalAssets
      : 0

    if (cashPercentage > 0.3) {
      recommendations.push('High cash allocation detected - consider investing excess cash for better returns')
    }

    // Create growth rate config for display
    const growthRateConfigs: GrowthRateConfig[] = Object.entries(DEFAULT_GROWTH_RATES).map(([category, rate]) => ({
      category,
      annualRate: rate,
      label: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `${(rate * 100).toFixed(1)}% annual return`
    }))

    // Build response
    const response: TrajectoryProjectionResponse = {
      currentStatus: {
        totalAssets: actualTotalAssets,
        totalLiabilities: actualTotalLiabilities,
        netWorth: actualNetWorth,
        accountCount: assetProjections.length + liabilityProjections.length,
      },
      projections: {
        currentNetWorth: actualNetWorth,
        projections: totalProjections,
        breakdown: {
          assets: assetProjections,
          liabilities: liabilityProjections,
        },
        milestones,
      },
      growthRates: growthRateConfigs,
      insights: {
        averageGrowthRate: avgGrowthRate,
        bestPerformer: bestPerformer?.name || 'N/A',
        worstPerformer: worstPerformer?.name || 'N/A',
        recommendations,
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Trajectory projection error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate projections' },
      { status: 500 }
    )
  }
}