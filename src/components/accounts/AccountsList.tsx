'use client';

import { useState, useEffect } from 'react';
import { PlaidAccount } from '@/lib/interfaces/plaid';
import { formatCurrency } from '@/utils/formatters';

interface AccountWithInstitution extends PlaidAccount {
  plaid_items?: {
    institution_name: string;
    sync_status: string;
    last_sync_at?: string;
  };
}

export default function AccountsList() {
  const [accounts, setAccounts] = useState<AccountWithInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/plaid/accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncAccounts = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/plaid/sync-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to sync accounts');
      }

      // Refresh accounts after sync
      await fetchAccounts();
    } catch (error) {
      console.error('Error syncing accounts:', error);
      alert('Failed to sync accounts. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const deleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to remove this account?')) {
      return;
    }

    try {
      const response = await fetch(`/api/plaid/accounts?id=${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Refresh accounts after deletion
      await fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  const getAccountTypeLabel = (type: string, subtype?: string) => {
    if (subtype) {
      return subtype
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'depository':
        return 'bg-blue-100 text-blue-800';
      case 'credit':
        return 'bg-red-100 text-red-800';
      case 'investment':
        return 'bg-green-100 text-green-800';
      case 'loan':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading accounts...</div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 mb-4">No accounts connected yet.</p>
        <p className="text-sm text-gray-400">
          Click "Connect Bank Account" to get started.
        </p>
      </div>
    );
  }

  // Group accounts by institution
  const accountsByInstitution = accounts.reduce((acc, account) => {
    const institution = account.plaid_items?.institution_name || 'Unknown';
    if (!acc[institution]) {
      acc[institution] = [];
    }
    acc[institution].push(account);
    return acc;
  }, {} as Record<string, AccountWithInstitution[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Connected Accounts</h3>
        <button
          onClick={syncAccounts}
          disabled={syncing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {syncing ? 'Syncing...' : 'Sync All'}
        </button>
      </div>

      {Object.entries(accountsByInstitution).map(([institution, institutionAccounts]) => (
        <div key={institution} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">{institution}</h4>
            {institutionAccounts[0]?.plaid_items?.last_sync_at && (
              <p className="text-xs text-gray-500 mt-1">
                Last synced:{' '}
                {new Date(institutionAccounts[0].plaid_items.last_sync_at).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="divide-y divide-gray-200">
            {institutionAccounts.map((account) => (
              <div key={account.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{account.account_name}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getAccountTypeColor(
                          account.account_type
                        )}`}
                      >
                        {getAccountTypeLabel(account.account_type, account.account_subtype)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Balance: {formatCurrency(account.current_balance)}
                      {account.available_balance !== null &&
                        account.available_balance !== account.current_balance && (
                          <span className="ml-2">
                            (Available: {formatCurrency(account.available_balance)})
                          </span>
                        )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteAccount(account.id)}
                    className="ml-4 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
