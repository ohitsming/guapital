/**
 * Account interfaces for both manual and Plaid-synced accounts
 */

export type AccountType = 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan'

export interface ManualAccount {
    id: string
    user_id: string
    name: string
    account_type: AccountType
    current_balance: number
    institution_name?: string
    notes?: string
    created_at: string
    updated_at: string
}

export interface PlaidAccount {
    id: string
    user_id: string
    plaid_account_id: string
    plaid_item_id: string
    name: string
    official_name?: string
    type: string
    subtype?: string
    current_balance: number
    available_balance?: number
    currency_code: string
    created_at: string
    updated_at: string
}

/**
 * Unified account interface for displaying both manual and Plaid accounts together
 */
export interface UnifiedAccount {
    id: string
    name: string
    officialName?: string
    type: string
    balance: number
    availableBalance?: number
    institution?: string
    source: 'manual' | 'plaid'
    lastUpdated: string
    // For Plaid accounts
    plaidAccountId?: string
    plaidItemId?: string
    currencyCode?: string
    // For manual accounts
    notes?: string
}

/**
 * Form data for creating/updating manual accounts
 */
export interface ManualAccountFormData {
    name: string
    account_type: AccountType
    current_balance: number
    institution_name?: string
    notes?: string
}
