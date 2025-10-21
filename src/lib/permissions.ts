/**
 * Subscription tier permissions and feature access configuration
 *
 * AGGRESSIVE GROWTH PRICING STRATEGY (2025):
 * - Free: Manual entry unlimited, 2 crypto wallets, 30-day history, percentile preview
 * - Premium ($79/year founding, $99/year regular): Unlimited everything - Plaid sync unlimited accounts,
 *   unlimited crypto wallets, 365-day history, full percentile ranking, AI categorization, manual assets, reports
 *
 * Pro tier ELIMINATED - simplified to 2-tier structure for clarity
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
 *
 * NEW PRICING (2025):
 * - Free: Great for trying out, manual tracking, crypto preview
 * - Premium: Everything unlimited - best value in market at $79/year
 * - Pro: DEPRECATED - merged into Premium
 */
export const TIER_FEATURES: Record<SubscriptionTier, FeatureAccess> = {
    free: {
        netWorthDashboard: true,
        manualEntry: true,           // Unlimited manual entry for traditional accounts
        plaidSync: false,             // No auto-sync
        cryptoWallets: true,
        cryptoWalletLimit: 2,         // 2 crypto wallets (unique selling point!)
        history30Days: true,
        history365Days: false,
        manualAssets: true,           // Can add unlimited manual assets
        aiCategorization: false,
        transactionHistory: false,    // Need Premium for transaction history
        budgeting: false,
        percentileRanking: true,      // Preview only - see your rank but not full leaderboard
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
        plaidSync: true,              // Unlimited connected accounts via Plaid
        cryptoWallets: true,
        cryptoWalletLimit: Infinity,  // UNLIMITED crypto wallets (nobody else offers this!)
        history30Days: true,
        history365Days: true,         // Full 365-day history
        manualAssets: true,           // Unlimited manual assets (real estate, vehicles, etc.)
        aiCategorization: true,       // AI-powered transaction categorization
        transactionHistory: true,     // Full transaction history and analysis
        budgeting: true,              // Basic budgeting features
        percentileRanking: true,      // Full percentile ranking + leaderboard access
        advancedReports: true,        // Advanced analytics and reports
        advancedDefi: false,          // Reserved for future Pro tier if needed
        csvExport: true,              // Export data for tax time
        apiAccess: false,             // Reserved for future Pro tier if needed
        emailSupport: true,           // Email support (48hr response)
        prioritySupport: false,       // Reserved for future Pro tier if needed
    },
    pro: {
        // DEPRECATED: Pro tier merged into Premium
        // Keeping for backwards compatibility, maps to Premium
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
 *
 * PRICING TIERS (2025):
 * - Free: 2 crypto wallets, 30-day history
 * - Premium ($79/year): UNLIMITED everything
 */
export const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
    free: {
        cryptoWallets: 2,              // 2 crypto wallets (best free tier in market!)
        historyDays: 30,               // 30-day history
        connectedAccounts: 0,          // No Plaid sync (manual entry only)
    },
    premium: {
        cryptoWallets: Infinity,       // UNLIMITED crypto wallets
        historyDays: 365,              // Full year of history
        connectedAccounts: 'unlimited', // Unlimited Plaid-connected accounts
    },
    pro: {
        // DEPRECATED: Maps to Premium
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
