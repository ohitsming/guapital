import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from './DashboardLayoutClient'
import { SubscriptionProvider } from '@/lib/context/SubscriptionContext'
import type { SubscriptionInfo, SubscriptionTier, SubscriptionStatus } from '@/lib/interfaces/subscription'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch subscription data server-side to prevent flashing
    let initialSubscription: SubscriptionInfo = {
        tier: 'free' as SubscriptionTier,
        status: 'active' as SubscriptionStatus,
    }

    // In development, default to 'pro' tier
    const isDevelopment = process.env.NODE_ENV === 'development'
    if (isDevelopment) {
        initialSubscription.tier = 'pro'
    }

    // Fetch actual subscription from database
    const { data: subscriptionData } = await supabase
        .from('user_settings')
        .select('subscription_tier, subscription_status, subscription_start_date, subscription_end_date, stripe_customer_id, stripe_subscription_id')
        .eq('user_id', user.id)
        .single()

    if (subscriptionData) {
        initialSubscription = {
            tier: (subscriptionData.subscription_tier as SubscriptionTier) || 'free',
            status: (subscriptionData.subscription_status as SubscriptionStatus) || 'active',
            startDate: subscriptionData.subscription_start_date ? new Date(subscriptionData.subscription_start_date) : undefined,
            endDate: subscriptionData.subscription_end_date ? new Date(subscriptionData.subscription_end_date) : undefined,
            stripeCustomerId: subscriptionData.stripe_customer_id || undefined,
            stripeSubscriptionId: subscriptionData.stripe_subscription_id || undefined,
        }
    }

    return (
        <SubscriptionProvider initialSubscription={initialSubscription}>
            <DashboardLayoutClient user={user}>
                {children}
            </DashboardLayoutClient>
        </SubscriptionProvider>
    )
}
