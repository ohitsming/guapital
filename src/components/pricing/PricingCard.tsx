'use client';

import React from 'react';
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface PricingFeature {
  name: string;
  included: boolean;
  highlight?: boolean; // Highlight special features
}

interface PricingCardProps {
  tier: 'free' | 'premium' | 'founding';
  billingPeriod?: 'monthly' | 'annual';
  isFoundingMember?: boolean;
  onSelectPlan?: () => void;
  highlighted?: boolean;
}

/**
 * Pricing Card Component
 *
 * Displays pricing information for Free and Premium tiers.
 * Supports founding member pricing display and call-to-action buttons.
 *
 * Usage:
 * <PricingCard tier="free" />
 * <PricingCard tier="premium" isFoundingMember={true} highlighted={true} onSelectPlan={handleUpgrade} />
 */
export function PricingCard({ tier, billingPeriod = 'annual', isFoundingMember = false, onSelectPlan, highlighted = false }: PricingCardProps) {
  const isFree = tier === 'free';
  const isPremium = tier === 'premium';
  const isFounding = tier === 'founding';
  const isMonthly = billingPeriod === 'monthly';

  // Pricing data
  const pricing = {
    free: {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out Guapital',
      badge: undefined,
      savings: undefined,
      features: [
        { name: 'Unlimited manual entry', included: true },
        { name: '2 crypto wallets', included: true },
        { name: 'Net worth dashboard & charts', included: true },
        { name: '30-day history', included: true },
        { name: 'Unlimited manual assets', included: true },
        { name: 'Percentile ranking preview', included: true },
        { name: 'Plaid account sync', included: false },
        { name: 'Transaction history', included: false },
        { name: 'AI categorization', included: false },
        { name: 'Advanced reports', included: false },
      ],
      buttonText: 'Get Started Free',
      buttonStyle: 'border-2 border-gray-300 text-gray-700 hover:border-[#004D40] hover:text-[#004D40]',
    },
    premium: {
      name: 'Premium',
      price: isMonthly ? '$12.99' : '$99',
      period: isMonthly ? 'per month' : 'per year',
      description: 'Everything you need to track your wealth',
      badge: isMonthly ? undefined : 'Best Value',
      savings: isMonthly ? undefined : 'Save $56.88 (36% off)',
      features: [
        { name: 'Everything in Free, plus:', included: true },
        { name: 'Unlimited Plaid-connected accounts', included: true, highlight: true },
        { name: 'UNLIMITED crypto wallets', included: true, highlight: true },
        { name: 'Full 365-day history', included: true },
        { name: 'Full percentile ranking + leaderboard', included: true },
        { name: 'AI transaction categorization', included: true },
        { name: 'Complete transaction history', included: true },
        { name: 'Advanced reports & analytics', included: true },
        { name: 'CSV export for tax time', included: true },
        { name: 'Email support (48hr response)', included: true },
      ],
      buttonText: isMonthly ? 'Try Monthly' : 'Get Annual',
      buttonStyle: 'bg-gradient-to-r from-[#004D40] to-[#00695C] text-white hover:shadow-lg hover:scale-105',
    },
    founding: {
      name: 'Premium',
      price: '$79',
      period: 'per year',
      description: 'Locked in forever - First 1,000 only',
      badge: 'Founding Member',
      savings: 'Save $76.88 (49% off)',
      features: [
        { name: 'Everything in Free, plus:', included: true },
        { name: 'Unlimited Plaid-connected accounts', included: true, highlight: true },
        { name: 'UNLIMITED crypto wallets', included: true, highlight: true },
        { name: 'Full 365-day history', included: true },
        { name: 'Full percentile ranking + leaderboard', included: true },
        { name: 'AI transaction categorization', included: true },
        { name: 'Complete transaction history', included: true },
        { name: 'Advanced reports & analytics', included: true },
        { name: 'CSV export for tax time', included: true },
        { name: 'Priority email support', included: true, highlight: true },
      ],
      buttonText: 'Claim Your Spot',
      buttonStyle: 'bg-gradient-to-r from-[#FFC107] to-[#FFD54F] text-[#004D40] hover:shadow-lg hover:scale-105 font-bold',
    },
  };

  const cardData = pricing[tier];

  return (
    <div
      className={`
        relative rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl transition-all duration-300
        ${highlighted ? 'border-3 sm:border-4 border-[#FFC107] bg-gradient-to-br from-white to-[#FFC107]/5 sm:scale-105' : 'border-2 border-gray-200 bg-white'}
        ${isPremium ? 'hover:shadow-2xl' : ''}
      `}
    >
      {/* Badge */}
      {cardData.badge && (
        <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
          <div
            className={`
            px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5
            ${isFoundingMember ? 'bg-[#FFC107] text-[#004D40]' : 'bg-[#004D40] text-white'}
          `}
          >
            {isFoundingMember && <SparklesIcon className="h-3 w-3 sm:h-4 sm:w-4" />}
            {cardData.badge}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-5 sm:mb-6 pt-2">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{cardData.name}</h3>
        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 px-2">{cardData.description}</p>

        <div className="flex items-baseline justify-center gap-1 sm:gap-2">
          <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#004D40]">{cardData.price}</span>
          <span className="text-gray-600 text-xs sm:text-sm">/ {cardData.period}</span>
        </div>

        {/* Savings display */}
        {cardData.savings && (
          <p className="mt-2 text-xs sm:text-sm font-bold text-[#FFC107]">
            {cardData.savings}
          </p>
        )}

        {/* Monthly equivalent calculation */}
        {!isMonthly && (isPremium || isFounding) && (
          <p className="mt-1 text-xs text-gray-500">
            {isFounding ? '$6.58' : '$8.25'}/month equivalent
          </p>
        )}

        {/* Annual cost comparison for monthly */}
        {isMonthly && isPremium && (
          <p className="mt-2 text-xs text-gray-600">
            $155.88/year • Annual saves you $56.88!
          </p>
        )}
      </div>

      {/* CTA Button */}
      <button
        onClick={onSelectPlan}
        className={`
          w-full py-3 sm:py-3.5 px-6 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 mb-5 sm:mb-6 min-h-[48px]
          ${cardData.buttonStyle}
        `}
      >
        {cardData.buttonText}
      </button>

      {/* Features List */}
      <div className="space-y-2.5 sm:space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">What&apos;s Included:</p>
        {cardData.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2 sm:gap-3">
            <div
              className={`
              flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center mt-0.5
              ${
                feature.included
                  ? (feature as PricingFeature).highlight
                    ? 'bg-[#FFC107] text-[#004D40]'
                    : 'bg-[#004D40]/10 text-[#004D40]'
                  : 'bg-gray-100 text-gray-400'
              }
            `}
            >
              {feature.included ? (
                <CheckIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[3]" />
              ) : (
                <span className="text-xs">−</span>
              )}
            </div>
            <span
              className={`
              text-xs sm:text-sm leading-tight
              ${feature.included ? ((feature as PricingFeature).highlight ? 'text-gray-900 font-semibold' : 'text-gray-700') : 'text-gray-400'}
            `}
            >
              {feature.name}
            </span>
          </div>
        ))}
      </div>

      {/* Unlimited crypto callout for Premium and Founding */}
      {(isPremium || isFounding) && (
        <div className="mt-5 sm:mt-6 p-3 sm:p-4 bg-[#004D40]/5 rounded-lg border border-[#004D40]/20">
          <p className="text-xs sm:text-sm text-[#004D40] font-semibold text-center leading-tight">
            {isFounding ? '💎 Founding Member Price Locked In Forever' : 'Only app with UNLIMITED crypto wallets at this price'}
          </p>
        </div>
      )}
    </div>
  );
}
