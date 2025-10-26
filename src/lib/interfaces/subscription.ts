/**
 * Subscription and feature access interfaces
 *
 * PRICING STRUCTURE (2025):
 * - Free: 2 crypto wallets, 30-day history, percentile preview
 * - Premium: $79/year (founding members), $99/year (regular) - UNLIMITED everything
 * - Pro: DEPRECATED (kept for backwards compatibility, maps to Premium features)
 */

export type SubscriptionTier = 'free' | 'premium' | 'pro'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

export interface SubscriptionInfo {
    tier: SubscriptionTier
    status: SubscriptionStatus
    startDate?: Date
    endDate?: Date
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    isFoundingMember?: boolean      // First 1,000 users lock in $79/year forever
    foundingMemberPrice?: number    // Locked-in price for founding members
    cancelAtPeriodEnd?: boolean     // True if subscription is scheduled to cancel at end of period
}

export interface FeatureAccess {
    // Core features
    netWorthDashboard: boolean
    manualEntry: boolean

    // Account syncing
    plaidSync: boolean

    // Crypto features
    cryptoWallets: boolean
    cryptoWalletLimit: number

    // History & trends
    history30Days: boolean
    history365Days: boolean

    // Asset tracking
    manualAssets: boolean

    // Transaction features
    aiCategorization: boolean
    transactionHistory: boolean
    budgeting: boolean

    // Advanced features
    percentileRanking: boolean
    advancedReports: boolean
    advancedDefi: boolean
    csvExport: boolean
    apiAccess: boolean

    // Support features
    emailSupport: boolean
    prioritySupport: boolean
}

export interface TrendDataPoint {
    date: string
    value: number
}

export interface SubscriptionLimits {
    cryptoWallets: number
    historyDays: number
    connectedAccounts: number | 'unlimited'
}
