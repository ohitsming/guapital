'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, BanknotesIcon, WalletIcon, HomeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import PlaidLinkButton from '@/components/plaid/PlaidLinkButton';
import AddWalletModal from '@/components/crypto/AddWalletModal';
import AddAssetModal from '@/components/assets/AddAssetModal';

interface AddAccountDropdownProps {
  onAccountAdded: () => void;
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
}

export function AddAccountDropdown({ onAccountAdded, onSyncStart, onSyncComplete }: AddAccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { hasAccess } = useSubscription();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const plaidButtonRef = useRef<HTMLDivElement>(null);

  const handlePlaidClick = () => {
    if (hasAccess('plaidSync')) {
      setIsOpen(false);
      // Trigger the Plaid button click
      setTimeout(() => {
        const button = plaidButtonRef.current?.querySelector('button');
        if (button) {
          button.click();
        }
      }, 100);
    }
  };

  const handleWalletClick = () => {
    setShowWalletModal(true);
    setIsOpen(false);
  };

  const handleAssetClick = () => {
    setShowAssetModal(true);
    setIsOpen(false);
  };

  const menuItems = [
    {
      id: 'plaid',
      icon: BanknotesIcon,
      label: 'Connect Bank Account',
      description: 'Auto-sync via Plaid',
      onClick: handlePlaidClick,
      requiresAccess: 'plaidSync' as const,
      premium: true,
    },
    {
      id: 'crypto',
      icon: WalletIcon,
      label: 'Add Crypto Wallet',
      description: 'Track blockchain assets',
      onClick: handleWalletClick,
      requiresAccess: null,
      premium: false,
    },
    {
      id: 'manual',
      icon: HomeIcon,
      label: 'Add Manual Asset',
      description: 'Real estate, vehicles, etc.',
      onClick: handleAssetClick,
      requiresAccess: null,
      premium: false,
    },
  ];

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Main Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#004D40] to-[#00695C] text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
        >
          <PlusIcon className="h-5 w-5" />
          Add Account
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden">
            <div className="py-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const hasRequiredAccess = !item.requiresAccess || hasAccess(item.requiresAccess);
                const isLocked = item.premium && !hasRequiredAccess;

                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    disabled={isLocked}
                    className={`
                      w-full px-4 py-3 flex items-start gap-3 text-left transition-all duration-150
                      ${isLocked
                        ? 'opacity-60 cursor-not-allowed bg-gray-50'
                        : 'hover:bg-[#004D40]/5 cursor-pointer'
                      }
                      ${index > 0 ? 'border-t border-gray-100' : ''}
                    `}
                  >
                    {/* Icon */}
                    <div className={`
                      p-2.5 rounded-lg flex-shrink-0
                      ${isLocked
                        ? 'bg-gray-200 text-gray-500'
                        : 'bg-[#004D40]/10 text-[#004D40]'
                      }
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${isLocked ? 'text-gray-600' : 'text-gray-900'}`}>
                          {item.label}
                        </p>
                        {isLocked && (
                          <LockClosedIcon className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                      {isLocked && (
                        <p className="text-xs text-[#FFC107] font-medium mt-1">Premium+ required</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Plaid Link (uses its own modal/flow) - Always rendered but hidden */}
      {hasAccess('plaidSync') && (
        <div ref={plaidButtonRef} className="hidden">
          <PlaidLinkButton
            onSyncStart={() => {
              onSyncStart?.();
            }}
            onSuccess={() => {
              onSyncComplete?.();
              onAccountAdded();
            }}
          />
        </div>
      )}

      {/* Crypto Wallet Modal */}
      <AddWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={() => {
          onAccountAdded();
          setShowWalletModal(false);
        }}
      />

      {/* Manual Asset Modal */}
      <AddAssetModal
        isOpen={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        onSuccess={() => {
          onAccountAdded();
          setShowAssetModal(false);
        }}
      />
    </>
  );
}
