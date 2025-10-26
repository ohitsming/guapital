'use client';

import React, { useState, useEffect } from 'react';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FoundingMemberBannerProps {
  totalFoundingSlots?: number;
  remainingSlots?: number;
  showCloseButton?: boolean;
}

/**
 * Founding Member Banner Component
 *
 * Displays promotional messaging for the founding member pricing offer.
 * Shows urgency with remaining slots counter and highlights $79/year locked-in pricing.
 *
 * Usage:
 * - On pricing page
 * - On dashboard for free users
 * - On signup flow
 */
export function FoundingMemberBanner({
  totalFoundingSlots = 1000,
  remainingSlots,
  showCloseButton = true,
}: FoundingMemberBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('founding-member-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('founding-member-banner-dismissed', 'true');
  };

  if (isDismissed) {
    return null;
  }

  const slotsUsed = remainingSlots !== undefined ? totalFoundingSlots - remainingSlots : undefined;
  const percentageTaken = slotsUsed !== undefined ? Math.round((slotsUsed / totalFoundingSlots) * 100) : undefined;

  return (
    <div className="relative bg-gradient-to-r from-[#004D40] via-[#00695C] to-[#004D40] text-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg border-2 border-[#FFC107]">
      {/* Close button */}
      {showCloseButton && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white transition-colors z-10"
          aria-label="Dismiss banner"
        >
          <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}

      {/* Content */}
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 bg-[#FFC107] text-[#004D40] rounded-full p-2 sm:p-3">
          <SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        {/* Text */}
        <div className="flex-1 pr-6 sm:pr-8">
          <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 flex flex-col sm:flex-row sm:items-center gap-2">
            <span>Founding Member Offer</span>
            <span className="inline-block w-fit px-2.5 py-0.5 bg-[#FFC107] text-[#004D40] text-xs font-semibold rounded-full">
              Limited Time
            </span>
          </h3>

          <p className="text-white/90 text-sm sm:text-base mb-3 leading-relaxed">
            Join the first <strong>1,000 users</strong> and lock in <strong className="text-[#FFC107]">$79/year pricing forever</strong>.
            Regular pricing will be $99/year after founding member slots are filled.
          </p>

          {/* Urgency indicator */}
          {remainingSlots !== undefined && remainingSlots > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                <span className="font-medium">Founding member slots remaining:</span>
                <span className="font-bold text-[#FFC107] whitespace-nowrap">
                  {remainingSlots} / {totalFoundingSlots}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/20 rounded-full h-2 sm:h-2.5 overflow-hidden">
                <div
                  className="bg-[#FFC107] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${percentageTaken}%` }}
                />
              </div>

              <p className="text-xs sm:text-sm text-white/80 italic">
                {percentageTaken && percentageTaken >= 80
                  ? '🔥 Almost gone! Lock in your founding member price now.'
                  : percentageTaken && percentageTaken >= 50
                  ? '⚡ Over half claimed. Don\'t miss your chance!'
                  : '✨ Join early and save $20/year forever.'}
              </p>
            </div>
          )}

          {/* No slots remaining */}
          {remainingSlots === 0 && (
            <p className="text-xs sm:text-sm text-white/80 italic">
              All founding member slots have been claimed. Regular pricing: $99/year.
            </p>
          )}

          {/* Default message (when remainingSlots not provided) */}
          {remainingSlots === undefined && (
            <p className="text-xs sm:text-sm text-white/80">
              Save $20/year compared to regular pricing. Lock in your rate before spots run out!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
