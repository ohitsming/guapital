'use client'

import { useState, useEffect } from 'react'
import type { PlaidAccount } from '@/lib/interfaces/plaid'
import { formatCurrency } from '@/utils/formatters'
import { TrashIcon } from '@heroicons/react/24/outline'

interface AccountWithInstitution extends PlaidAccount {
    plaid_items?: {
        institution_name: string
        sync_status: string
        last_sync_at?: string
    }
}

export default function AccountsList() {
    const [accounts, setAccounts] = useState<AccountWithInstitution[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAccounts()
    }, [])

    const fetchAccounts = async () => {
        try {
            const response = await fetch('/api/plaid/accounts')
            if (!response.ok) {
                throw new Error('Failed to fetch accounts')
            }
            const data = await response.json()
            setAccounts(data.accounts || [])
        } catch (error) {
            console.error('Error fetching accounts:', error)
        } finally {
            setLoading(false)
        }
    }

    const deleteAccount = async (accountId: string) => {
        if (!confirm('Are you sure you want to remove this account?')) {
            return
        }

        try {
            const response = await fetch(`/api/plaid/accounts?id=${accountId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const data = await response.json()

                if (response.status === 404) {
                    alert(data.error || 'Account not found. It may have already been deleted.')
                    await fetchAccounts()
                    return
                }

                throw new Error(data.error || 'Failed to delete account')
            }

            const data = await response.json()
            alert(data.message || 'Account removed successfully')
            await fetchAccounts()
        } catch (error) {
            console.error('Error deleting account:', error)
            alert('Failed to delete account. Please try again.')
        }
    }

    const getAccountTypeLabel = (type: string) => {
        return type
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    const getAccountTypeColor = (type: string) => {
        if (type.includes('checking') || type.includes('savings') || type === 'depository') {
            return 'bg-blue-100 text-blue-800'
        }
        if (type.includes('credit')) {
            return 'bg-red-100 text-red-800'
        }
        if (type.includes('investment')) {
            return 'bg-green-100 text-green-800'
        }
        if (type.includes('loan')) {
            return 'bg-orange-100 text-orange-800'
        }
        return 'bg-gray-100 text-gray-800'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-6">
                <div className="text-gray-500 text-sm">Loading accounts...</div>
            </div>
        )
    }

    if (accounts.length === 0) {
        return (
            <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-sm mb-2">No accounts connected yet.</p>
                <p className="text-xs text-gray-400">
                    Click &ldquo;Connect Account&rdquo; above to get started.
                </p>
            </div>
        )
    }

    // Group by institution for better organization
    const accountsByInstitution = accounts.reduce((acc, account) => {
        const institution = account.plaid_items?.institution_name || 'Other'
        if (!acc[institution]) {
            acc[institution] = []
        }
        acc[institution].push(account)
        return acc
    }, {} as Record<string, AccountWithInstitution[]>)

    return (
        <div className="space-y-4">
            {Object.entries(accountsByInstitution).map(([institution, institutionAccounts]) => (
                <div key={institution} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900">{institution}</h4>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {institutionAccounts.map((account) => (
                            <div key={account.id} className="p-3 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-gray-900">{account.account_name}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getAccountTypeColor(account.account_subtype || account.account_type)}`}>
                                                {getAccountTypeLabel(account.account_subtype || account.account_type)}
                                            </span>
                                        </div>

                                        <div className="text-xs text-gray-600">
                                            Balance: {formatCurrency(account.current_balance)}
                                            {account.available_balance !== undefined && account.available_balance !== account.current_balance && (
                                                <span className="ml-2 text-gray-500">
                                                    (Available: {formatCurrency(account.available_balance)})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        {/* Delete button */}
                                        <button
                                            onClick={() => deleteAccount(account.id)}
                                            className="text-red-600 hover:text-red-800 p-1"
                                            title="Remove account"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
