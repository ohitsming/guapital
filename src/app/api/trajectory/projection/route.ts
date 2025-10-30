/**
 * API endpoint for Net Worth Trajectory Projections
 * Calculates future net worth based on account categories and growth rates
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'
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
 *
 * This function calculates what the remaining balance will be at a specific point
 * in time based on a FIXED amortization schedule.
 *
 * @param currentBalance - The current principal balance of the loan
 * @param interestRate - Annual interest rate (e.g., 0.06 for 6%)
 * @param termYears - The TOTAL loan term in years (defines the amortization schedule)
 * @param projectionYears - How many years into the future to project
 * @returns The remaining balance at the projection point
 *
 * Example: $370K mortgage, 6% interest, 10-year term
 * - At year 5: ~$172K remaining (calculated via amortization)
 * - At year 10: $0 (loan fully paid off)
 * - At year 20: $0 (loan was already paid off at year 10)
 */
function calculateLiabilityProjection(
  currentBalance: number,
  interestRate: number,
  termYears: number,
  projectionYears: number
): number {
  // Validate inputs
  if (currentBalance <= 0) {
    return 0
  }

  if (!interestRate || interestRate === 0) {
    // No interest = no payment schedule, balance stays constant
    return currentBalance
  }

  if (termYears === null || termYears === undefined || termYears === 0) {
    // Revolving credit (credit cards) or no term specified
    // Balance stays constant (we're not modeling minimum payments)
    return currentBalance
  }

  // Key logic: If projection point is >= loan term, loan is fully paid off
  if (projectionYears >= termYears) {
    return 0
  }

  // Calculate the FIXED monthly payment based on the loan term
  // This is the amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const monthlyRate = Math.abs(interestRate) / 12
  const totalMonths = termYears * 12
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, totalMonths)
  const denominator = Math.pow(1 + monthlyRate, totalMonths) - 1
  const fixedMonthlyPayment = currentBalance * (numerator / denominator)

  // Simulate N years of payments to find remaining balance
  let remainingBalance = currentBalance
  const monthsToSimulate = projectionYears * 12

  for (let month = 0; month < monthsToSimulate; month++) {
    // Interest accrued this month
    const interestPayment = remainingBalance * monthlyRate

    // Principal paid down this month
    const principalPayment = fixedMonthlyPayment - interestPayment

    // Update remaining balance
    remainingBalance -= principalPayment

    // Prevent negative balances (loan is paid off)
    if (remainingBalance <= 0) {
      return 0
    }
  }

  return remainingBalance
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

    // Fetch all user accounts (Plaid, manual, and crypto) AND their projection configs
    const [plaidAccounts, manualAssets, cryptoWallets, projectionConfigs] = await Promise.all([
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

      // Projection configs (custom growth rates and loan terms)
      supabase
        .from('account_projection_config')
        .select('*')
        .eq('user_id', user.id)
        .eq('scenario_name', 'default'),
    ])

    // Create a map for quick lookup of projection configs by account_id + source
    const configMap = new Map<string, any>()
    if (projectionConfigs.data) {
      for (const config of projectionConfigs.data) {
        const key = `${config.account_source}:${config.account_id}`
        configMap.set(key, config)
      }
    }

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
        const defaultGrowthRate = getGrowthRate(category)

        // Get custom config if it exists
        const configKey = `plaid_accounts:${account.id}`
        const config = configMap.get(configKey)

        // Use custom values from config, or fall back to defaults
        const growthRate = config?.custom_growth_rate ?? defaultGrowthRate
        const loanInterestRate = isLiability
          ? (config?.custom_growth_rate ?? getGrowthRateForCategory(category))
          : growthRate
        const loanTermYears = isLiability
          ? (config?.custom_loan_term_years ?? getLoanTermForCategory(category))
          : null

        const projection: AccountProjection = {
          id: account.id,
          name: account.account_name,
          category: category,
          accountType: account.account_type, // Add Plaid account type
          currentBalance: Math.abs(balance),
          growthRate: growthRate,
          loanTermYears: isLiability ? loanTermYears ?? undefined : undefined,
          monthlyContribution: config?.monthly_contribution ?? undefined,
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

        const defaultGrowthRate = getGrowthRate(category)

        // Get custom config if it exists
        const configKey = `manual_assets:${asset.id}`
        const config = configMap.get(configKey)

        // Use custom values from config, or fall back to defaults
        const growthRate = config?.custom_growth_rate ?? defaultGrowthRate
        const loanInterestRate = isLiability
          ? (config?.custom_growth_rate ?? getGrowthRateForCategory(category))
          : growthRate

        const loanTermYears = isLiability
          ? (config?.custom_loan_term_years ?? getLoanTermForCategory(category))
          : null

        // Determine which projection formula to use
        const useAmortization = isLiability && loanTermYears !== null && loanTermYears !== undefined && loanTermYears > 0

        const projection: AccountProjection = {
          id: asset.id,
          name: asset.asset_name,
          category: category,
          accountType: asset.asset_type, // Add manual asset type
          currentBalance: Math.abs(balance),
          growthRate: growthRate,
          loanTermYears: isLiability ? loanTermYears ?? undefined : undefined,
          monthlyContribution: config?.monthly_contribution ?? undefined,
          projectedValues: useAmortization
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
        const defaultGrowthRate = getGrowthRate(category)

        // Get custom config if it exists
        const configKey = `crypto_wallets:${walletId}`
        const config = configMap.get(configKey)

        // Use custom growth rate if set, otherwise use default
        const growthRate = config?.custom_growth_rate ?? defaultGrowthRate

        const projection: AccountProjection = {
          id: walletId,
          name: wallet.name,
          category: `crypto_${category}`,
          accountType: 'crypto', // Add crypto type
          currentBalance: wallet.total,
          growthRate: growthRate,
          monthlyContribution: config?.monthly_contribution ?? undefined,
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

    // Calculate milestones
    const milestones: any = {}

    // Years to reach $1M
    if (actualNetWorth < 1000000 && actualNetWorth > 0) {
      // Use actual projected net worth values (which account for liability paydown)
      const targetNetWorth = 1000000

      // Find which projection year bracket we're in
      if (totalProjections.oneYear >= targetNetWorth) {
        // Reached in < 1 year - interpolate
        const ratio = Math.log(targetNetWorth / actualNetWorth) / Math.log(totalProjections.oneYear / actualNetWorth)
        milestones.reachMillionaire = Math.max(0, ratio)
      } else if (totalProjections.fiveYears >= targetNetWorth) {
        // Between 1-5 years
        const ratio = (targetNetWorth - totalProjections.oneYear) / (totalProjections.fiveYears - totalProjections.oneYear)
        milestones.reachMillionaire = 1 + (4 * ratio)
      } else if (totalProjections.tenYears >= targetNetWorth) {
        // Between 5-10 years
        const ratio = (targetNetWorth - totalProjections.fiveYears) / (totalProjections.tenYears - totalProjections.fiveYears)
        milestones.reachMillionaire = 5 + (5 * ratio)
      } else if (totalProjections.twentyYears >= targetNetWorth) {
        // Between 10-20 years
        const ratio = (targetNetWorth - totalProjections.tenYears) / (totalProjections.twentyYears - totalProjections.tenYears)
        milestones.reachMillionaire = 10 + (10 * ratio)
      } else if (totalProjections.thirtyYears >= targetNetWorth) {
        // Between 20-30 years
        const ratio = (targetNetWorth - totalProjections.twentyYears) / (totalProjections.thirtyYears - totalProjections.twentyYears)
        milestones.reachMillionaire = 20 + (10 * ratio)
      } else {
        // Target not reached within 30 years
        const avgGrowthRate = assetProjections.length > 0
          ? assetProjections.reduce((sum, a) => sum + a.growthRate, 0) / assetProjections.length
          : 0.07
        const impliedRate = Math.pow(totalProjections.thirtyYears / actualNetWorth, 1/30) - 1
        if (impliedRate > 0) {
          milestones.reachMillionaire = Math.log(targetNetWorth / actualNetWorth) / Math.log(1 + impliedRate)
        }
      }
    }

    // Years to double
    if (actualNetWorth > 0) {
      // Use actual projected net worth values (which account for liability paydown)
      // Target: 2x current net worth
      const targetNetWorth = 2 * actualNetWorth

      // Find which projection year bracket we're in
      if (totalProjections.oneYear >= targetNetWorth) {
        // Reached in < 1 year - interpolate between 0 and 1 year
        const ratio = Math.log(targetNetWorth / actualNetWorth) / Math.log(totalProjections.oneYear / actualNetWorth)
        milestones.double = Math.max(0, ratio)
      } else if (totalProjections.fiveYears >= targetNetWorth) {
        // Between 1-5 years - linear interpolation
        const ratio = (targetNetWorth - totalProjections.oneYear) / (totalProjections.fiveYears - totalProjections.oneYear)
        milestones.double = 1 + (4 * ratio)
      } else if (totalProjections.tenYears >= targetNetWorth) {
        // Between 5-10 years
        const ratio = (targetNetWorth - totalProjections.fiveYears) / (totalProjections.tenYears - totalProjections.fiveYears)
        milestones.double = 5 + (5 * ratio)
      } else if (totalProjections.twentyYears >= targetNetWorth) {
        // Between 10-20 years
        const ratio = (targetNetWorth - totalProjections.tenYears) / (totalProjections.twentyYears - totalProjections.tenYears)
        milestones.double = 10 + (10 * ratio)
      } else if (totalProjections.thirtyYears >= targetNetWorth) {
        // Between 20-30 years
        const ratio = (targetNetWorth - totalProjections.twentyYears) / (totalProjections.thirtyYears - totalProjections.twentyYears)
        milestones.double = 20 + (10 * ratio)
      } else {
        // Target not reached within 30 years
        // Use compound growth formula to estimate beyond 30 years
        const avgGrowthRate = assetProjections.length > 0
          ? assetProjections.reduce((sum, a) => sum + a.growthRate, 0) / assetProjections.length
          : 0.07
        const impliedRate = Math.pow(totalProjections.thirtyYears / actualNetWorth, 1/30) - 1
        if (impliedRate > 0) {
          milestones.double = Math.log(targetNetWorth / actualNetWorth) / Math.log(1 + impliedRate)
        }
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