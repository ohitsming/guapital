'use client';

import { useState } from 'react';

interface UpgradeButtonProps {
  priceType?: 'monthly' | 'annual' | 'founding';
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Direct Stripe Checkout Button
 *
 * Handles creating a Stripe checkout session and redirecting the user.
 * Shows loading state and handles errors.
 *
 * Usage:
 * <UpgradeButton priceType="annual">Upgrade to Premium</UpgradeButton>
 * <UpgradeButton priceType="monthly" variant="secondary" size="sm">Try Monthly</UpgradeButton>
 */
export function UpgradeButton({
  priceType = 'annual',
  children = 'Upgrade to Premium',
  className,
  variant = 'primary',
  size = 'md',
  onSuccess,
  onError,
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);

    try {
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
          window.location.href = `/signup?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }

        const errorMessage = error.error || 'Failed to create checkout session';
        if (onError) {
          onError(errorMessage);
        } else {
          alert(errorMessage);
        }
        setIsLoading(false);
        return;
      }

      const { url } = await response.json();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      const errorMessage = 'Something went wrong. Please try again.';

      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
      setIsLoading(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-[#004D40] text-white hover:bg-[#00695C] disabled:bg-gray-300',
    secondary: 'bg-white border-2 border-[#004D40] text-[#004D40] hover:bg-[#004D40]/5 disabled:border-gray-300 disabled:text-gray-400',
    gradient: 'bg-gradient-to-r from-[#004D40] to-[#00695C] text-white hover:shadow-lg hover:scale-105 disabled:from-gray-300 disabled:to-gray-300 disabled:hover:scale-100',
  };

  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed';
  const finalClassName = className || `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`;

  return (
    <button
      onClick={handleUpgrade}
      disabled={isLoading}
      className={finalClassName}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
