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
  const [isConnectingPlaid, setIsConnectingPlaid] = useState(false);
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
      setIsConnectingPlaid(true);
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
      {/* Loading Overlay */}
      {isConnectingPlaid && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-4 relative">
                <div className="absolute inset-0 border-4 border-[#004D40]/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#004D40] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connecting to Plaid</h3>
              <p className="text-sm text-gray-600">Please wait while we initialize the secure connection...</p>
            </div>
          </div>
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Main Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isConnectingPlaid}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#004D40] to-[#00695C] text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden xs:inline sm:inline">Add Account</span>
          <span className="xs:hidden sm:hidden">Add</span>
          <svg
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden">
            <div className="py-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const hasRequiredAccess = !item.requiresAccess || hasAccess(item.requiresAccess);
                const isLocked = item.premium && !hasRequiredAccess;

                const isLoading = item.id === 'plaid' && isConnectingPlaid;

                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    disabled={isLocked || isLoading}
                    className={`
                      w-full px-4 py-3 flex items-start gap-3 text-left transition-all duration-150
                      ${isLocked || isLoading
                        ? 'opacity-60 cursor-not-allowed bg-gray-50'
                        : 'hover:bg-[#004D40]/5 cursor-pointer'
                      }
                      ${index > 0 ? 'border-t border-gray-100' : ''}
                    `}
                  >
                    {/* Icon */}
                    <div className={`
                      p-2.5 rounded-lg flex-shrink-0 relative
                      ${isLocked || isLoading
                        ? 'bg-gray-200 text-gray-500'
                        : 'bg-[#004D40]/10 text-[#004D40]'
                      }
                    `}>
                      {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-[#004D40]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${isLocked || isLoading ? 'text-gray-600' : 'text-gray-900'}`}>
                          {isLoading ? 'Connecting...' : item.label}
                        </p>
                        {isLocked && (
                          <LockClosedIcon className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {isLoading ? 'Initializing secure connection...' : item.description}
                      </p>
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
              setIsConnectingPlaid(false);
              onSyncStart?.();
            }}
            onSuccess={() => {
              setIsConnectingPlaid(false);
              onSyncComplete?.();
              onAccountAdded();
            }}
            onExit={() => {
              setIsConnectingPlaid(false);
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
