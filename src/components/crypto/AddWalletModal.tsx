'use client';

import React, { useState } from 'react';
import Modal from '@/components/Modal';
import {
  CubeIcon,
  Square3Stack3DIcon,
  CircleStackIcon,
  BoltIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Blockchain = 'ethereum' | 'polygon' | 'base' | 'arbitrum' | 'optimism';

interface BlockchainConfig {
  value: Blockchain;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const BLOCKCHAINS: BlockchainConfig[] = [
  {
    value: 'ethereum',
    label: 'Ethereum',
    icon: CubeIcon,
    description: 'Mainnet (ETH)',
    color: 'blue',
  },
  {
    value: 'polygon',
    label: 'Polygon',
    icon: Square3Stack3DIcon,
    description: 'MATIC network',
    color: 'purple',
  },
  {
    value: 'base',
    label: 'Base',
    icon: CircleStackIcon,
    description: 'Coinbase L2',
    color: 'indigo',
  },
  {
    value: 'arbitrum',
    label: 'Arbitrum',
    icon: BoltIcon,
    description: 'ARB network',
    color: 'cyan',
  },
  {
    value: 'optimism',
    label: 'Optimism',
    icon: RocketLaunchIcon,
    description: 'OP network',
    color: 'red',
  },
];

interface FormData {
  wallet_address: string;
  wallet_name: string;
  blockchain: Blockchain;
}

const AddWalletModal: React.FC<AddWalletModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    wallet_address: '',
    wallet_name: '',
    blockchain: 'ethereum',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAddress = (address: string): boolean => {
    // Basic Ethereum address validation (0x followed by 40 hex characters)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate wallet address
    if (!validateAddress(formData.wallet_address)) {
      setError('Invalid wallet address. Must be a valid Ethereum address (0x...)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/crypto/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add wallet');
      }

      // Trigger sync for the newly added wallet
      try {
        console.log('Triggering sync for wallet:', data.wallet.id);
        const syncResponse = await fetch('/api/crypto/sync-wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ wallet_id: data.wallet.id }),
        });

        if (!syncResponse.ok) {
          const syncError = await syncResponse.json();
          console.error('Sync error:', syncError);
        } else {
          const syncResult = await syncResponse.json();
          console.log('Sync successful:', syncResult);
        }
      } catch (syncError) {
        console.error('Failed to sync wallet:', syncError);
        // Don't fail the whole operation if sync fails
      }

      // Reset form
      setFormData({
        wallet_address: '',
        wallet_name: '',
        blockchain: 'ethereum',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      setFormData({
        wallet_address: '',
        wallet_name: '',
        blockchain: 'ethereum',
      });
      onClose();
    }
  };

  const modalFooter = (
    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={handleClose}
        disabled={isSubmitting}
        className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200
                   rounded-xl hover:bg-gray-50 hover:border-gray-300
                   focus:outline-none focus:ring-4 focus:ring-gray-200/50
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="add-wallet-form"
        disabled={isSubmitting}
        className="px-6 py-2.5 text-sm font-semibold text-white
                   bg-gradient-to-r from-[#004D40] to-[#00695C]
                   border-2 border-transparent rounded-xl
                   hover:shadow-lg hover:scale-105
                   focus:outline-none focus:ring-4 focus:ring-[#004D40]/30
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                   transition-all duration-200 shadow-md"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Adding Wallet...
          </span>
        ) : (
          'Add Wallet'
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Crypto Wallet"
      footer={modalFooter}
    >
      <form id="add-wallet-form" onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-r-lg shadow-sm">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Wallet Address */}
        <div className="group">
          <label htmlFor="wallet_address" className="block text-sm font-semibold text-gray-900 mb-2">
            Wallet Address <span className="text-[#FFC107]">*</span>
          </label>
          <input
            id="wallet_address"
            type="text"
            required
            value={formData.wallet_address}
            onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value.trim() })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200
                       focus:outline-none focus:border-[#004D40] focus:ring-4 focus:ring-[#004D40]/10
                       hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed
                       placeholder:text-gray-400 font-mono text-sm"
            placeholder="0x..."
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-2">
            Enter your Ethereum-compatible wallet address (starts with 0x)
          </p>
        </div>

        {/* Wallet Name (Optional) */}
        <div className="group">
          <label htmlFor="wallet_name" className="block text-sm font-semibold text-gray-900 mb-2">
            Wallet Name <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            id="wallet_name"
            type="text"
            value={formData.wallet_name}
            onChange={(e) => setFormData({ ...formData, wallet_name: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200
                       focus:outline-none focus:border-[#004D40] focus:ring-4 focus:ring-[#004D40]/10
                       hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed
                       placeholder:text-gray-400"
            placeholder="e.g., Main Wallet, MetaMask, Coinbase"
            disabled={isSubmitting}
          />
        </div>

        {/* Blockchain Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Blockchain <span className="text-[#FFC107]">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {BLOCKCHAINS.map((chain) => {
              const Icon = chain.icon;
              const isSelected = formData.blockchain === chain.value;
              return (
                <button
                  key={chain.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, blockchain: chain.value })}
                  disabled={isSubmitting}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${
                      isSelected
                        ? 'border-[#004D40] bg-[#004D40]/5 shadow-md'
                        : 'border-gray-200 hover:border-[#004D40]/40 hover:bg-gray-50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                        p-2 rounded-lg transition-colors
                        ${isSelected ? 'bg-[#004D40] text-white' : 'bg-gray-100 text-gray-600'}
                      `}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-[#004D40]' : 'text-gray-900'}`}>
                        {chain.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{chain.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 rounded-full bg-[#FFC107]"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong className="font-semibold">Read-only tracking.</strong> We only read your wallet balances. We never ask for private keys or seed phrases.
              </p>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddWalletModal;
