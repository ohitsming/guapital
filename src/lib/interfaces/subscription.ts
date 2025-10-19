/**
 * Subscription and feature access interfaces
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
