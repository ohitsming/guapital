'use client';

import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { AddAccountDropdown } from '@/components/ui/AddAccountDropdown';
import EditAssetModal from './EditAssetModal';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import type { ManualAsset } from '@/lib/interfaces/asset';
import type { PlaidAccount } from '@/lib/interfaces/plaid';
import type { CryptoWallet, CryptoHolding } from '@/lib/interfaces/crypto';
import { formatCurrency } from '@/utils/formatters';

const CATEGORY_LABELS: Record<string, string> = {
  // Asset categories
  real_estate: 'Real Estate',
  vehicle: 'Vehicle',
  private_equity: 'Private Equity',
  collectibles: 'Collectibles',
  cash: 'Cash',
  investment: 'Investment',
  private_stock: 'Private Stock',
  bonds: 'Bonds',
  p2p_lending: 'P2P Lending',
  crypto: 'Cryptocurrency',
  other: 'Other Assets',
  // Liability categories
  mortgage: 'Mortgage',
  personal_loan: 'Personal Loan',
  business_debt: 'Business Debt',
  credit_debt: 'Credit/IOU',
  other_debt: 'Other Debt',
};

interface PlaidAccountWithInstitution extends PlaidAccount {
  plaid_items?: {
    institution_name: string;
    sync_status: string;
    last_sync_at?: string;
  };
}

interface CryptoWalletWithHoldings extends CryptoWallet {
  crypto_holdings: CryptoHolding[];
}

interface UnifiedEntry {
  id: string;
  name: string;
  type: 'asset' | 'liability';
  value: number;
  category: string;
  notes?: string;
  updatedAt: string;
  source: 'plaid' | 'manual' | 'crypto';
  // For manual assets
  manualAsset?: ManualAsset;
  // For Plaid accounts
  plaidAccount?: PlaidAccountWithInstitution;
  // For crypto wallets
  cryptoWallet?: CryptoWalletWithHoldings;
  // For expandable crypto holdings
  isExpandable?: boolean;
  isExpanded?: boolean;
}

interface ManualAssetsSectionProps {
  onUpdate?: () => void;
}

const ManualAssetsSection: React.FC<ManualAssetsSectionProps> = ({ onUpdate }) => {
  const [assets, setAssets] = useState<ManualAsset[]>([]);
  const [plaidAccounts, setPlaidAccounts] = useState<PlaidAccountWithInstitution[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWalletWithHoldings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<ManualAsset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());

  const { hasAccess } = useSubscription();

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch manual assets
      const assetsResponse = await fetch('/api/assets');
      const assetsData = await assetsResponse.json();

      if (!assetsResponse.ok) {
        throw new Error(assetsData.error || 'Failed to fetch assets');
      }

      setAssets(assetsData.assets || []);

      // Fetch Plaid accounts if user has Premium+ access
      if (hasAccess('plaidSync')) {
        try {
          const plaidResponse = await fetch('/api/plaid/accounts');
          if (plaidResponse.ok) {
            const plaidData = await plaidResponse.json();
            setPlaidAccounts(plaidData.accounts || []);
          }
        } catch (err) {
          console.error('Error fetching Plaid accounts:', err);
          // Don't fail the whole fetch if Plaid fails
        }
      }

      // Fetch crypto wallets (available to all tiers)
      try {
        const cryptoResponse = await fetch('/api/crypto/wallets');
        if (cryptoResponse.ok) {
          const cryptoData = await cryptoResponse.json();
          setCryptoWallets(cryptoData.wallets || []);
        }
      } catch (err) {
        console.error('Error fetching crypto wallets:', err);
        // Don't fail the whole fetch if crypto fails
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

  const handleDeleteManualAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      return;
    }

    setDeletingId(assetId);

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete asset');
      }

      // Remove from local state
      setAssets(assets.filter((a) => a.id !== assetId));

      // Notify parent to refresh net worth
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete asset');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeletePlaidAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to remove this account?')) {
      return;
    }

    setDeletingId(accountId);

    try {
      const response = await fetch(`/api/plaid/accounts?id=${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Remove from local state
      setPlaidAccounts(plaidAccounts.filter((a) => a.id !== accountId));

      // Notify parent to refresh net worth
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCryptoWallet = async (walletId: string) => {
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

      // Remove from local state
      setCryptoWallets(cryptoWallets.filter((w) => w.id !== walletId));

      // Notify parent to refresh net worth
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete wallet');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSuccess = () => {
    fetchAssets();

    // Notify parent to refresh net worth
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleSyncStart = () => {
    setIsSyncing(true);
  };

  const handleSyncComplete = async () => {
    await fetchAssets();
    setIsSyncing(false);

    // Notify parent to refresh net worth
    if (onUpdate) {
      onUpdate();
    }
  };

  // Transform Plaid accounts into unified entries
  const transformPlaidToUnified = (): UnifiedEntry[] => {
    return plaidAccounts.map((account) => {
      // Determine if it's an asset or liability
      const isLiability = account.account_type === 'credit' || account.account_type === 'loan';

      // Map Plaid account type to category
      let category = account.account_subtype || account.account_type;

      return {
        id: account.id,
        name: account.account_name,
        type: isLiability ? 'liability' : 'asset',
        value: Math.abs(account.current_balance),
        category,
        notes: account.plaid_items?.institution_name,
        updatedAt: account.plaid_items?.last_sync_at || account.updated_at,
        source: 'plaid',
        plaidAccount: account,
      };
    });
  };

  // Transform manual assets into unified entries
  const transformManualToUnified = (): UnifiedEntry[] => {
    return assets.map((asset) => ({
      id: asset.id,
      name: asset.asset_name,
      type: asset.entry_type,
      value: asset.current_value,
      category: asset.category,
      notes: asset.notes,
      updatedAt: asset.updated_at,
      source: 'manual',
      manualAsset: asset,
    }));
  };

  // Transform crypto wallets into unified entries
  const transformCryptoToUnified = (): UnifiedEntry[] => {
    return cryptoWallets.map((wallet) => {
      // Calculate total wallet value from holdings
      const totalValue = wallet.crypto_holdings?.reduce((sum, holding) => sum + holding.usd_value, 0) || 0;
      const hasHoldings = wallet.crypto_holdings && wallet.crypto_holdings.length > 0;

      return {
        id: wallet.id,
        name: wallet.wallet_name || `${wallet.blockchain.charAt(0).toUpperCase() + wallet.blockchain.slice(1)} Wallet`,
        type: 'asset',
        value: totalValue,
        category: 'crypto',
        notes: wallet.wallet_address.slice(0, 6) + '...' + wallet.wallet_address.slice(-4),
        updatedAt: wallet.last_sync_at || wallet.updated_at,
        source: 'crypto',
        cryptoWallet: wallet,
        isExpandable: hasHoldings,
        isExpanded: expandedWallets.has(wallet.id),
      };
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // Don't render if there's an error
  if (error) {
    return null;
  }

  // Combine Plaid, manual, and crypto entries
  const plaidEntries = transformPlaidToUnified();
  const manualEntries = transformManualToUnified();
  const cryptoEntries = transformCryptoToUnified();
  const allEntries = [...plaidEntries, ...manualEntries, ...cryptoEntries];

  // Don't render the section if there are no entries at all
  if (allEntries.length === 0) {
    return null;
  }

  // Separate assets and liabilities
  const assetEntries = allEntries.filter((a) => a.type === 'asset');
  const liabilityEntries = allEntries.filter((a) => a.type === 'liability');

  // Render the full section when entries exist
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200 relative">
      {/* Syncing Overlay */}
      {isSyncing && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <div className="w-16 h-16 border-4 border-[#004D40]/20 border-t-[#004D40] rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-1">Syncing your accounts...</p>
            <p className="text-sm text-gray-600">This may take a few seconds</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Accounts</h2>
        <AddAccountDropdown
          onAccountAdded={handleEditSuccess}
          onSyncStart={handleSyncStart}
          onSyncComplete={handleSyncComplete}
        />
      </div>

      <div className="space-y-6 max-h-[500px] overflow-y-auto">
        {/* Assets Section */}
        {assetEntries.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Assets ({assetEntries.length})
            </h3>
            <div className="space-y-3">
              {assetEntries.map((entry) => (
                <div key={entry.id}>
                  <div className="flex items-center justify-between p-4 bg-white border-2 border-green-100 rounded-xl hover:shadow-md hover:border-green-200 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">{entry.name}</h3>
                        <span className="px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 rounded-lg border border-green-200">
                          {CATEGORY_LABELS[entry.category] || entry.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          entry.source === 'plaid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : entry.source === 'crypto'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {entry.source === 'plaid' ? 'Plaid' : entry.source === 'crypto' ? 'Crypto' : 'Manual'}
                        </span>
                        {entry.isExpandable && (
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedWallets);
                              if (newExpanded.has(entry.id)) {
                                newExpanded.delete(entry.id);
                              } else {
                                newExpanded.add(entry.id);
                              }
                              setExpandedWallets(newExpanded);
                            }}
                            className="p-1 hover:bg-gray-100 rounded transition-all"
                          >
                            {entry.isExpanded ? (
                              <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        {formatCurrency(entry.value)}
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                          {entry.notes}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Last updated: {formatDate(entry.updatedAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Edit button only for manual entries */}
                      {entry.source === 'manual' && entry.manualAsset && (
                        <button
                          onClick={() => setEditingAsset(entry.manualAsset!)}
                          className="p-2.5 text-gray-600 hover:text-[#004D40] hover:bg-[#004D40]/5 rounded-lg transition-all"
                          title="Edit asset"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      )}
                      {/* Delete button for all entries */}
                      <button
                        onClick={() => {
                          if (entry.source === 'manual') {
                            handleDeleteManualAsset(entry.id);
                          } else if (entry.source === 'crypto') {
                            handleDeleteCryptoWallet(entry.id);
                          } else {
                            handleDeletePlaidAccount(entry.id);
                          }
                        }}
                        disabled={deletingId === entry.id}
                        className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title={entry.source === 'manual' ? 'Delete asset' : entry.source === 'crypto' ? 'Remove wallet' : 'Remove account'}
                      >
                        {deletingId === entry.id ? (
                          <div className="h-5 w-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                        ) : (
                          <TrashIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Crypto Holdings */}
                  {entry.isExpanded && entry.cryptoWallet && entry.cryptoWallet.crypto_holdings && entry.cryptoWallet.crypto_holdings.length > 0 && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Holdings</h4>
                      <div className="space-y-2">
                        {entry.cryptoWallet.crypto_holdings
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liabilities Section */}
        {liabilityEntries.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Liabilities ({liabilityEntries.length})
            </h3>
            <div className="space-y-3">
              {liabilityEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-white border-2 border-red-100 rounded-xl hover:shadow-md hover:border-red-200 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">{entry.name}</h3>
                      <span className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 rounded-lg border border-red-200">
                        {CATEGORY_LABELS[entry.category] || entry.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        entry.source === 'plaid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : entry.source === 'crypto'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {entry.source === 'plaid' ? 'Plaid' : entry.source === 'crypto' ? 'Crypto' : 'Manual'}
                      </span>
                      {entry.isExpandable && (
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedWallets);
                            if (newExpanded.has(entry.id)) {
                              newExpanded.delete(entry.id);
                            } else {
                              newExpanded.add(entry.id);
                            }
                            setExpandedWallets(newExpanded);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-all"
                        >
                          {entry.isExpanded ? (
                            <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-red-600 mt-2">
                      {formatCurrency(entry.value)}
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                        {entry.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Last updated: {formatDate(entry.updatedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Edit button only for manual entries */}
                    {entry.source === 'manual' && entry.manualAsset && (
                      <button
                        onClick={() => setEditingAsset(entry.manualAsset!)}
                        className="p-2.5 text-gray-600 hover:text-[#004D40] hover:bg-[#004D40]/5 rounded-lg transition-all"
                        title="Edit liability"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    )}
                    {/* Delete button for all entries */}
                    <button
                      onClick={() => entry.source === 'manual' ? handleDeleteManualAsset(entry.id) : handleDeletePlaidAccount(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title={entry.source === 'manual' ? 'Delete liability' : 'Remove account'}
                    >
                      {deletingId === entry.id ? (
                        <div className="h-5 w-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                      ) : (
                        <TrashIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingAsset && (
        <EditAssetModal
          isOpen={true}
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default ManualAssetsSection;
