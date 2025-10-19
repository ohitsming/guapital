'use client'

/**
 * Subscription Context Provider
 *
 * Manages user subscription state and provides feature access utilities
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { SubscriptionTier, SubscriptionStatus, SubscriptionInfo, FeatureAccess, SubscriptionLimits } from '../interfaces/subscription'
import { hasFeatureAccess, getTierFeatures, getFeatureLimit, canAddMore } from '../permissions'

interface SubscriptionContextValue {
    subscription: SubscriptionInfo | null
    tier: SubscriptionTier
    status: SubscriptionStatus
    features: FeatureAccess
    isLoading: boolean
    error: string | null
    hasAccess: (feature: keyof FeatureAccess) => boolean
    getLimit: (limitKey: keyof SubscriptionLimits) => number | 'unlimited'
    canAdd: (limitKey: keyof SubscriptionLimits, currentCount: number) => boolean
    refetch: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchSubscription = async () => {
        try {
            setIsLoading(true)
            setError(null)

            // DEVELOPMENT MODE: Default to 'pro' tier to enable all features
            const isDevelopment = process.env.NODE_ENV === 'development'

            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                // Not authenticated - default to pro tier in development, free in production
                setSubscription({
                    tier: isDevelopment ? 'pro' : 'free',
                    status: 'active',
                })
                return
            }

            // In development, always use pro tier
            if (isDevelopment) {
                setSubscription({
                    tier: 'pro',
                    status: 'active',
                })
                return
            }

            // PRODUCTION: Fetch subscription from user_settings
            const { data, error: fetchError } = await supabase
                .from('user_settings')
                .select('subscription_tier, subscription_status, subscription_start_date, subscription_end_date, stripe_customer_id, stripe_subscription_id')
                .eq('user_id', user.id)
                .single()

            if (fetchError) {
                console.error('Error fetching subscription:', fetchError)
                // Default to free tier on error
                setSubscription({
                    tier: 'free',
                    status: 'active',
                })
                return
            }

            if (data) {
                setSubscription({
                    tier: (data.subscription_tier as SubscriptionTier) || 'free',
                    status: (data.subscription_status as SubscriptionStatus) || 'active',
                    startDate: data.subscription_start_date ? new Date(data.subscription_start_date) : undefined,
                    endDate: data.subscription_end_date ? new Date(data.subscription_end_date) : undefined,
                    stripeCustomerId: data.stripe_customer_id || undefined,
                    stripeSubscriptionId: data.stripe_subscription_id || undefined,
                })
            } else {
                // No settings found - default to free
                setSubscription({
                    tier: 'free',
                    status: 'active',
                })
            }
        } catch (err) {
            console.error('Subscription fetch error:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch subscription')
            // Default to free tier on error (pro in development)
            setSubscription({
                tier: process.env.NODE_ENV === 'development' ? 'pro' : 'free',
                status: 'active',
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSubscription()
    }, [])

    const tier: SubscriptionTier = subscription?.tier || 'free'
    const status: SubscriptionStatus = subscription?.status || 'active'
    const features = getTierFeatures(tier)

    const hasAccess = (feature: keyof FeatureAccess): boolean => {
        return hasFeatureAccess(tier, feature)
    }

    const getLimit = (limitKey: keyof SubscriptionLimits): number | 'unlimited' => {
        return getFeatureLimit(tier, limitKey)
    }

    const canAdd = (limitKey: keyof SubscriptionLimits, currentCount: number): boolean => {
        return canAddMore(tier, limitKey, currentCount)
    }

    const value: SubscriptionContextValue = {
        subscription,
        tier,
        status,
        features,
        isLoading,
        error,
        hasAccess,
        getLimit,
        canAdd,
        refetch: fetchSubscription,
    }

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    )
}

/**
 * Hook to access subscription context
 */
export function useSubscription(): SubscriptionContextValue {
    const context = useContext(SubscriptionContext)
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider')
    }
    return context
}

/**
 * Hook to check feature access
 */
export function useFeatureAccess(feature: keyof FeatureAccess): boolean {
    const { hasAccess } = useSubscription()
    return hasAccess(feature)
}

/**
 * Hook to check if user can add more items
 */
export function useCanAddMore(limitKey: keyof SubscriptionLimits, currentCount: number): boolean {
    const { canAdd } = useSubscription()
    return canAdd(limitKey, currentCount)
}
