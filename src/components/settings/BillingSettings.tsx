'use client'

import { Button } from '@/components/Button'
import { useSubscription } from '@/lib/context/SubscriptionContext'
import { CreditCardIcon, CheckCircleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { UpgradeButton, PaymentModal } from '@/components/stripe'
import { useState, useEffect } from 'react'
import { apiPost, apiGet } from '@/utils/api'

export function BillingSettings() {
    const { tier, isLoading, subscription } = useSubscription()
    const [managingSubscription, setManagingSubscription] = useState(false)
    const [hasStripeCustomer, setHasStripeCustomer] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

    // Check if user has Stripe customer ID
    useEffect(() => {
        console.log('Subscription data:', subscription)
        console.log('Stripe Customer ID:', subscription?.stripeCustomerId)
        if (subscription?.stripeCustomerId) {
            setHasStripeCustomer(true)
        } else {
            setHasStripeCustomer(false)
        }
    }, [subscription])

    const handleManageSubscription = async () => {
        try {
            setManagingSubscription(true)
            const response = await apiPost('/api/stripe/create-portal-session', {})

            // Check if response is ok
            if (!response.ok) {
                const errorData = await response.json()
                console.error('API Error Response:', errorData)
                console.error('Status:', response.status)
                throw new Error(errorData.error || 'Failed to create portal session')
            }

            const data = await response.json()

            if (data.url) {
                // Redirect to Stripe customer portal
                window.location.href = data.url
            }
        } catch (error) {
            console.error('Error opening customer portal:', error)
            alert('Failed to open subscription management. Please try again.')
        } finally {
            setManagingSubscription(false)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Current Plan Skeleton */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <div className="h-6 w-40 bg-gray-200 rounded"></div>
                    </div>

                    <div className="px-6 py-6">
                        <div className="space-y-6">
                            {/* Plan Card Skeleton */}
                            <div className="bg-gray-100 rounded-lg p-6">
                                <div className="h-6 w-32 bg-gray-200 rounded mb-2"></div>
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                            </div>

                            {/* Features List Skeleton */}
                            <div>
                                <div className="h-5 w-48 bg-gray-200 rounded mb-3"></div>
                                <div className="space-y-2">
                                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <div className="w-5 h-5 bg-gray-200 rounded flex-shrink-0"></div>
                                            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const isPremium = tier === 'premium'

    return (
        <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                        <CreditCardIcon className="h-5 w-5 text-[#004D40]" />
                        Current Plan
                    </h3>
                </div>

                <div className="px-6 py-6">
                    <div className="space-y-6">
                        {/* Cancellation Notice */}
                        {isPremium && subscription?.cancelAtPeriodEnd && subscription?.endDate && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-amber-900">
                                            Subscription Canceling
                                        </h4>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Your subscription will cancel on {new Date(subscription.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
                                            You&apos;ll continue to have Premium access until then. Click &quot;Manage Subscription&quot; to reactivate.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isPremium ? (
                            <div className="bg-gradient-to-r from-[#004D40] to-[#00695C] rounded-lg p-6 text-white">
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <SparklesIcon className="h-6 w-6 text-[#FFC107]" />
                                            <h4 className="text-xl font-semibold">Premium Plan</h4>
                                        </div>
                                        <p className="text-sm opacity-90 mb-3">
                                            You have access to all features including unlimited accounts, advanced reports, and transaction history.
                                        </p>
                                        {/* Renewal Date - only show for active subscriptions */}
                                        {subscription?.endDate && !subscription?.cancelAtPeriodEnd && (
                                            <p className="text-sm opacity-80 mb-4">
                                                Renews on {new Date(subscription.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        )}
                                        {hasStripeCustomer && (
                                            <button
                                                onClick={handleManageSubscription}
                                                disabled={managingSubscription}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#004D40] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {managingSubscription ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-[#004D40]/20 border-t-[#004D40] rounded-full animate-spin"></div>
                                                        <span>Loading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCardIcon className="h-4 w-4" />
                                                        <span>Manage Subscription</span>
                                                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                <h4 className="text-lg font-medium text-gray-900 mb-2">Free Plan</h4>
                                <p className="text-sm text-gray-600 mb-4">
                                    You&apos;re currently on the free plan. Upgrade to unlock all features!
                                </p>
                                <div className="flex gap-3">
                                    <UpgradeButton priceType="annual" variant="gradient" size="md">
                                        Annual $99/yr
                                    </UpgradeButton>
                                    <UpgradeButton priceType="monthly" variant="secondary" size="md">
                                        Monthly $9.99/mo
                                    </UpgradeButton>
                                </div>
                                <button
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    className="inline-block mt-3 text-sm text-[#004D40] hover:text-[#00695C] hover:underline"
                                >
                                    Compare all plans →
                                </button>
                            </div>
                        )}

                        {/* Features List */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">
                                {isPremium ? 'Your Premium Features' : 'What You Get with Premium'}
                            </h4>
                            <ul className="space-y-2">
                                {[
                                    'Unlimited Plaid account connections',
                                    'Unlimited crypto wallets',
                                    'Full transaction history with AI categorization',
                                    'Advanced reports and analytics',
                                    'Full percentile ranking and distribution charts',
                                    'CSV export for transactions and reports',
                                    '365-day historical data',
                                ].map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                        <CheckCircleIcon className={`h-5 w-5 flex-shrink-0 ${isPremium ? 'text-green-500' : 'text-gray-400'}`} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
            />
        </div>
    )
}
