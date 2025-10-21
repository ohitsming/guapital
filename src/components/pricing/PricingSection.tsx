'use client';

import React, { useState, useEffect } from 'react';
import { PricingCard } from './PricingCard';
import { FoundingMemberBanner } from './FoundingMemberBanner';

interface PricingSectionProps {
  showFoundingBanner?: boolean;
  remainingFoundingSlots?: number;
  onSelectPlan?: (tier: 'free' | 'premium') => void;
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
      onSelectPlan(tier);
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
    <div className="w-full max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Start free, upgrade when you need automation. No hidden fees, no complexity.
        </p>

        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-[#004D40] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-6 py-2 rounded-lg font-medium transition-all relative ${
              billingPeriod === 'annual'
                ? 'bg-[#004D40] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-[#FFC107] text-[#004D40] text-xs font-bold px-2 py-0.5 rounded-full">
              Save 45%
            </span>
          </button>
        </div>
      </div>

      {/* Founding Member Banner */}
      {showFoundingBanner && isFoundingMemberEligible && (
        <div className="mb-12">
          <FoundingMemberBanner
            remainingSlots={remainingFoundingSlots}
            showCloseButton={false}
          />
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
        <div className="mt-12 bg-gradient-to-r from-[#FFC107]/10 to-[#FFD54F]/10 border-2 border-[#FFC107] rounded-2xl p-8 max-w-4xl mx-auto">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              💰 Annual Plan Saves You Money
            </h3>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Plan</p>
                <p className="text-3xl font-bold text-gray-900">$15<span className="text-sm text-gray-600">/mo</span></p>
                <p className="text-xs text-gray-500 mt-1">= $180/year</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-4xl font-bold text-[#FFC107]">→</div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Annual Plan</p>
                <p className="text-3xl font-bold text-[#004D40]">$99<span className="text-sm text-gray-600">/yr</span></p>
                <p className="text-xs font-bold text-[#FFC107] mt-1">SAVE $81 (45%)</p>
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-700">
              That&apos;s like getting <strong>6 months free</strong> when you go annual!
            </p>
            <button
              onClick={() => setBillingPeriod('annual')}
              className="mt-4 px-6 py-2 bg-[#004D40] text-white rounded-lg font-semibold hover:bg-[#00695C] transition-colors"
            >
              Switch to Annual →
            </button>
          </div>
        </div>
      )}

      {/* Comparison Table (Optional) */}
      <div className="mt-16">
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
          How We Compare
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <thead className="bg-[#004D40] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Feature</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Guapital Free</th>
                <th className="px-6 py-4 text-center text-sm font-semibold bg-[#FFC107] text-[#004D40]">
                  Guapital Premium
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Competitors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">Price</td>
                <td className="px-6 py-4 text-center text-sm text-gray-700">$0</td>
                <td className="px-6 py-4 text-center text-sm font-bold text-[#004D40]">
                  $15/mo or ${isFoundingMemberEligible ? '79' : '99'}/yr
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-700">$15/mo or $109-180/yr</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">Crypto Wallets</td>
                <td className="px-6 py-4 text-center text-sm text-gray-700">2 wallets</td>
                <td className="px-6 py-4 text-center text-sm font-bold text-[#004D40]">UNLIMITED</td>
                <td className="px-6 py-4 text-center text-sm text-gray-700">0-3 wallets</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">Plaid Accounts</td>
                <td className="px-6 py-4 text-center text-sm text-gray-400">−</td>
                <td className="px-6 py-4 text-center text-sm font-bold text-[#004D40]">Unlimited</td>
                <td className="px-6 py-4 text-center text-sm text-gray-700">Unlimited</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">Transaction History</td>
                <td className="px-6 py-4 text-center text-sm text-gray-400">−</td>
                <td className="px-6 py-4 text-center text-sm font-bold text-[#004D40]">✓</td>
                <td className="px-6 py-4 text-center text-sm text-gray-700">✓</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">AI Categorization</td>
                <td className="px-6 py-4 text-center text-sm text-gray-400">−</td>
                <td className="px-6 py-4 text-center text-sm font-bold text-[#004D40]">✓</td>
                <td className="px-6 py-4 text-center text-sm text-gray-700">Limited</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">Historical Data</td>
                <td className="px-6 py-4 text-center text-sm text-gray-700">30 days</td>
                <td className="px-6 py-4 text-center text-sm font-bold text-[#004D40]">365 days</td>
                <td className="px-6 py-4 text-center text-sm text-gray-700">90-365 days</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6 italic">
          * Competitor pricing based on Monarch Money ($180/year), YNAB ($109/year), Copilot ($95/year)
        </p>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Frequently Asked Questions
        </h3>

        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h4 className="font-semibold text-gray-900 mb-2">
              What happens to founding members after 1,000 users?
            </h4>
            <p className="text-gray-700 text-sm">
              The first 1,000 users lock in $79/year pricing <strong>forever</strong>. After that,
              new users pay $99/year. Your price will never increase as a founding member.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h4 className="font-semibold text-gray-900 mb-2">
              Can I upgrade from Free to Premium later? Or switch from monthly to annual?
            </h4>
            <p className="text-gray-700 text-sm">
              Absolutely! You can upgrade from Free anytime, or switch from monthly to annual subscription at any time.
              If founding member slots are still available when you upgrade, you&apos;ll get the $79/year rate.
              Otherwise, you&apos;ll pay the regular $99/year or $15/month.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h4 className="font-semibold text-gray-900 mb-2">
              Should I choose monthly or annual pricing?
            </h4>
            <p className="text-gray-700 text-sm">
              <strong>Monthly ($15/month)</strong> is great for trying Guapital risk-free. Cancel anytime.
              <br /><br />
              <strong>Annual ($99/year)</strong> saves you $81 (45% off) - that&apos;s basically 6 months free!
              Most users choose annual after trying monthly for 1-2 months.
              <br /><br />
              <strong>Founding Member ($79/year)</strong> locks in the best price forever - only for the first 1,000 users.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h4 className="font-semibold text-gray-900 mb-2">
              Why is Guapital cheaper than competitors?
            </h4>
            <p className="text-gray-700 text-sm">
              We&apos;re building for rapid growth, not maximizing revenue. Our aggressive pricing strategy
              helps us gain market share quickly. Plus, we don&apos;t sell your data (unlike some competitors).
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h4 className="font-semibold text-gray-900 mb-2">
              What makes unlimited crypto wallets special?
            </h4>
            <p className="text-gray-700 text-sm">
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
