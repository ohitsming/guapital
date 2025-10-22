'use client'

import ManualAssetsSection from '@/components/assets/ManualAssetsSection'

interface ManualAssetsPanelProps {
    onUpdate: () => void
    onAllDataDeleted?: () => void
    limitDisplay?: number // Optional: limit number of accounts to display
    showSeeMoreButton?: boolean // Optional: show "See More" button
    hideCount?: boolean // Optional: hide the count numbers
}

/**
 * Accounts Panel
 * Shows all account entries: Plaid-connected accounts + manual assets
 * - All tiers can view and add manual assets
 * - Premium+ users can connect Plaid accounts (auto-sync)
 * Wraps the ManualAssetsSection component (renamed to "Accounts")
 */
export default function ManualAssetsPanel({ onUpdate, onAllDataDeleted, limitDisplay, showSeeMoreButton, hideCount }: ManualAssetsPanelProps) {
    return (
        <ManualAssetsSection
            onUpdate={onUpdate}
            onAllDataDeleted={onAllDataDeleted}
            limitDisplay={limitDisplay}
            showSeeMoreButton={showSeeMoreButton}
            hideCount={hideCount}
        />
    )
}
