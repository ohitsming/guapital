'use client';

import React, { useState, useEffect } from 'react';
import { TrashIcon, ArrowPathIcon, WalletIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import AddWalletButton from './AddWalletButton';
import { formatCurrency } from '@/utils/formatters';
import type { CryptoWallet, CryptoHolding } from '@/lib/interfaces/crypto';

interface WalletWithHoldings extends CryptoWallet {
  crypto_holdings: CryptoHolding[];
}

const BLOCKCHAIN_LABELS: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  base: 'Base',
  arbitrum: 'Arbitrum',
  optimism: 'Optimism',
};

const BLOCKCHAIN_COLORS: Record<string, string> = {
  ethereum: 'blue',
  polygon: 'purple',
  base: 'indigo',
  arbitrum: 'cyan',
  optimism: 'red',
};

export function WalletsList() {
  const [wallets, setWallets] = useState<WalletWithHoldings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());

  const fetchWallets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/crypto/wallets');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wallets');
      }

      setWallets(data.wallets || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleDelete = async (walletId: string) => {
    if (!confirm('Are you sure you want to remove this wallet? This action cannot be undone.')) {
      return;
    }

    setDeletingId(walletId);

    try {
      const response = await fetch(`/api/crypto/wallets?id=${walletId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete wallet');
      }

      setWallets(wallets.filter((w) => w.id !== walletId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete wallet');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSync = async (walletId: string) => {
    setSyncingId(walletId);

    try {
      const response = await fetch('/api/crypto/sync-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet_id: walletId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync wallet');
      }

      // Refresh wallets after sync
      await fetchWallets();
    } catch (err: any) {
      alert(err.message || 'Failed to sync wallet');
    } finally {
      setSyncingId(null);
    }
  };

  const toggleWalletExpanded = (walletId: string) => {
    const newExpanded = new Set(expandedWallets);
    if (newExpanded.has(walletId)) {
      newExpanded.delete(walletId);
    } else {
      newExpanded.add(walletId);
    }
    setExpandedWallets(newExpanded);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateWalletValue = (wallet: WalletWithHoldings): number => {
    return wallet.crypto_holdings.reduce((sum, holding) => sum + holding.usd_value, 0);
  };

  const totalValue = wallets.reduce((sum, wallet) => sum + calculateWalletValue(wallet), 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3">
              <div className="w-12 h-12 border-4 border-[#004D40]/20 border-t-[#004D40] rounded-full animate-spin"></div>
            </div>
            <p className="text-sm font-medium text-gray-600">Loading wallets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800 font-medium">Error loading wallets</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={fetchWallets}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <WalletIcon className="h-6 w-6 text-[#004D40]" />
              Crypto Wallets
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Track your cryptocurrency holdings across multiple chains
            </p>
          </div>
          <AddWalletButton onWalletAdded={fetchWallets} />
        </div>

        {wallets.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Crypto Value</p>
                <p className="text-2xl font-bold text-[#004D40] mt-1">{formatCurrency(totalValue)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{wallets.length} {wallets.length === 1 ? 'wallet' : 'wallets'} tracked</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wallets List */}
      {wallets.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-md border-2 border-gray-200 text-center">
          <div className="max-w-sm mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <WalletIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No crypto wallets yet</h3>
            <p className="text-gray-600 mb-6">
              Add your first crypto wallet to start tracking your digital assets
            </p>
            <AddWalletButton onWalletAdded={fetchWallets} />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map((wallet) => {
            const walletValue = calculateWalletValue(wallet);
            const isExpanded = expandedWallets.has(wallet.id);
            const hasHoldings = wallet.crypto_holdings && wallet.crypto_holdings.length > 0;
            const blockchainColor = BLOCKCHAIN_COLORS[wallet.blockchain] || 'gray';

            return (
              <div
                key={wallet.id}
                className="bg-white border-2 border-gray-200 rounded-xl hover:shadow-md transition-all overflow-hidden"
              >
                {/* Wallet Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {wallet.wallet_name || formatAddress(wallet.wallet_address)}
                        </h3>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg bg-${blockchainColor}-100 text-${blockchainColor}-700 border border-${blockchainColor}-200`}>
                          {BLOCKCHAIN_LABELS[wallet.blockchain] || wallet.blockchain}
                        </span>
                        {wallet.sync_status === 'error' && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            Sync Error
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 font-mono mb-3">
                        {wallet.wallet_name ? formatAddress(wallet.wallet_address) : wallet.wallet_address}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Value: </span>
                          <span className="font-bold text-[#004D40]">{formatCurrency(walletValue)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Assets: </span>
                          <span>{hasHoldings ? wallet.crypto_holdings.length : 0}</span>
                        </div>
                        <div>
                          <span className="font-medium">Last synced: </span>
                          <span>{formatDate(wallet.last_sync_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleSync(wallet.id)}
                        disabled={syncingId === wallet.id}
                        className="p-2 text-gray-600 hover:text-[#004D40] hover:bg-[#004D40]/5 rounded-lg transition-all disabled:opacity-50"
                        title="Sync wallet"
                      >
                        <ArrowPathIcon className={`h-5 w-5 ${syncingId === wallet.id ? 'animate-spin' : ''}`} />
                      </button>
                      {hasHoldings && (
                        <button
                          onClick={() => toggleWalletExpanded(wallet.id)}
                          className="p-2 text-gray-600 hover:text-[#004D40] hover:bg-[#004D40]/5 rounded-lg transition-all"
                          title={isExpanded ? 'Hide holdings' : 'Show holdings'}
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className="h-5 w-5" />
                          ) : (
                            <ChevronRightIcon className="h-5 w-5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(wallet.id)}
                        disabled={deletingId === wallet.id}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title="Remove wallet"
                      >
                        {deletingId === wallet.id ? (
                          <div className="h-5 w-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Holdings (Expandable) */}
                {isExpanded && hasHoldings && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Holdings</h4>
                    <div className="space-y-2">
                      {wallet.crypto_holdings
                        .sort((a, b) => b.usd_value - a.usd_value)
                        .map((holding) => (
                          <div
                            key={holding.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">{holding.token_symbol}</p>
                                <p className="text-sm text-gray-600">{holding.token_name}</p>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {holding.balance.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 6,
                                })}{' '}
                                {holding.token_symbol}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">{formatCurrency(holding.usd_value)}</p>
                              {holding.usd_price && (
                                <p className="text-xs text-gray-500">
                                  @ {formatCurrency(holding.usd_price)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Empty Holdings State */}
                {isExpanded && !hasHoldings && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6 text-center">
                    <p className="text-sm text-gray-600">No holdings found in this wallet</p>
                    <button
                      onClick={() => handleSync(wallet.id)}
                      disabled={syncingId === wallet.id}
                      className="mt-2 text-sm text-[#004D40] hover:underline font-medium"
                    >
                      Try syncing again
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
