'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PricingOption {
  id: 'monthly' | 'annual' | 'founding';
  name: string;
  price: string;
  period: string;
  priceType: 'monthly' | 'annual' | 'founding';
  badge?: string;
  savings?: string;
  monthlyEquivalent?: string;
  highlighted?: boolean;
  disabled?: boolean;
}

/**
 * Payment Modal Component
 *
 * Modal that allows users to choose their subscription period before checkout.
 * Shows monthly, annual, and founding member options (if available).
 *
 * Usage:
 * const [isModalOpen, setIsModalOpen] = useState(false);
 * <PaymentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
 */
export function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'monthly' | 'annual' | 'founding'>('founding');
  const [remainingSlots, setRemainingSlots] = useState<number | undefined>(undefined);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch founding member slots
  useEffect(() => {
    if (isOpen) {
      setSlotsLoading(true);
      setRemainingSlots(undefined); // Reset on open
      fetchRemainingSlots();
    }
  }, [isOpen]);

  // Auto-select founding member option if available (runs only after loading completes)
  useEffect(() => {
    if (!slotsLoading && remainingSlots !== undefined) {
      if (remainingSlots > 0) {
        setSelectedOption('founding');
      } else {
        setSelectedOption('annual');
      }
    }
  }, [slotsLoading, remainingSlots]);

  const fetchRemainingSlots = async () => {
    try {
      const response = await fetch('/api/founding-members/remaining');
      const data = await response.json();
      console.log('Founding member slots data:', data);
      setRemainingSlots(data.remaining);
    } catch (error) {
      console.error('Error fetching founding member slots:', error);
      // Default to 1000 available if API fails (development)
      setRemainingSlots(1000);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType: selectedOption }),
      });

      if (!response.ok) {
        const error = await response.json();

        // If unauthorized, redirect to signup/login
        if (response.status === 401) {
          window.location.href = `/signup?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }

        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const pricingOptions: PricingOption[] = [
    {
      id: 'founding',
      name: '💎 Founding Member',
      price: '$79',
      period: 'per year',
      priceType: 'founding',
      badge: 'LIMITED OFFER',
      savings: slotsLoading
        ? 'Checking availability...'
        : remainingSlots && remainingSlots > 0
        ? `Save $40.88 (34%) • Only ${remainingSlots} spots left!`
        : 'Sold Out',
      monthlyEquivalent: '$6.58/month • Locked in forever',
      highlighted: !slotsLoading && remainingSlots !== undefined && remainingSlots > 0,
      disabled: !slotsLoading && remainingSlots === 0,
    },
    {
      id: 'annual',
      name: 'Annual',
      price: '$99',
      period: 'per year',
      priceType: 'annual',
      badge: (!slotsLoading && remainingSlots === 0) ? 'Best Value' : undefined,
      savings: 'Save $20.88 (17%)',
      monthlyEquivalent: '$8.25/month',
      highlighted: !slotsLoading && remainingSlots === 0,
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$9.99',
      period: 'per month',
      priceType: 'monthly',
      monthlyEquivalent: '$9.99/month',
    },
  ];

  // Show Founding + Monthly when slots available
  // Show Annual + Monthly when founding is sold out
  const filteredOptions = !slotsLoading && remainingSlots !== undefined
    ? remainingSlots > 0
      ? [pricingOptions[0], pricingOptions[2]] // Founding + Monthly when available
      : [pricingOptions[1], pricingOptions[2]] // Annual + Monthly when sold out
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 animate-in fade-in zoom-in duration-200">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Choose Your Plan
            </h2>
            <p className="text-gray-600">
              Unlock unlimited accounts, crypto wallets, and premium features
            </p>
          </div>

          {/* Founding Member Alert Banner */}
          {!slotsLoading && remainingSlots !== undefined && remainingSlots > 0 && (
            <div className="mb-6 bg-gradient-to-r from-[#FFC107] to-[#FFD54F] rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <SparklesIcon className="h-6 w-6 text-[#004D40]" />
                <div className="text-center">
                  <p className="text-sm font-bold text-[#004D40]">
                    🎉 Exclusive Founding Member Offer!
                  </p>
                  <p className="text-xs text-[#004D40]/80">
                    Only {remainingSlots} of 1,000 spots left • $79/year locked in forever • 34% off regular annual pricing
                  </p>
                </div>
                <SparklesIcon className="h-6 w-6 text-[#004D40]" />
              </div>
            </div>
          )}

          {/* Pricing Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {filteredOptions.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
                  <div className="w-12 h-12 border-4 border-[#004D40]/20 border-t-[#004D40] rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-gray-500">Loading pricing options...</p>
              </div>
            ) : (
              filteredOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => !option.disabled && setSelectedOption(option.id)}
                disabled={option.disabled}
                className={`
                  relative p-6 rounded-xl border-2 transition-all text-left
                  ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${selectedOption === option.id
                    ? option.id === 'founding' && !slotsLoading && remainingSlots !== undefined && remainingSlots > 0
                      ? 'border-[#FFC107] bg-gradient-to-br from-[#FFC107]/10 to-[#FFD54F]/5 shadow-xl scale-105'
                      : 'border-[#004D40] bg-[#004D40]/5 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-[#004D40]/50 hover:shadow-md'
                  }
                  ${option.highlighted && !option.disabled
                    ? option.id === 'founding'
                      ? 'ring-4 ring-[#FFC107]/50 shadow-xl'
                      : 'ring-2 ring-[#004D40]'
                    : ''
                  }
                `}
              >
                {/* Badge */}
                {option.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-[#FFC107] text-[#004D40] text-xs font-bold rounded-full whitespace-nowrap">
                      {option.badge}
                    </span>
                  </div>
                )}

                {/* Radio indicator */}
                <div className="absolute top-4 right-4">
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${selectedOption === option.id
                      ? option.id === 'founding' && !slotsLoading && remainingSlots !== undefined && remainingSlots > 0
                        ? 'border-[#FFC107] bg-[#FFC107]'
                        : 'border-[#004D40] bg-[#004D40]'
                      : 'border-gray-300'
                    }
                  `}>
                    {selectedOption === option.id && (
                      <CheckIcon className={`h-4 w-4 stroke-[3] ${
                        option.id === 'founding' && !slotsLoading && remainingSlots !== undefined && remainingSlots > 0 ? 'text-[#004D40]' : 'text-white'
                      }`} />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="mt-4">
                  <h3 className={`text-lg font-bold mb-1 ${
                    option.id === 'founding' && !slotsLoading && remainingSlots !== undefined && remainingSlots > 0
                      ? 'text-[#004D40]'
                      : 'text-gray-900'
                  }`}>
                    {option.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-3xl font-bold ${
                      option.id === 'founding' && !slotsLoading && remainingSlots !== undefined && remainingSlots > 0
                        ? 'text-[#FFC107]'
                        : 'text-[#004D40]'
                    }`}>
                      {option.price}
                    </span>
                    <span className="text-sm text-gray-600">
                      / {option.period.split('per ')[1]}
                    </span>
                  </div>

                  {option.monthlyEquivalent && (
                    <p className={`text-xs mb-2 ${
                      option.id === 'founding' && !slotsLoading && remainingSlots !== undefined && remainingSlots > 0
                        ? 'text-[#004D40] font-semibold'
                        : 'text-gray-500'
                    }`}>
                      {option.monthlyEquivalent}
                    </p>
                  )}

                  {option.savings && (
                    <p className={`text-sm font-semibold ${
                      option.id === 'founding' && !slotsLoading && remainingSlots !== undefined && remainingSlots > 0
                        ? 'text-[#FFC107] animate-pulse'
                        : option.id === 'founding' && slotsLoading
                        ? 'text-gray-400 animate-pulse'
                        : 'text-[#FFC107]'
                    }`}>
                      {option.savings}
                    </p>
                  )}
                </div>
              </button>
            )))}
          </div>

          {/* Features List */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              ✨ What&apos;s Included:
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Unlimited Plaid-connected accounts',
                'UNLIMITED crypto wallets',
                'Full transaction history',
                'AI categorization',
                'Advanced reports & analytics',
                'Full percentile ranking',
                '365-day historical data',
                'CSV export',
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckIcon className="h-5 w-5 text-[#004D40] flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading || slotsLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleCheckout}
              disabled={isLoading || slotsLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#004D40] to-[#00695C] text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                <>Continue to Checkout →</>
              )}
            </button>
          </div>

          {/* Trust Badge */}
          <p className="text-center text-xs text-gray-500 mt-4">
            🔒 Secure checkout powered by Stripe • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
