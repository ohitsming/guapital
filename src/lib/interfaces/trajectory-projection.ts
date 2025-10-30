/**
 * TypeScript interfaces for the Trajectory Net Worth Projection feature
 * Calculates future net worth based on account categories and growth rates
 */

import { GROWTH_RATE_CONFIG, getGrowthRateForCategory } from '@/lib/config/growth-rates'

/**
 * Growth rate configuration by account category/type
 */
export interface GrowthRateConfig {
  category: string
  annualRate: number // Decimal (0.07 = 7%)
  label: string
  description: string
}

/**
 * Account with growth projection
 */
export interface AccountProjection {
  id: string
  name: string
  category: string
  accountType?: string // High-level type (e.g., "depository", "investment", "credit", "asset", "liability")
  currentBalance: number
  growthRate: number
  loanTermYears?: number // Loan term in years (for liabilities only)
  monthlyContribution?: number // Monthly contribution (assets) or payment override (liabilities)
  projectedValues: {
    oneYear: number
    fiveYears: number
    tenYears: number
    twentyYears: number
    thirtyYears: number
  }
}

/**
 * Net worth projection summary
 */
export interface NetWorthProjection {
  currentNetWorth: number
  projections: {
    oneYear: number
    fiveYears: number
    tenYears: number
    twentyYears: number
    thirtyYears: number
  }
  breakdown: {
    assets: AccountProjection[]
    liabilities: AccountProjection[]
  }
  milestones: {
    reachMillionaire?: number // Years to reach $1M
    double?: number // Years to double current net worth
    reachTarget?: number // Years to reach custom target
  }
}

/**
 * Main response from the Trajectory API endpoint
 */
export interface TrajectoryProjectionResponse {
  currentStatus: {
    totalAssets: number
    totalLiabilities: number
    netWorth: number
    accountCount: number
  }
  projections: NetWorthProjection
  growthRates: GrowthRateConfig[]
  insights: {
    averageGrowthRate: number
    bestPerformer: string
    worstPerformer: string
    recommendations: string[]
  }
  error?: string
}

/**
 * Growth rate definitions by category
 * @deprecated Use GROWTH_RATE_CONFIG from @/lib/config/growth-rates instead
 */
export const DEFAULT_GROWTH_RATES = GROWTH_RATE_CONFIG

/**
 * Get growth rate for a category
 */
export const getGrowthRate = getGrowthRateForCategory

/**
 * Calculate future value with compound interest
 */
export const calculateFutureValue = (
  presentValue: number,
  annualRate: number,
  years: number
): number => {
  return presentValue * Math.pow(1 + annualRate, years)
}

/**
 * Format projection value
 */
export const formatProjectionValue = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  } else {
    return `$${value.toFixed(0)}`
  }
}

/**
 * Get milestone label
 */
export const getMilestoneLabel = (years: number): string => {
  if (years < 1) {
    const months = Math.round(years * 12)
    return `${months} ${months === 1 ? 'month' : 'months'}`
  } else if (years === 1) {
    return '1 year'
  } else {
    return `${Math.round(years)} years`
  }
}