'use client';

import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import AddAssetButton from './AddAssetButton';
import EditAssetModal from './EditAssetModal';
import type { ManualAsset } from '@/lib/interfaces/asset';

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

interface ManualAssetsSectionProps {
  onUpdate?: () => void;
}

const ManualAssetsSection: React.FC<ManualAssetsSectionProps> = ({ onUpdate }) => {
  const [assets, setAssets] = useState<ManualAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<ManualAsset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/assets');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch assets');
      }

      setAssets(data.assets || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleDelete = async (assetId: string) => {
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

  const handleEditSuccess = () => {
    fetchAssets();

    // Notify parent to refresh net worth
    if (onUpdate) {
      onUpdate();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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

  // Don't render the section if there are no assets
  if (assets.length === 0) {
    return null;
  }

  // Don't render if there's an error
  if (error) {
    return null;
  }

  // Separate assets and liabilities
  const assetEntries = assets.filter((a) => a.entry_type === 'asset');
  const liabilityEntries = assets.filter((a) => a.entry_type === 'liability');

  // Render the full section when assets exist
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Manual Entries</h2>
        <AddAssetButton onAssetAdded={handleEditSuccess} />
      </div>

      <div className="space-y-6">
        {/* Assets Section */}
        {assetEntries.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-lg">📈</span>
              Assets ({assetEntries.length})
            </h3>
            <div className="space-y-3">
              {assetEntries.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-4 bg-white border-2 border-green-100 rounded-xl hover:shadow-md hover:border-green-200 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-gray-900">{asset.asset_name}</h3>
                      <span className="px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 rounded-lg border border-green-200">
                        {CATEGORY_LABELS[asset.category] || asset.category}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {formatCurrency(asset.current_value)}
                    </p>
                    {asset.notes && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                        {asset.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Last updated: {formatDate(asset.updated_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingAsset(asset)}
                      className="p-2.5 text-gray-600 hover:text-[#004D40] hover:bg-[#004D40]/5 rounded-lg transition-all"
                      title="Edit asset"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      disabled={deletingId === asset.id}
                      className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title="Delete asset"
                    >
                      {deletingId === asset.id ? (
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
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-lg">📉</span>
              Liabilities ({liabilityEntries.length})
            </h3>
            <div className="space-y-3">
              {liabilityEntries.map((liability) => (
                <div
                  key={liability.id}
                  className="flex items-center justify-between p-4 bg-white border-2 border-red-100 rounded-xl hover:shadow-md hover:border-red-200 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-gray-900">{liability.asset_name}</h3>
                      <span className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 rounded-lg border border-red-200">
                        {CATEGORY_LABELS[liability.category] || liability.category}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-red-600 mt-2">
                      {formatCurrency(liability.current_value)}
                    </p>
                    {liability.notes && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                        {liability.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Last updated: {formatDate(liability.updated_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingAsset(liability)}
                      className="p-2.5 text-gray-600 hover:text-[#004D40] hover:bg-[#004D40]/5 rounded-lg transition-all"
                      title="Edit liability"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(liability.id)}
                      disabled={deletingId === liability.id}
                      className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title="Delete liability"
                    >
                      {deletingId === liability.id ? (
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
