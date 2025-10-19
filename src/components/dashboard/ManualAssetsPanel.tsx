'use client'

import ManualAssetsSection from '@/components/assets/ManualAssetsSection'

interface ManualAssetsPanelProps {
    onUpdate: () => void
}

/**
 * Accounts Panel
 * Shows all account entries: Plaid-connected accounts + manual assets
 * - All tiers can view and add manual assets
 * - Premium+ users can connect Plaid accounts (auto-sync)
 * Wraps the ManualAssetsSection component (renamed to "Accounts")
 */
export default function ManualAssetsPanel({ onUpdate }: ManualAssetsPanelProps) {
    return <ManualAssetsSection onUpdate={onUpdate} />
}
