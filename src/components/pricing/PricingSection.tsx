'use client';

import React, { useState, useEffect } from 'react';
import { PricingCard } from './PricingCard';
import { FoundingMemberBanner } from './FoundingMemberBanner';
import { FadeIn } from '../FadeIn';

interface PricingSectionProps {
  showFoundingBanner?: boolean;
  remainingFoundingSlots?: number;
  onSelectPlan?: (tier: 'free' | 'premium', billingPeriod: 'monthly' | 'annual') => void;
}

/**
 * Pricing Section Component
 *
 * Complete pricing display with Free and Premium tiers.
 * Includes founding member banner and handles plan selection.
 *
 * Usage:
 * <PricingSection
 *   showFoundingBanner={true}
 *   remainingFoundingSlots={847}
 *   onSelectPlan={(tier) => handlePlanSelection(tier)}
 * />
 */
export function PricingSection({
  showFoundingBanner = true,
  remainingFoundingSlots,
  onSelectPlan,
}: PricingSectionProps) {
  const [isFoundingMemberEligible, setIsFoundingMemberEligible] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  // Check if founding member slots are still available
  useEffect(() => {
    if (remainingFoundingSlots !== undefined) {
      setIsFoundingMemberEligible(remainingFoundingSlots > 0);
    }
  }, [remainingFoundingSlots]);

  const handleSelectPlan = (tier: 'free' | 'premium') => {
    if (onSelectPlan) {
      onSelectPlan(tier, billingPeriod);
    } else {
      // Default behavior: navigate to signup/upgrade
      if (tier === 'free') {
        window.location.href = '/signup';
      } else {
        window.location.href = '/signup?tier=premium';
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <FadeIn>
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 px-4">
            Simple, Honest Pricing
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-4">
            Start free, upgrade when you&apos;re ready. No hidden fees, no surprises.
          </p>
        </div>
      </FadeIn>

      {/* Founding Member Banner */}
      {showFoundingBanner && isFoundingMemberEligible && (
        <div className="mb-6 sm:mb-8">
          <FoundingMemberBanner
            remainingSlots={remainingFoundingSlots}
            showCloseButton={false}
          />
        </div>
      )}

      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base min-h-[44px] ${
            billingPeriod === 'monthly'
              ? 'bg-[#004D40] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingPeriod('annual')}
          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all relative text-sm sm:text-base min-h-[44px] ${
            billingPeriod === 'annual'
              ? 'bg-[#004D40] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Annual
          <span className="absolute -top-2 -right-2 bg-[#FFC107] text-[#004D40] text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
            Save 36%
          </span>
        </button>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
        {/* Free Tier - Always shown */}
        <PricingCard
          tier="free"
          billingPeriod={billingPeriod}
          onSelectPlan={() => handleSelectPlan('free')}
        />

        {/* Premium Monthly - Only when monthly is selected */}
        {billingPeriod === 'monthly' && (
          <PricingCard
            tier="premium"
            billingPeriod="monthly"
            onSelectPlan={() => handleSelectPlan('premium')}
          />
        )}

        {/* Premium Annual - Only when annual is selected AND no founding slots available */}
        {billingPeriod === 'annual' && !isFoundingMemberEligible && (
          <PricingCard
            tier="premium"
            billingPeriod="annual"
            highlighted={true}
            onSelectPlan={() => handleSelectPlan('premium')}
          />
        )}

        {/* Founding Member Annual - Only when annual is selected AND founding slots available */}
        {billingPeriod === 'annual' && isFoundingMemberEligible && (
          <PricingCard
            tier="founding"
            billingPeriod="annual"
            isFoundingMember={true}
            highlighted={true}
            onSelectPlan={() => handleSelectPlan('premium')}
          />
        )}
      </div>

      {/* Savings Calculator */}
      {billingPeriod === 'monthly' && (
        <div className="mt-8 sm:mt-12 bg-gradient-to-r from-[#FFC107]/10 to-[#FFD54F]/10 border-2 border-[#FFC107] rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              💰 Annual Plan Saves You Money
            </h3>
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mt-6">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Monthly Plan</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">$12.99<span className="text-xs sm:text-sm text-gray-600">/mo</span></p>
                <p className="text-xs text-gray-500 mt-1">= $155.88/year</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-3xl sm:text-4xl font-bold text-[#FFC107]">→</div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Annual Plan</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#004D40]">$99<span className="text-xs sm:text-sm text-gray-600">/yr</span></p>
                <p className="text-xs font-bold text-[#FFC107] mt-1">SAVE $56.88 (36%)</p>
              </div>
            </div>
            <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-700">
              That&apos;s like getting <strong>4 months free</strong> when you go annual!
            </p>
            <button
              onClick={() => setBillingPeriod('annual')}
              className="mt-4 px-6 py-2.5 bg-[#004D40] text-white rounded-lg font-semibold hover:bg-[#00695C] transition-colors text-sm sm:text-base min-h-[44px]"
            >
              Switch to Annual →
            </button>
          </div>
        </div>
      )}

      {/* Comparison Table (Optional) */}
      <div className="mt-12 sm:mt-16">
        <h3 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-6 sm:mb-8 px-4">
          How We Compare
        </h3>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full max-w-4xl mx-auto bg-white rounded-none sm:rounded-xl shadow-md overflow-hidden">
              <thead className="bg-[#004D40] text-white">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold">Feature</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold whitespace-nowrap">Guapital Free</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold bg-[#FFC107] text-[#004D40] whitespace-nowrap">
                    Guapital Premium
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold whitespace-nowrap">Competitors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-medium">Price</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-700">$0</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-[#004D40]">
                  $12.99/mo or ${isFoundingMemberEligible ? '79' : '99'}/yr
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-700">$14.99/mo or $99-109/yr</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-medium">Crypto Wallets</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-700">2 wallets</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-[#004D40]">UNLIMITED</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-700">0-3 wallets</td>
              </tr>
              <tr>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-medium">Plaid Accounts</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-400">−</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-[#004D40]">Unlimited</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-700">Unlimited</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-medium">Transaction History</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-400">−</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-[#004D40]">✓</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-700">✓</td>
              </tr>
              <tr>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-medium">AI Categorization</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-400">−</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-[#004D40]">✓</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-700">Limited</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-medium">Historical Data</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-700">30 days</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-[#004D40]">365 days</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-700">90-365 days</td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

        <p className="text-center text-xs sm:text-sm text-gray-600 mt-4 sm:mt-6 italic px-4">
          * Competitor pricing based on Monarch Money ($14.99/mo or $99/yr), YNAB ($14.99/mo or $109/yr), Copilot ($14.99/mo or $95/yr)
        </p>
      </div>

      {/* FAQ Section */}
      <div className="mt-12 sm:mt-16 max-w-3xl mx-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-6 sm:mb-8 px-4">
          Frequently Asked Questions
        </h3>

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
              What happens to founding members after 1,000 users?
            </h4>
            <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
              The first 1,000 users lock in $79/year pricing <strong>forever</strong>. After that,
              new users pay $99/year. Your price will never increase as a founding member.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
              Can I upgrade from Free to Premium later? Or switch from monthly to annual?
            </h4>
            <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
              Absolutely! You can upgrade from Free anytime, or switch from monthly to annual subscription at any time.
              If founding member slots are still available when you upgrade, you&apos;ll get the $79/year rate.
              Otherwise, you&apos;ll pay the regular $99/year or $9.99/month.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
              Should I choose monthly or annual pricing?
            </h4>
            <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
              <strong>Monthly ($12.99/month)</strong> is great for trying Guapital risk-free. Cancel anytime.
              <br /><br />
              <strong>Annual ($99/year)</strong> saves you $56.88 (36% off) - that&apos;s almost 4 months free!
              Most users choose annual after trying monthly for 1-2 months.
              <br /><br />
              <strong>Founding Member ($79/year)</strong> locks in the best price forever - only for the first 1,000 users.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
              Why is Guapital competitively priced?
            </h4>
            <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
              We match the best annual pricing ($99/year, same as Monarch) but offer a 13% cheaper monthly option ($12.99 vs $14.99).
              We&apos;re building for rapid growth, not maximizing revenue. Plus, we don&apos;t sell your data (unlike some competitors).
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
              What makes unlimited crypto wallets special?
            </h4>
            <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
              As DeFi grows, so does our app. Most competitors charge extra or limit crypto tracking to 1-3 wallets.
              We believe in unlimited access because modern wealth builders hold assets across multiple chains
              (Ethereum, Polygon, Base, Arbitrum, Optimism). Track all your DeFi activity in one place without artificial limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
