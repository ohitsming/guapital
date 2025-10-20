/**
 * Subscription tier permissions and feature access configuration
 *
 * Based on pricing model from CLAUDE.md:
 * - Free: Manual entry, 2 crypto wallets, 30-day history, no Plaid sync
 * - Premium: Plaid sync, 5 crypto wallets, 365-day history, AI categorization, percentile ranking
 * - Pro: All Premium + unlimited crypto, manual assets, advanced DeFi, CSV export, API access
 */

import type { SubscriptionTier, FeatureAccess, SubscriptionLimits } from './interfaces/subscription'

export enum Feature {
    // Core features
    NET_WORTH_DASHBOARD = 'netWorthDashboard',
    MANUAL_ENTRY = 'manualEntry',

    // Account syncing
    PLAID_SYNC = 'plaidSync',

    // Crypto features
    CRYPTO_WALLETS = 'cryptoWallets',

    // History & trends
    HISTORY_30_DAYS = 'history30Days',
    HISTORY_365_DAYS = 'history365Days',

    // Asset tracking
    MANUAL_ASSETS = 'manualAssets',

    // Transaction features
    AI_CATEGORIZATION = 'aiCategorization',
    TRANSACTION_HISTORY = 'transactionHistory',
    BUDGETING = 'budgeting',

    // Advanced features
    PERCENTILE_RANKING = 'percentileRanking',
    ADVANCED_REPORTS = 'advancedReports',
    ADVANCED_DEFI = 'advancedDefi',
    CSV_EXPORT = 'csvExport',
    API_ACCESS = 'apiAccess',

    // Support features
    EMAIL_SUPPORT = 'emailSupport',
    PRIORITY_SUPPORT = 'prioritySupport',
}

/**
 * Feature access configuration for each subscription tier
 */
export const TIER_FEATURES: Record<SubscriptionTier, FeatureAccess> = {
    free: {
        netWorthDashboard: true,
        manualEntry: true,
        plaidSync: false,
        cryptoWallets: true,
        cryptoWalletLimit: 2,
        history30Days: true,
        history365Days: false,
        manualAssets: true,
        aiCategorization: false,
        transactionHistory: false,
        budgeting: false,
        percentileRanking: false,
        advancedReports: false,
        advancedDefi: false,
        csvExport: false,
        apiAccess: false,
        emailSupport: false,
        prioritySupport: false,
    },
    premium: {
        netWorthDashboard: true,
        manualEntry: true,
        plaidSync: true,
        cryptoWallets: true,
        cryptoWalletLimit: 5,
        history30Days: true,
        history365Days: true,
        manualAssets: false,
        aiCategorization: true,
        transactionHistory: true,
        budgeting: true,
        percentileRanking: true,
        advancedReports: true,
        advancedDefi: false,
        csvExport: false,
        apiAccess: false,
        emailSupport: true,
        prioritySupport: false,
    },
    pro: {
        netWorthDashboard: true,
        manualEntry: true,
        plaidSync: true,
        cryptoWallets: true,
        cryptoWalletLimit: Infinity,
        history30Days: true,
        history365Days: true,
        manualAssets: true,
        aiCategorization: true,
        transactionHistory: true,
        budgeting: true,
        percentileRanking: true,
        advancedReports: true,
        advancedDefi: true,
        csvExport: true,
        apiAccess: true,
        emailSupport: true,
        prioritySupport: true,
    },
}

/**
 * Numeric limits for each tier
 */
export const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
    free: {
        cryptoWallets: 2,
        historyDays: 30,
        connectedAccounts: 0, // No Plaid sync
    },
    premium: {
        cryptoWallets: 5,
        historyDays: 365,
        connectedAccounts: 'unlimited',
    },
    pro: {
        cryptoWallets: Infinity,
        historyDays: 365,
        connectedAccounts: 'unlimited',
    },
}

/**
 * Check if a user has access to a specific feature
 */
export function hasFeatureAccess(tier: SubscriptionTier, feature: keyof FeatureAccess): boolean {
    const tierFeatures = TIER_FEATURES[tier]
    const featureValue = tierFeatures[feature]

    // Handle boolean features
    if (typeof featureValue === 'boolean') {
        return featureValue
    }

    // Handle numeric features (like cryptoWalletLimit)
    if (typeof featureValue === 'number') {
        return featureValue > 0
    }

    return false
}

/**
 * Get the limit for a specific feature
 */
export function getFeatureLimit(tier: SubscriptionTier, limitKey: keyof SubscriptionLimits): number | 'unlimited' {
    return TIER_LIMITS[tier][limitKey]
}

/**
 * Get all features for a tier
 */
export function getTierFeatures(tier: SubscriptionTier): FeatureAccess {
    return TIER_FEATURES[tier]
}

/**
 * Check if user can add more items (e.g., crypto wallets, accounts)
 */
export function canAddMore(
    tier: SubscriptionTier,
    limitKey: keyof SubscriptionLimits,
    currentCount: number
): boolean {
    const limit = TIER_LIMITS[tier][limitKey]

    if (limit === 'unlimited') {
        return true
    }

    return currentCount < limit
}

/**
 * Get upgrade message for a feature
 */
export function getUpgradeMessage(feature: keyof FeatureAccess): { tier: SubscriptionTier; message: string } {
    // Check which tier first provides this feature
    if (TIER_FEATURES.premium[feature]) {
        return {
            tier: 'premium',
            message: 'Upgrade to Premium to unlock this feature',
        }
    }

    if (TIER_FEATURES.pro[feature]) {
        return {
            tier: 'pro',
            message: 'Upgrade to Pro to unlock this feature',
        }
    }

    return {
        tier: 'free',
        message: 'This feature is not available',
    }
}
