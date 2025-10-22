'use client'

import { Button } from '@/components/Button'
import { useSubscription } from '@/lib/context/SubscriptionContext'
import { CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export function BillingSettings() {
    const { tier, isLoading } = useSubscription()

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
                        {isPremium ? (
                            <div className="bg-gradient-to-r from-[#004D40] to-[#00695C] rounded-lg p-6 text-white">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircleIcon className="h-6 w-6" />
                                            <h4 className="text-xl font-semibold">Premium Plan</h4>
                                        </div>
                                        <p className="text-sm opacity-90">
                                            You have access to all features including unlimited accounts, advanced reports, and transaction history.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                <h4 className="text-lg font-medium text-gray-900 mb-2">Free Plan</h4>
                                <p className="text-sm text-gray-600 mb-4">
                                    You&apos;re currently on the free plan. Upgrade to unlock all features!
                                </p>
                                <Link href="/pricing">
                                    <Button>
                                        Upgrade to Premium
                                    </Button>
                                </Link>
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

                        {!isPremium && (
                            <div className="pt-4 border-t border-gray-200">
                                <Link
                                    href="/pricing"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-sm font-medium text-[#004D40] hover:text-[#00695C] transition-colors duration-150 hover:underline"
                                >
                                    View Pricing Plans →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Information */}
            {isPremium && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                            Payment Information
                        </h3>
                    </div>

                    <div className="px-6 py-6">
                        <p className="text-sm text-gray-600">
                            Payment management coming soon. Contact support if you need to update your payment method.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
