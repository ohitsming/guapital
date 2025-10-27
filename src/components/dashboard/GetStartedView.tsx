'use client';

import React, { useState } from 'react';
import PlaidLinkButton from '@/components/plaid/PlaidLinkButton';
import AddAssetButton from '@/components/assets/AddAssetButton';
import { PaymentModal } from '@/components/stripe/PaymentModal';
import { BanknotesIcon, CubeIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useSubscription } from '@/lib/context/SubscriptionContext';

interface GetStartedViewProps {
  onDataAdded?: () => void;
}

const GetStartedView: React.FC<GetStartedViewProps> = ({ onDataAdded }) => {
  const { hasAccess } = useSubscription();
  const hasPremium = hasAccess('plaidSync');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Handler that ensures data check happens after a small delay to allow DB writes to complete
  const handleDataAdded = async () => {
    // Small delay to ensure database writes have propagated
    await new Promise(resolve => setTimeout(resolve, 500));
    if (onDataAdded) {
      await onDataAdded();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Guapital!
        </h1>
        <p className="text-lg text-gray-600">
          Let&apos;s start tracking your net worth. Choose how you&apos;d like to begin:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connect Accounts Card */}
        <div className="bg-white rounded-lg p-8 shadow-sm border-2 border-gray-200 hover:border-blue-500 transition-colors">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-50 rounded-full">
              <BanknotesIcon className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3 text-center">
            Connect Your Accounts
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            Automatically sync your bank accounts, credit cards, and investments using Plaid.
            Your data updates automatically.
          </p>
          <div className="flex justify-center">
            {hasPremium ? (
              <PlaidLinkButton onSuccess={handleDataAdded} />
            ) : (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#004D40] to-[#00695C] border-2 border-transparent rounded-md hover:shadow-lg hover:scale-105 focus:outline-none focus:border-[#FFC107] transition-all"
              >
                <SparklesIcon className="h-5 w-5" />
                Upgrade to Premium
              </button>
            )}
          </div>
          <div className="mt-6 space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Bank-level encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Automatic daily updates</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>10,000+ institutions supported</span>
            </div>
            {!hasPremium && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-[#FFC107] font-semibold">
                  <SparklesIcon className="h-4 w-4" />
                  <span>Premium Feature</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual Entry Card */}
        <div className="bg-white rounded-lg p-8 shadow-sm border-2 border-gray-200 hover:border-blue-500 transition-colors">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-50 rounded-full">
              <CubeIcon className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3 text-center">
            Add Assets Manually
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            Track assets that can&apos;t be connected automatically, like real estate, vehicles,
            collectibles, or crypto wallets.
          </p>
          <div className="flex justify-center">
            <AddAssetButton onAssetAdded={handleDataAdded} />
          </div>
          <div className="mt-6 space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Track any type of asset</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Full value history</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Unlimited entries on Free plan</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          💡 <strong>Pro tip:</strong> You can use both methods! Connect your bank accounts for automation,
          then manually add assets like real estate or crypto wallets.
        </p>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </div>
  );
};

export default GetStartedView;
