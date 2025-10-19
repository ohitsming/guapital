'use client';

import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import AddAssetButton from './AddAssetButton';
import EditAssetModal from './EditAssetModal';
import PlaidLinkButton from '@/components/plaid/PlaidLinkButton';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import type { ManualAsset } from '@/lib/interfaces/asset';
import type { PlaidAccount } from '@/lib/interfaces/plaid';
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

interface UnifiedEntry {
  id: string;
  name: string;
  type: 'asset' | 'liability';
  value: number;
  category: string;
  notes?: string;
  updatedAt: string;
  source: 'plaid' | 'manual';
  // For manual assets
  manualAsset?: ManualAsset;
  // For Plaid accounts
  plaidAccount?: PlaidAccountWithInstitution;
}

interface ManualAssetsSectionProps {
  onUpdate?: () => void;
}

const ManualAssetsSection: React.FC<ManualAssetsSectionProps> = ({ onUpdate }) => {
  const [assets, setAssets] = useState<ManualAsset[]>([]);
  const [plaidAccounts, setPlaidAccounts] = useState<PlaidAccountWithInstitution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<ManualAsset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

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

  const handleEditSuccess = () => {
    fetchAssets();

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

  // Combine Plaid and manual entries
  const plaidEntries = transformPlaidToUnified();
  const manualEntries = transformManualToUnified();
  const allEntries = [...plaidEntries, ...manualEntries];

  // Don't render the section if there are no entries at all
  if (allEntries.length === 0) {
    return null;
  }

  // Separate assets and liabilities
  const assetEntries = allEntries.filter((a) => a.type === 'asset');
  const liabilityEntries = allEntries.filter((a) => a.type === 'liability');

  // Render the full section when entries exist
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Accounts</h2>
        <div className="flex items-center gap-2">
          {hasAccess('plaidSync') && (
            <PlaidLinkButton onSuccess={fetchAssets} />
          )}
          <AddAssetButton onAssetAdded={handleEditSuccess} />
        </div>
      </div>

      <div className="space-y-6">
        {/* Assets Section */}
        {assetEntries.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Assets ({assetEntries.length})
            </h3>
            <div className="space-y-3">
              {assetEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-white border-2 border-green-100 rounded-xl hover:shadow-md hover:border-green-200 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">{entry.name}</h3>
                      <span className="px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 rounded-lg border border-green-200">
                        {CATEGORY_LABELS[entry.category] || entry.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        entry.source === 'plaid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {entry.source === 'plaid' ? 'Plaid' : 'Manual'}
                      </span>
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
                      onClick={() => entry.source === 'manual' ? handleDeleteManualAsset(entry.id) : handleDeletePlaidAccount(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title={entry.source === 'manual' ? 'Delete asset' : 'Remove account'}
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
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {entry.source === 'plaid' ? 'Plaid' : 'Manual'}
                      </span>
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
          isOpen={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          onSuccess={handleEditSuccess}
          asset={editingAsset}
        />
      )}
    </div>
  );
};

export default ManualAssetsSection;
