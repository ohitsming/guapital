'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, ArrowPathIcon, ChevronDownIcon, ChevronRightIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { AddAccountDropdown } from '@/components/ui/AddAccountDropdown'
import EditAssetModal from '@/components/assets/EditAssetModal'
import { Dropdown } from '@/components/ui/Dropdown'
import { useSubscription } from '@/lib/context/SubscriptionContext'
import { recalculatePercentile } from '@/utils/percentileUtils'
import type { ManualAsset } from '@/lib/interfaces/asset'
import type { PlaidAccount } from '@/lib/interfaces/plaid'
import type { CryptoWallet, CryptoHolding } from '@/lib/interfaces/crypto'
import { formatCurrency } from '@/utils/formatters'

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
}

interface PlaidAccountWithInstitution extends PlaidAccount {
  plaid_items?: {
    institution_name: string
    sync_status: string
    last_sync_at?: string
  }
}

interface CryptoWalletWithHoldings extends CryptoWallet {
  crypto_holdings: CryptoHolding[]
}

interface UnifiedEntry {
  id: string
  name: string
  type: 'asset' | 'liability'
  value: number
  category: string
  notes?: string
  updatedAt: string
  source: 'plaid' | 'manual' | 'crypto'
  manualAsset?: ManualAsset
  plaidAccount?: PlaidAccountWithInstitution
  cryptoWallet?: CryptoWalletWithHoldings
  isExpandable?: boolean
  isExpanded?: boolean
}

export function AccountsPageContent() {
  const [assets, setAssets] = useState<ManualAsset[]>([])
  const [plaidAccounts, setPlaidAccounts] = useState<PlaidAccountWithInstitution[]>([])
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWalletWithHoldings[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingAsset, setEditingAsset] = useState<ManualAsset | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'asset' | 'liability'>('all')
  const [filterSource, setFilterSource] = useState<'all' | 'plaid' | 'manual' | 'crypto'>('all')

  const { hasAccess } = useSubscription()

  // SessionStorage cache helper (same cache as ManualAssetsSection)
  const CACHE_KEY = 'guapital_accounts_cache'
  const CACHE_DURATION = 30000 // 30 seconds

  const getCachedData = () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data
        }
      }
    } catch (err) {
      console.error('Error reading cache:', err)
    }
    return null
  }

  const setCachedData = (data: any) => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (err) {
      console.error('Error setting cache:', err)
    }
  }

  const clearCache = () => {
    try {
      sessionStorage.removeItem(CACHE_KEY)
    } catch (err) {
      console.error('Error clearing cache:', err)
    }
  }

  const fetchAssets = useCallback(async (skipCache = false) => {
    try {
      // Try to load from cache first
      if (!skipCache) {
        const cached = getCachedData()
        if (cached) {
          setAssets(cached.assets || [])
          setPlaidAccounts(cached.plaidAccounts || [])
          setCryptoWallets(cached.cryptoWallets || [])
          setIsLoading(false)
          // Fetch fresh data in background
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }
      } else {
        setIsLoading(true)
      }

      setError(null)

      // Fetch all data in parallel using Promise.allSettled
      const [assetsResult, plaidResult, cryptoResult] = await Promise.allSettled([
        fetch('/api/assets').then(res => res.json()),
        fetch('/api/plaid/accounts').then(res => res.json()),
        fetch('/api/crypto/wallets').then(res => res.json())
      ])

      // Process assets
      if (assetsResult.status === 'fulfilled' && assetsResult.value.assets) {
        setAssets(assetsResult.value.assets)
      } else if (assetsResult.status === 'rejected') {
        console.error('Error fetching assets:', assetsResult.reason)
      }

      // Process Plaid accounts
      if (plaidResult.status === 'fulfilled' && plaidResult.value.accounts) {
        setPlaidAccounts(plaidResult.value.accounts)
      } else if (plaidResult.status === 'rejected') {
        console.error('Error fetching Plaid accounts:', plaidResult.reason)
      }

      // Process crypto wallets
      if (cryptoResult.status === 'fulfilled' && cryptoResult.value.wallets) {
        setCryptoWallets(cryptoResult.value.wallets)
      } else if (cryptoResult.status === 'rejected') {
        console.error('Error fetching crypto wallets:', cryptoResult.reason)
      }

      // Cache the results
      setCachedData({
        assets: assetsResult.status === 'fulfilled' ? assetsResult.value.assets || [] : [],
        plaidAccounts: plaidResult.status === 'fulfilled' ? plaidResult.value.accounts || [] : [],
        cryptoWallets: cryptoResult.status === 'fulfilled' ? cryptoResult.value.wallets || [] : []
      })

    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const handleDeleteManualAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      return
    }

    setDeletingId(assetId)

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete asset')
      }

      setAssets(assets.filter((a) => a.id !== assetId))
      clearCache()
      // Recalculate percentile ranking after deleting account
      await recalculatePercentile()
    } catch (err: any) {
      alert(err.message || 'Failed to delete asset')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeletePlaidAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to remove this account?')) {
      return
    }

    setDeletingId(accountId)

    try {
      const response = await fetch(`/api/plaid/accounts?id=${accountId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      setPlaidAccounts(plaidAccounts.filter((a) => a.id !== accountId))
      clearCache()
      // Recalculate percentile ranking after deleting account
      await recalculatePercentile()
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteCryptoWallet = async (walletId: string) => {
    if (!confirm('Are you sure you want to remove this wallet? This action cannot be undone.')) {
      return
    }

    setDeletingId(walletId)

    try {
      const response = await fetch(`/api/crypto/wallets?id=${walletId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete wallet')
      }

      setCryptoWallets(cryptoWallets.filter((w) => w.id !== walletId))
      clearCache()
      // Recalculate percentile ranking after deleting wallet
      await recalculatePercentile()
    } catch (err: any) {
      alert(err.message || 'Failed to delete wallet')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEditSuccess = async () => {
    clearCache()
    await fetchAssets(true)
    // Recalculate percentile ranking after account changes
    await recalculatePercentile()
  }

  const handleSyncStart = () => {
    setIsSyncing(true)
  }

  const handleSyncComplete = async () => {
    clearCache()
    await fetchAssets(true)
    setIsSyncing(false)
    // Recalculate percentile ranking after syncing accounts
    await recalculatePercentile()
  }

  const handleRefresh = async () => {
    clearCache()
    await fetchAssets(true)
    // Recalculate percentile ranking after refresh
    await recalculatePercentile()
  }

  const transformPlaidToUnified = (): UnifiedEntry[] => {
    return plaidAccounts.map((account) => {
      const isLiability = account.account_type === 'credit' || account.account_type === 'loan'
      let category = account.account_subtype || account.account_type

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
      }
    })
  }

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
    }))
  }

  const transformCryptoToUnified = (): UnifiedEntry[] => {
    return cryptoWallets.map((wallet) => {
      const totalValue = wallet.crypto_holdings?.reduce((sum, holding) => sum + holding.usd_value, 0) || 0
      const hasHoldings = wallet.crypto_holdings && wallet.crypto_holdings.length > 0

      return {
        id: wallet.id,
        name: wallet.wallet_name || `${wallet.blockchain.charAt(0).toUpperCase() + wallet.blockchain.slice(1)} Wallet`,
        type: 'asset' as const,
        value: totalValue,
        category: 'crypto',
        notes: wallet.wallet_address.slice(0, 6) + '...' + wallet.wallet_address.slice(-4),
        updatedAt: wallet.last_sync_at || wallet.updated_at,
        source: 'crypto',
        cryptoWallet: wallet,
        isExpandable: hasHoldings,
        isExpanded: expandedWallets.has(wallet.id),
      }
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Combine and filter entries
  const plaidEntries = transformPlaidToUnified()
  const manualEntries = transformManualToUnified()
  const cryptoEntries = transformCryptoToUnified()
  let allEntries = [...plaidEntries, ...manualEntries, ...cryptoEntries]

  // Apply filters
  if (filterType !== 'all') {
    allEntries = allEntries.filter((entry) => entry.type === filterType)
  }

  if (filterSource !== 'all') {
    allEntries = allEntries.filter((entry) => entry.source === filterSource)
  }

  // Apply search
  if (searchQuery) {
    allEntries = allEntries.filter((entry) =>
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.notes && entry.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      CATEGORY_LABELS[entry.category]?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Calculate totals
  const totalAssets = allEntries
    .filter((e) => e.type === 'asset')
    .reduce((sum, e) => sum + e.value, 0)
  const totalLiabilities = allEntries
    .filter((e) => e.type === 'liability')
    .reduce((sum, e) => sum + e.value, 0)
  const netWorth = totalAssets - totalLiabilities

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6 lg:p-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="mb-3 sm:mb-6 lg:mb-8">
          <div className="h-6 sm:h-8 w-32 sm:w-48 bg-gray-200 rounded mb-1 sm:mb-2"></div>
          <div className="h-4 sm:h-5 w-48 sm:w-96 bg-gray-200 rounded"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 mb-3 sm:mb-6 lg:mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-md border-2 border-gray-200">
              <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded mb-2 sm:mb-3"></div>
              <div className="h-6 sm:h-8 w-24 sm:w-32 bg-gray-200 rounded mb-1 sm:mb-2"></div>
              <div className="h-3 w-16 sm:w-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Actions and Filters Skeleton */}
        <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-md border-2 border-gray-200 mb-3 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
            <div className="flex gap-2">
              <div className="h-10 flex-1 sm:w-40 bg-gray-200 rounded-lg"></div>
              <div className="h-10 flex-1 sm:w-40 bg-gray-200 rounded-lg"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-10 w-full sm:w-auto bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Accounts List Skeleton */}
        <div className="bg-white rounded-xl p-3 sm:p-6 shadow-md border-2 border-gray-200">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white border-2 border-gray-100 rounded-xl gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
                    <div className="h-4 sm:h-5 w-32 sm:w-40 bg-gray-200 rounded"></div>
                    <div className="h-5 sm:h-6 w-20 sm:w-24 bg-gray-200 rounded-lg"></div>
                    <div className="h-4 sm:h-5 w-12 sm:w-16 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-6 sm:h-8 w-24 sm:w-32 bg-gray-200 rounded mb-2 sm:mb-3"></div>
                  <div className="h-4 sm:h-5 w-36 sm:w-48 bg-gray-200 rounded mb-1 sm:mb-2"></div>
                  <div className="h-3 sm:h-4 w-28 sm:w-36 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center sm:ml-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 rounded-lg"></div>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <p className="text-red-800 font-medium text-sm sm:text-base">Error loading accounts</p>
          <p className="text-red-600 text-xs sm:text-sm mt-2">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 sm:mt-4 px-4 py-2 bg-red-600 text-white text-sm sm:text-base rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-3 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Accounts</h1>
          {isRefreshing && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-[#004D40] rounded-full animate-spin"></div>
              <span className="hidden sm:inline">Updating...</span>
            </div>
          )}
        </div>
        <p className="text-sm sm:text-base text-gray-600">Manage your connected accounts and manual assets</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 mb-3 sm:mb-6 lg:mb-8">
        <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-md border-2 border-gray-200">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Assets</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(totalAssets)}</p>
          <p className="text-xs text-gray-500 mt-1">{allEntries.filter((e) => e.type === 'asset').length} accounts</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-md border-2 border-gray-200">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Liabilities</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
          <p className="text-xs text-gray-500 mt-1">{allEntries.filter((e) => e.type === 'liability').length} accounts</p>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-md border-2 border-gray-200">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Net Worth</p>
          <p className={`text-xl sm:text-2xl font-bold ${netWorth >= 0 ? 'text-[#004D40]' : 'text-red-600'}`}>
            {formatCurrency(netWorth)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{allEntries.length} total accounts</p>
        </div>
      </div>

      {/* Actions and Filters */}
      <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 shadow-md border-2 border-gray-200 mb-3 sm:mb-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, category, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-[#004D40] text-base transition-all hover:border-gray-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Clear search"
              >
                <XMarkIcon className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>

          {/* Active Filters Indicator */}
          {(filterType !== 'all' || filterSource !== 'all' || searchQuery) && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <FunnelIcon className="h-4 w-4" />
              <span className="font-medium">
                Showing {allEntries.length} of {[...plaidEntries, ...manualEntries, ...cryptoEntries].length} accounts
              </span>
              <button
                onClick={() => {
                  setFilterType('all')
                  setFilterSource('all')
                  setSearchQuery('')
                }}
                className="ml-auto text-[#004D40] hover:text-[#00695C] font-medium transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Filters and Actions Row */}
          <div className="flex gap-2 flex-wrap">
            <Dropdown
              value={filterType}
              onChange={(value) => setFilterType(value as any)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'asset', label: 'Assets' },
                { value: 'liability', label: 'Liabilities' },
              ]}
              className="flex-1 min-w-[120px] sm:flex-initial"
            />

            <Dropdown
              value={filterSource}
              onChange={(value) => setFilterSource(value as any)}
              options={[
                { value: 'all', label: 'All Sources' },
                { value: 'plaid', label: 'Plaid' },
                { value: 'crypto', label: 'Crypto' },
                { value: 'manual', label: 'Manual' },
              ]}
              className="flex-1 min-w-[120px] sm:flex-initial"
            />

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex-shrink-0 px-3 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all flex items-center justify-center"
              title="Refresh"
            >
              <ArrowPathIcon className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex-1 min-w-[140px] sm:flex-initial">
              <AddAccountDropdown
                onAccountAdded={handleEditSuccess}
                onSyncStart={handleSyncStart}
                onSyncComplete={handleSyncComplete}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      {isSyncing ? (
        <div className="bg-white rounded-xl p-8 sm:p-12 shadow-md border-2 border-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#004D40]/20 border-t-[#004D40] rounded-full animate-spin"></div>
            </div>
            <p className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Syncing your accounts...</p>
            <p className="text-xs sm:text-sm text-gray-600">This may take a few seconds</p>
          </div>
        </div>
      ) : allEntries.length === 0 ? (
        <div className="bg-white rounded-xl p-8 sm:p-12 shadow-md border-2 border-gray-200 text-center">
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
            {searchQuery || filterType !== 'all' || filterSource !== 'all'
              ? 'No accounts match your filters'
              : 'No accounts yet'}
          </p>
          {!searchQuery && filterType === 'all' && filterSource === 'all' && (
            <div className="flex justify-center">
              <AddAccountDropdown
                onAccountAdded={handleEditSuccess}
                onSyncStart={handleSyncStart}
                onSyncComplete={handleSyncComplete}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-3 sm:p-6 shadow-md border-2 border-gray-200">
          <div className="space-y-3">
            {allEntries.map((entry) => (
              <div key={entry.id}>
                <div
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white border-2 rounded-xl hover:shadow-md transition-all gap-3 ${
                    entry.type === 'asset'
                      ? 'border-green-100 hover:border-green-200'
                      : 'border-red-100 hover:border-red-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{entry.name}</h3>
                      <span
                        className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-semibold rounded-lg border whitespace-nowrap ${
                          entry.type === 'asset'
                            ? 'text-green-700 bg-green-50 border-green-200'
                            : 'text-red-700 bg-red-50 border-red-200'
                        }`}
                      >
                        {CATEGORY_LABELS[entry.category] || entry.category}
                      </span>
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                          entry.source === 'plaid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : entry.source === 'crypto'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {entry.source === 'plaid' ? 'Plaid' : entry.source === 'crypto' ? 'Crypto' : 'Manual'}
                      </span>
                      {entry.isExpandable && (
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedWallets)
                            if (newExpanded.has(entry.id)) {
                              newExpanded.delete(entry.id)
                            } else {
                              newExpanded.add(entry.id)
                            }
                            setExpandedWallets(newExpanded)
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
                    <p
                      className={`text-xl sm:text-2xl font-bold mt-1 sm:mt-2 ${
                        entry.type === 'asset' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(entry.value)}
                    </p>
                    {entry.notes && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg inline-block break-all">
                        {entry.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">Last updated: {formatDate(entry.updatedAt)}</p>
                  </div>

                  <div className="flex items-center gap-2 sm:ml-4 self-end sm:self-center">
                    {entry.source === 'manual' && entry.manualAsset && (
                      <button
                        onClick={() => setEditingAsset(entry.manualAsset!)}
                        className="p-2 sm:p-2.5 text-gray-600 hover:text-[#004D40] hover:bg-[#004D40]/5 rounded-lg transition-all"
                        title="Edit asset"
                      >
                        <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (entry.source === 'manual') {
                          handleDeleteManualAsset(entry.id)
                        } else if (entry.source === 'crypto') {
                          handleDeleteCryptoWallet(entry.id)
                        } else {
                          handleDeletePlaidAccount(entry.id)
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
                  <div className="mt-2 p-3 sm:p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Holdings</h4>
                    <div className="space-y-2">
                      {entry.cryptoWallet.crypto_holdings
                        .sort((a, b) => b.usd_value - a.usd_value)
                        .map((holding) => (
                          <div
                            key={holding.id}
                            className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-200 gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <p className="text-sm sm:text-base font-semibold text-gray-900">{holding.token_symbol}</p>
                                <p className="text-xs sm:text-sm text-gray-600 truncate">{holding.token_name}</p>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                                {holding.balance.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 6,
                                })}{' '}
                                {holding.token_symbol}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm sm:text-base font-bold text-gray-900">{formatCurrency(holding.usd_value)}</p>
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
  )
}
