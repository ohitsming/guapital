'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PencilIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { AddAccountDropdown } from '@/components/ui/AddAccountDropdown';
import EditAssetModal from './EditAssetModal';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import type { ManualAsset } from '@/lib/interfaces/asset';
import type { PlaidAccount } from '@/lib/interfaces/plaid';
import type { CryptoWallet, CryptoHolding } from '@/lib/interfaces/crypto';
import { formatCurrency } from '@/utils/formatters';

const CATEGORY_LABELS: Record<string, string> = {
  // Asset categories (manual)
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

  // Liability categories (manual)
  mortgage: 'Mortgage',
  personal_loan: 'Personal Loan',
  business_debt: 'Business Debt',
  credit_debt: 'Credit/IOU',
  other_debt: 'Other Debt',

  // Plaid account types - Depository
  checking: 'Checking',
  savings: 'Savings',
  hsa: 'HSA',
  cd: 'CD',
  money_market: 'Money Market',
  paypal: 'PayPal',
  prepaid: 'Prepaid',
  cash_management: 'Cash Management',
  ebt: 'EBT',

  // Plaid account types - Credit
  credit_card: 'Credit Card',

  // Plaid account types - Loan
  auto: 'Auto Loan',
  business: 'Business Loan',
  commercial: 'Commercial Loan',
  construction: 'Construction Loan',
  consumer: 'Consumer Loan',
  home_equity: 'Home Equity',
  line_of_credit: 'Line of Credit',
  loan: 'Loan',
  student: 'Student Loan',

  // Plaid account types - Investment
  '401k': '401(k)',
  '403b': '403(b)',
  '457b': '457(b)',
  '529': '529 Plan',
  brokerage: 'Brokerage',
  ira: 'IRA',
  isa: 'ISA',
  keogh: 'Keogh',
  lif: 'LIF',
  lira: 'LIRA',
  lrif: 'LRIF',
  lrsp: 'LRSP',
  mutual_fund: 'Mutual Fund',
  non_taxable_brokerage_account: 'Non-Taxable Brokerage',
  pension: 'Pension',
  plan: 'Investment Plan',
  prif: 'PRIF',
  profit_sharing_plan: 'Profit Sharing',
  rdsp: 'RDSP',
  resp: 'RESP',
  retirement: 'Retirement',
  rlif: 'RLIF',
  roth: 'Roth IRA',
  roth_401k: 'Roth 401(k)',
  rrif: 'RRIF',
  rrsp: 'RRSP',
  sarsep: 'SARSEP',
  sep_ira: 'SEP IRA',
  simple_ira: 'SIMPLE IRA',
  sipp: 'SIPP',
  stock_plan: 'Stock Plan',
  tfsa: 'TFSA',
  trust: 'Trust',
  ugma: 'UGMA',
  utma: 'UTMA',
  variable_annuity: 'Variable Annuity',
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
  onAllDataDeleted?: () => void;
  limitDisplay?: number; // Optional: limit number of accounts to display (applies to both assets and liabilities separately)
  showSeeMoreButton?: boolean; // Optional: show "See More" button
  hideCount?: boolean; // Optional: hide the count numbers next to Assets/Liabilities headings
}

const ManualAssetsSection: React.FC<ManualAssetsSectionProps> = ({
  onUpdate,
  onAllDataDeleted,
  limitDisplay,
  showSeeMoreButton = false,
  hideCount = false
}) => {
  const [assets, setAssets] = useState<ManualAsset[]>([]);
  const [plaidAccounts, setPlaidAccounts] = useState<PlaidAccountWithInstitution[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWalletWithHoldings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<ManualAsset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());

  const { hasAccess } = useSubscription();

  // SessionStorage cache helper
  const CACHE_KEY = 'guapital_accounts_cache';
  const CACHE_DURATION = 30000; // 30 seconds

  const getCachedData = () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (err) {
      console.error('Error reading cache:', err);
    }
    return null;
  };

  const setCachedData = (data: any) => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Error setting cache:', err);
    }
  };

  const clearCache = () => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  };

  const fetchAssets = useCallback(async (skipCache = false) => {
    try {
      // Try to load from cache first
      if (!skipCache) {
        const cached = getCachedData();
        if (cached) {
          setAssets(cached.assets || []);
          setPlaidAccounts(cached.plaidAccounts || []);
          setCryptoWallets(cached.cryptoWallets || []);
          setIsLoading(false);
          // Fetch fresh data in background
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
      } else {
        setIsLoading(true);
      }

      setError(null);

      // Fetch all data in parallel using Promise.allSettled for better error handling
      const [assetsResult, plaidResult, cryptoResult] = await Promise.allSettled([
        fetch('/api/assets').then(res => res.json()),
        fetch('/api/plaid/accounts').then(res => res.json()),
        fetch('/api/crypto/wallets').then(res => res.json())
      ]);

      // Process assets
      if (assetsResult.status === 'fulfilled' && assetsResult.value.assets) {
        console.log('📊 Manual assets loaded:', assetsResult.value.assets.length);
        setAssets(assetsResult.value.assets);
      } else if (assetsResult.status === 'rejected') {
        console.error('Error fetching assets:', assetsResult.reason);
      }

      // Process Plaid accounts
      if (plaidResult.status === 'fulfilled' && plaidResult.value.accounts) {
        console.log('🏦 Plaid accounts loaded:', plaidResult.value.accounts.length, plaidResult.value.accounts);
        setPlaidAccounts(plaidResult.value.accounts);
      } else if (plaidResult.status === 'rejected') {
        console.error('Error fetching Plaid accounts:', plaidResult.reason);
      }

      // Process crypto wallets
      if (cryptoResult.status === 'fulfilled' && cryptoResult.value.wallets) {
        console.log('💰 Crypto wallets loaded:', cryptoResult.value.wallets.length);
        setCryptoWallets(cryptoResult.value.wallets);
      } else if (cryptoResult.status === 'rejected') {
        console.error('Error fetching crypto wallets:', cryptoResult.reason);
      }

      // Cache the results
      setCachedData({
        assets: assetsResult.status === 'fulfilled' ? assetsResult.value.assets || [] : [],
        plaidAccounts: plaidResult.status === 'fulfilled' ? plaidResult.value.accounts || [] : [],
        cryptoWallets: cryptoResult.status === 'fulfilled' ? cryptoResult.value.wallets || [] : []
      });

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Check if all data has been deleted
  const checkIfAllDataDeleted = (
    remainingAssets: ManualAsset[],
    remainingPlaid: PlaidAccountWithInstitution[],
    remainingCrypto: CryptoWalletWithHoldings[]
  ) => {
    const hasNoData = remainingAssets.length === 0 && remainingPlaid.length === 0 && remainingCrypto.length === 0;
    if (hasNoData && onAllDataDeleted) {
      onAllDataDeleted();
    }
  };

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
      const updatedAssets = assets.filter((a) => a.id !== assetId);
      setAssets(updatedAssets);

      // Clear cache since data changed
      clearCache();

      // Check if all data is now deleted
      checkIfAllDataDeleted(updatedAssets, plaidAccounts, cryptoWallets);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Remove from local state
      const updatedPlaid = plaidAccounts.filter((a) => a.id !== accountId);
      setPlaidAccounts(updatedPlaid);

      // Clear cache since data changed
      clearCache();

      // Check if all data is now deleted
      checkIfAllDataDeleted(assets, updatedPlaid, cryptoWallets);

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
      const updatedCrypto = cryptoWallets.filter((w) => w.id !== walletId);
      setCryptoWallets(updatedCrypto);

      // Clear cache since data changed
      clearCache();

      // Check if all data is now deleted
      checkIfAllDataDeleted(assets, plaidAccounts, updatedCrypto);

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
    // Clear cache and skip cache on refetch
    clearCache();
    fetchAssets(true);

    // Notify parent to refresh net worth
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleSyncStart = () => {
    setIsSyncing(true);
  };

  const handleSyncComplete = async () => {
    // Clear cache and skip cache on refetch
    clearCache();
    await fetchAssets(true);
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

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Assets skeleton */}
        <div className="mb-4">
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 animate-pulse">
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-48 bg-gray-200 rounded"></div>
                </div>
                <div className="h-5 w-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities skeleton */}
        <div>
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 animate-pulse">
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-48 bg-gray-200 rounded"></div>
                </div>
                <div className="h-5 w-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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

  // Separate assets and liabilities first
  let assetEntries = allEntries.filter((a) => a.type === 'asset');
  let liabilityEntries = allEntries.filter((a) => a.type === 'liability');

  // Store total counts before limiting
  const totalAssetsCount = assetEntries.length;
  const totalLiabilitiesCount = liabilityEntries.length;
  const totalEntriesCount = totalAssetsCount + totalLiabilitiesCount;

  // Limit if specified
  if (limitDisplay && limitDisplay > 0) {
    assetEntries = assetEntries.slice(0, limitDisplay);
    liabilityEntries = liabilityEntries.slice(0, limitDisplay);
  }

  // Render the full section when entries exist
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border-2 border-gray-200 relative">
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

      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Accounts</h2>
          {isRefreshing && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-[#004D40] rounded-full animate-spin"></div>
              <span className="hidden sm:inline">Updating...</span>
            </div>
          )}
        </div>

        <AddAccountDropdown
          onAccountAdded={handleEditSuccess}
          onSyncStart={handleSyncStart}
          onSyncComplete={handleSyncComplete}
        />
      </div>

      {/* Empty State */}
      {allEntries.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No accounts yet</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto px-4">
            Get started by connecting your bank account, adding a crypto wallet, or manually adding an asset or liability.
          </p>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        {/* Assets Section */}
        {assetEntries.length > 0 && (
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              {hideCount ? 'Assets' : `Assets (${assetEntries.length})`}
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {assetEntries.map((entry) => (
                <div key={entry.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white border-2 border-green-100 rounded-xl hover:shadow-md hover:border-green-200 transition-all gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{entry.name}</h3>
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-semibold text-green-700 bg-green-50 rounded-lg border border-green-200 whitespace-nowrap">
                          {CATEGORY_LABELS[entry.category] || entry.category}
                        </span>
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
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
                      <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1 sm:mt-2">
                        {formatCurrency(entry.value)}
                      </p>
                      {entry.notes && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg inline-block break-all">
                          {entry.notes}
                        </p>
                      )}
                      {/* Show frozen warning for Plaid accounts without Premium access */}
                      {entry.source === 'plaid' && !hasAccess('plaidSync') ? (
                        <p className="text-xs text-orange-600 font-medium mt-1.5 sm:mt-2 bg-orange-50 px-2 py-1 rounded inline-block">
                          Last synced: {formatDate(entry.updatedAt)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                          Last updated: {formatDate(entry.updatedAt)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 sm:ml-4 self-end sm:self-center">
                      {/* Edit button only for manual entries */}
                      {entry.source === 'manual' && entry.manualAsset && (
                        <button
                          onClick={() => setEditingAsset(entry.manualAsset!)}
                          className="p-2 sm:p-2.5 text-gray-600 hover:text-[#004D40] hover:bg-[#004D40]/5 rounded-lg transition-all"
                          title="Edit asset"
                        >
                          <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
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
                        className="p-2 sm:p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title={entry.source === 'manual' ? 'Delete asset' : entry.source === 'crypto' ? 'Remove wallet' : 'Remove account'}
                      >
                        {deletingId === entry.id ? (
                          <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                        ) : (
                          <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
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
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              {hideCount ? 'Liabilities' : `Liabilities (${liabilityEntries.length})`}
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {liabilityEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white border-2 border-red-100 rounded-xl hover:shadow-md hover:border-red-200 transition-all gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{entry.name}</h3>
                      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-semibold text-red-700 bg-red-50 rounded-lg border border-red-200 whitespace-nowrap">
                        {CATEGORY_LABELS[entry.category] || entry.category}
                      </span>
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
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
                    <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1 sm:mt-2">
                      {formatCurrency(entry.value)}
                    </p>
                    {entry.notes && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg inline-block break-all">
                        {entry.notes}
                      </p>
                    )}
                    {/* Show frozen warning for Plaid accounts without Premium access */}
                    {entry.source === 'plaid' && !hasAccess('plaidSync') ? (
                      <p className="text-xs text-orange-600 font-medium mt-1.5 sm:mt-2 bg-orange-50 px-2 py-1 rounded inline-block">
                        ⚠️ Last synced: {formatDate(entry.updatedAt)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                        Last updated: {formatDate(entry.updatedAt)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:ml-4 self-end sm:self-center">
                    {/* Edit button only for manual entries */}
                    {entry.source === 'manual' && entry.manualAsset && (
                      <button
                        onClick={() => setEditingAsset(entry.manualAsset!)}
                        className="p-2 sm:p-2.5 text-gray-600 hover:text-[#004D40] hover:bg-[#004D40]/5 rounded-lg transition-all"
                        title="Edit liability"
                      >
                        <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    )}
                    {/* Delete button for all entries */}
                    <button
                      onClick={() => entry.source === 'manual' ? handleDeleteManualAsset(entry.id) : handleDeletePlaidAccount(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-2 sm:p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title={entry.source === 'manual' ? 'Delete liability' : 'Remove account'}
                    >
                      {deletingId === entry.id ? (
                        <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                      ) : (
                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* See More Button */}
      {showSeeMoreButton && limitDisplay && (totalAssetsCount > limitDisplay || totalLiabilitiesCount > limitDisplay) && (
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
          <Link
            href="/dashboard/accounts"
            className="block w-full text-center py-2.5 sm:py-3 px-3 sm:px-4 bg-[#004D40] hover:bg-[#00695C] text-white font-semibold text-sm sm:text-base rounded-lg transition-all shadow-sm hover:shadow-md group"
          >
            <span>View All {totalEntriesCount} Accounts</span>
            <svg className="inline-block ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

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
