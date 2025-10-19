'use client'

import { useEffect, useState } from 'react'
import { NetWorthCalculation } from '@/lib/interfaces/networth'
import PlaidLinkButton from '@/components/plaid/PlaidLinkButton'
import AccountsList from '@/components/accounts/AccountsList'
import ManualAssetsSection from '@/components/assets/ManualAssetsSection'
import EmptyState from '@/components/dashboard/EmptyState'
import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ChartBarIcon,
    CreditCardIcon,
    ReceiptPercentIcon,
} from '@heroicons/react/24/outline'

export default function DashboardContent() {
    const [netWorth, setNetWorth] = useState<NetWorthCalculation | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchNetWorth()
    }, [])

    const fetchNetWorth = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/networth')
            if (!response.ok) {
                throw new Error('Failed to fetch net worth')
            }
            const data = await response.json()
            setNetWorth(data)
        } catch (err) {
            console.error('Error fetching net worth:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch net worth')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const getNetWorthColor = () => {
        if (!netWorth) return 'text-gray-900'
        if (netWorth.net_worth >= 0) return 'text-green-600'
        return 'text-red-600'
    }

    return (
        <div className="px-8 py-8">
            {/* Top Navigation Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <a href="#" className="border-b-2 border-primary-700 py-4 px-1 text-sm font-medium text-primary-700">
                            Net Worth
                        </a>
                        <a href="#" className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Cash Flow
                        </a>
                        <a href="#" className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Spending
                        </a>
                        <a href="#" className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                            Income
                        </a>
                    </nav>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Net Worth Card */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Net Worth</p>
                        <ArrowTrendingUpIcon className={`w-5 h-5 ${loading ? 'text-gray-300' : netWorth && netWorth.net_worth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                    {loading ? (
                        <>
                            <p className="text-3xl font-bold text-gray-400">Loading...</p>
                            <p className="text-sm text-gray-400 mt-2">Calculating...</p>
                        </>
                    ) : error ? (
                        <>
                            <p className="text-3xl font-bold text-red-500">Error</p>
                            <p className="text-sm text-red-400 mt-2">{error}</p>
                        </>
                    ) : netWorth ? (
                        <>
                            <p className={`text-3xl font-bold ${getNetWorthColor()}`}>
                                {formatCurrency(netWorth.net_worth)}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                {netWorth.net_worth >= 0 ? 'Building wealth' : 'Getting started'}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-3xl font-bold text-gray-400">-</p>
                            <p className="text-sm text-gray-400 mt-2">No data</p>
                        </>
                    )}
                </div>

                {/* Total Assets Card */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Total Assets</p>
                    {loading ? (
                        <>
                            <p className="text-3xl font-bold text-gray-400">Loading...</p>
                            <p className="text-sm text-gray-400 mt-2">Calculating...</p>
                        </>
                    ) : netWorth ? (
                        <>
                            <p className="text-3xl font-bold text-gray-900">
                                {formatCurrency(netWorth.total_assets)}
                            </p>
                            <p className="text-sm text-green-600 mt-2">
                                {netWorth.total_assets > 0 ? 'What you own' : 'Start tracking assets'}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-3xl font-bold text-gray-400">-</p>
                            <p className="text-sm text-gray-400 mt-2">No data yet</p>
                        </>
                    )}
                </div>

                {/* Total Liabilities Card */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Total Liabilities</p>
                    {loading ? (
                        <>
                            <p className="text-3xl font-bold text-gray-400">Loading...</p>
                            <p className="text-sm text-gray-400 mt-2">Calculating...</p>
                        </>
                    ) : netWorth ? (
                        <>
                            <p className="text-3xl font-bold text-gray-900">
                                {formatCurrency(netWorth.total_liabilities)}
                            </p>
                            <p className="text-sm text-red-600 mt-2">
                                {netWorth.total_liabilities > 0 ? 'What you owe' : 'Debt-free!'}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-3xl font-bold text-gray-400">-</p>
                            <p className="text-sm text-gray-400 mt-2">No data yet</p>
                        </>
                    )}
                </div>

                {/* Savings Rate Card */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Savings Rate</p>
                    <p className="text-3xl font-bold text-gray-400">-</p>
                    <p className="text-sm text-gray-400 mt-2">Coming soon</p>
                </div>
            </div>

            {/* Asset Breakdown Section */}
            {netWorth && netWorth.total_assets > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Assets Breakdown */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assets Breakdown</h2>
                        <div className="space-y-3">
                            {netWorth.breakdown.cash > 0 && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                                        <span className="text-sm text-gray-700">Cash</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatCurrency(netWorth.breakdown.cash)}
                                    </span>
                                </div>
                            )}
                            {netWorth.breakdown.investments > 0 && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                                        <span className="text-sm text-gray-700">Investments</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatCurrency(netWorth.breakdown.investments)}
                                    </span>
                                </div>
                            )}
                            {netWorth.breakdown.crypto > 0 && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                                        <span className="text-sm text-gray-700">Crypto</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatCurrency(netWorth.breakdown.crypto)}
                                    </span>
                                </div>
                            )}
                            {netWorth.breakdown.real_estate > 0 && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                                        <span className="text-sm text-gray-700">Real Estate</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatCurrency(netWorth.breakdown.real_estate)}
                                    </span>
                                </div>
                            )}
                            {netWorth.breakdown.other > 0 && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-gray-500 mr-3"></div>
                                        <span className="text-sm text-gray-700">Other</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatCurrency(netWorth.breakdown.other)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Liabilities Breakdown */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Liabilities Breakdown</h2>
                        {netWorth.total_liabilities > 0 ? (
                            <div className="space-y-3">
                                {netWorth.breakdown.credit_card_debt > 0 && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                                            <span className="text-sm text-gray-700">Credit Card Debt</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatCurrency(netWorth.breakdown.credit_card_debt)}
                                        </span>
                                    </div>
                                )}
                                {netWorth.breakdown.loans > 0 && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-orange-500 mr-3"></div>
                                            <span className="text-sm text-gray-700">Loans</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatCurrency(netWorth.breakdown.loans)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-24">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600 mb-1">Debt Free!</p>
                                    <p className="text-sm text-gray-500">No liabilities tracked</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - 2/3 width */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Net Worth Trend Chart */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Net Worth Trend</h2>
                            <select className="text-sm border-gray-300 rounded-md text-gray-400" disabled>
                                <option>Last 30 days</option>
                            </select>
                        </div>
                        <EmptyState
                            icon={<ChartBarIcon className="w-12 h-12 text-gray-400" />}
                            title="No trend data yet"
                            description="Connect your accounts and we'll start tracking your net worth over time. Your financial journey visualization will appear here."
                            className="h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
                        />
                    </div>

                    {/* Spending by Category */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Spending by Category</h2>
                        <EmptyState
                            icon={<ReceiptPercentIcon className="w-12 h-12 text-gray-400" />}
                            title="No spending data available"
                            description="Once you connect your accounts and sync transactions, we'll automatically categorize your spending and show you where your money goes."
                            className="min-h-[200px]"
                        />
                    </div>

                    {/* Connected Accounts - REAL DATA */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Connected Accounts</h2>
                            <PlaidLinkButton onSuccess={fetchNetWorth} />
                        </div>
                        <AccountsList />
                    </div>

                    {/* Manual Assets - Only shown when assets exist */}
                    <ManualAssetsSection onUpdate={fetchNetWorth} />
                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-8">
                    {/* Monthly Cash Flow */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">This Month</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                                <div>
                                    <p className="text-sm text-gray-500">Income</p>
                                    <p className="text-2xl font-bold text-gray-400">-</p>
                                </div>
                                <ArrowTrendingUpIcon className="w-8 h-8 text-gray-300" />
                            </div>

                            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                                <div>
                                    <p className="text-sm text-gray-500">Expenses</p>
                                    <p className="text-2xl font-bold text-gray-400">-</p>
                                </div>
                                <ArrowTrendingDownIcon className="w-8 h-8 text-gray-300" />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div>
                                    <p className="text-sm text-gray-500">Net Income</p>
                                    <p className="text-2xl font-bold text-gray-400">-</p>
                                </div>
                                <BanknotesIcon className="w-8 h-8 text-gray-300" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center">Sync transactions to see cash flow analysis</p>
                    </div>

                    {/* Account Breakdown */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Breakdown</h2>
                        <EmptyState
                            icon={<CreditCardIcon className="w-10 h-10 text-gray-400" />}
                            title="No accounts yet"
                            description="Connect your bank accounts, investments, and crypto wallets to see your complete financial picture."
                            className="min-h-[150px]"
                        />
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
                        <EmptyState
                            icon={<ReceiptPercentIcon className="w-10 h-10 text-gray-400" />}
                            title="No transactions yet"
                            description="Your recent transaction history will appear here once you connect and sync your accounts."
                            className="min-h-[150px]"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
