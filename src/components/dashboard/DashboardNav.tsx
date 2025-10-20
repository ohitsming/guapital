'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    HomeIcon,
    WalletIcon,
    CreditCardIcon,
    ChartBarIcon,
    BanknotesIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline'
import { useSubscription } from '@/lib/context/SubscriptionContext'

interface NavItem {
    name: string
    href: string
    icon: any
    requiresPremium?: boolean
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Accounts', href: '/dashboard/accounts', icon: WalletIcon },
    { name: 'Transactions', href: '/dashboard/transactions', icon: CreditCardIcon, requiresPremium: true },
    { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon, requiresPremium: true },
    // { name: 'Cash Flow', href: '/dashboard/budget', icon: BanknotesIcon, requiresPremium: true }, // Removed for now
]

export function DashboardNav() {
    const pathname = usePathname()
    const { hasAccess, isLoading } = useSubscription()

    return (
        <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 pt-24">
            <nav className="px-4 space-y-1 mt-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href

                    // Check access based on the specific page
                    let hasPageAccess = true
                    if (item.name === 'Transactions') {
                        hasPageAccess = hasAccess('transactionHistory')
                    } else if (item.name === 'Reports') {
                        hasPageAccess = hasAccess('advancedReports')
                    }

                    const isLocked = !isLoading && item.requiresPremium && !hasPageAccess

                    if (isLocked) {
                        return (
                            <div
                                key={item.name}
                                className="flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-400 rounded-lg cursor-not-allowed"
                                title="Premium feature - upgrade to unlock"
                            >
                                <div className="flex items-center">
                                    <item.icon className="w-5 h-5 mr-3" />
                                    {item.name}
                                </div>
                                <LockClosedIcon className="w-4 h-4 text-gray-400" />
                            </div>
                        )
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                                isActive
                                    ? 'text-gray-900 bg-gray-100'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Upgrade prompt for free users */}
            {!isLoading && (!hasAccess('transactionHistory') || !hasAccess('advancedReports')) && (
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                    <div className="bg-gradient-to-r from-[#004D40] to-[#00695C] rounded-lg p-4 text-white">
                        <p className="text-xs font-semibold mb-2">Upgrade to Premium</p>
                        <p className="text-xs mb-3 opacity-90">Unlock reports, transactions & more</p>
                        <a
                            href="/pricing"
                            className="block w-full px-3 py-2 bg-white text-[#004D40] text-xs font-semibold rounded text-center hover:bg-gray-100 transition-colors"
                        >
                            View Plans
                        </a>
                    </div>
                </div>
            )}
        </div>
    )
}
