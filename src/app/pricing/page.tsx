'use client';

import { PricingSection } from '@/components/pricing';
import { Footer } from '@/components/Footer';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/toast/ToastProvider';

/**
 * Pricing Page
 *
 * Displays aggressive growth pricing strategy:
 * - Free tier: 2 crypto wallets, unlimited manual entry
 * - Premium tier: $12.99/month or $99/year (36% savings)
 *   - Founding members: $79/year forever (first 1,000 users)
 * - Pro tier: ELIMINATED for simplicity
 *
 * Features founding member offer (first 1,000 users lock in $79/year forever)
 */
export default function PricingPage() {
  const [remainingSlots, setRemainingSlots] = useState<number | undefined>(undefined);
  const { showToast } = useToast();

  useEffect(() => {
    // Fetch remaining founding member slots from API
    const fetchRemainingSlots = async () => {
      try {
        const response = await fetch('/api/founding-members/remaining');
        const data = await response.json();
        setRemainingSlots(data.remaining);
      } catch (error) {
        console.error('Error fetching founding member slots:', error);
        // If API fails, assume founding member offer is still available
        setRemainingSlots(1000);
      }
    };

    fetchRemainingSlots();
  }, []);

  const handleSelectPlan = async (tier: 'free' | 'premium', billingPeriod: 'monthly' | 'annual') => {
    // Free tier: Redirect to signup
    if (tier === 'free') {
      window.location.href = '/signup';
      return;
    }

    // Premium tier: Create Stripe checkout session
    try {
      // Determine price type based on billing period and founding member eligibility
      let priceType: 'monthly' | 'annual' | 'founding';

      if (billingPeriod === 'monthly') {
        priceType = 'monthly';
      } else {
        // For annual, check if founding member slots are available
        const isFoundingEligible = remainingSlots !== undefined && remainingSlots > 0;
        priceType = isFoundingEligible ? 'founding' : 'annual';
      }

      // Call Stripe checkout API
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceType }),
      });

      if (!response.ok) {
        const error = await response.json();

        // If unauthorized, redirect to signup/login with return URL
        if (response.status === 401) {
          window.location.href = `/signup?redirect=/pricing&tier=premium&billing=${billingPeriod}`;
          return;
        }

        showToast(error.error || 'Failed to create checkout session', 'error');
        return;
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      showToast('Something went wrong. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="py-12">
        <PricingSection
          showFoundingBanner={true}
          remainingFoundingSlots={remainingSlots}
          onSelectPlan={handleSelectPlan}
        />
      </main>

    </div>
  );
}
