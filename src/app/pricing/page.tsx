'use client';

import { PricingSection } from '@/components/pricing';
import { useState, useEffect } from 'react';

/**
 * Pricing Page
 *
 * Displays new aggressive growth pricing strategy:
 * - Free tier: 2 crypto wallets, unlimited manual entry
 * - Premium tier: $79/year (founding members) or $99/year (regular)
 * - Pro tier: ELIMINATED for simplicity
 *
 * Features founding member offer (first 1,000 users lock in $79/year forever)
 */
export default function PricingPage() {
  const [remainingSlots, setRemainingSlots] = useState<number | undefined>(undefined);

  useEffect(() => {
    // Fetch remaining founding member slots from API
    // For now, we'll use a placeholder value
    // TODO: Create API endpoint to track founding member signups
    const fetchRemainingSlots = async () => {
      try {
        // const response = await fetch('/api/founding-members/slots');
        // const data = await response.json();
        // setRemainingSlots(data.remaining);

        // Placeholder: 847 slots remaining out of 1,000
        setRemainingSlots(847);
      } catch (error) {
        console.error('Error fetching founding member slots:', error);
        // If API fails, assume founding member offer is still available
        setRemainingSlots(500);
      }
    };

    fetchRemainingSlots();
  }, []);

  const handleSelectPlan = (tier: 'free' | 'premium') => {
    // Redirect to signup with tier parameter
    if (tier === 'free') {
      window.location.href = '/signup';
    } else {
      // Pass founding member eligibility via URL
      const isFoundingEligible = remainingSlots !== undefined && remainingSlots > 0;
      window.location.href = `/signup?tier=premium${isFoundingEligible ? '&founding=true' : ''}`;
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/about" className="text-gray-600 hover:text-[#004D40] transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-gray-600 hover:text-[#004D40] transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Features */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/blog/net-worth-tracker" className="text-gray-600 hover:text-[#004D40] transition-colors">
                    Net Worth Tracker
                  </a>
                </li>
                <li>
                  <a href="/blog/fire-calculator" className="text-gray-600 hover:text-[#004D40] transition-colors">
                    FIRE Calculator
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/terms" className="text-gray-600 hover:text-[#004D40] transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-gray-600 hover:text-[#004D40] transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Stay Updated</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get updates on new features and wealth-building tips.
              </p>
              <a
                href="/join-email-list"
                className="inline-block px-4 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors text-sm font-medium"
              >
                Join Email List
              </a>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 text-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Guapital. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
