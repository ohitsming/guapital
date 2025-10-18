import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PlaidLinkButton  from '@/components/plaid/PlaidLinkButton'
import AccountsList from '@/components/accounts/AccountsList'
import EmptyState from '@/components/dashboard/EmptyState'
import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ChartBarIcon,
    CreditCardIcon,
    ReceiptPercentIcon,
} from '@heroicons/react/24/outline'

export default async function Dashboard() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Future: Fetch real data from API endpoints
    // - GET /api/networth - Current net worth calculation
    // - GET /api/networth/history - Historical trends
    // - GET /api/transactions - Transaction history
    // - GET /api/cash-flow - Monthly income/expense analysis

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
                            <ArrowTrendingUpIcon className="w-5 h-5 text-gray-300" />
                        </div>
                        <p className="text-3xl font-bold text-gray-400">-</p>
                        <p className="text-sm text-gray-400 mt-2">Connect accounts to calculate</p>
                    </div>

                    {/* Total Assets Card */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Total Assets</p>
                        <p className="text-3xl font-bold text-gray-400">-</p>
                        <p className="text-sm text-gray-400 mt-2">No data yet</p>
                    </div>

                    {/* Total Liabilities Card */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Total Liabilities</p>
                        <p className="text-3xl font-bold text-gray-400">-</p>
                        <p className="text-sm text-gray-400 mt-2">No data yet</p>
                    </div>

                    {/* Savings Rate Card */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Savings Rate</p>
                        <p className="text-3xl font-bold text-gray-400">-</p>
                        <p className="text-sm text-gray-400 mt-2">No data yet</p>
                    </div>
                </div>

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
                                <PlaidLinkButton />
                            </div>
                            <AccountsList />
                        </div>
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
