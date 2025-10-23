'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
    HomeIcon,
    WalletIcon,
    CreditCardIcon,
    ChartBarIcon,
    LockClosedIcon,
    XMarkIcon,
    UserCircleIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    Bars3Icon
} from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { useSubscription } from '@/lib/context/SubscriptionContext'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { Logo } from '@/components/Logo'
import { PaymentModal } from '@/components/stripe'

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

interface DashboardNavProps {
    isOpen?: boolean
    onClose?: () => void
    onOpen?: () => void
    user: User
}

export function DashboardNav({ isOpen = false, onClose, onOpen, user }: DashboardNavProps) {
    const pathname = usePathname()
    const { hasAccess, isLoading, tier } = useSubscription()
    const supabase = createClient()
    const isPremium = tier === 'premium'
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
    const [showUpgradeBanner, setShowUpgradeBanner] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    // Stable upgrade banner visibility - only update after initial load
    useEffect(() => {
        if (!isLoading) {
            const shouldShow = !hasAccess('transactionHistory') || !hasAccess('advancedReports')
            setShowUpgradeBanner(shouldShow)
        }
    }, [isLoading, hasAccess])

    // Close sidebar when route changes (mobile only)
    useEffect(() => {
        if (isOpen && onClose) {
            onClose()
        }
    }, [pathname, isOpen, onClose])

    // Close dropdown when sidebar is closed
    useEffect(() => {
        if (!isOpen) {
            setIsAccountDropdownOpen(false)
        }
    }, [isOpen])

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    return (
        <>
            {/* Floating Hamburger Button - Mobile Only */}
            {!isOpen && onOpen && (
                <button
                    onClick={onOpen}
                    className="lg:hidden fixed top-4 left-4 z-40 p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    aria-label="Open menu"
                >
                    <Bars3Icon className="h-6 w-6 text-gray-700" />
                </button>
            )}

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <div
                className={`
                    fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col
                    transform lg:translate-x-0
                    ${isOpen ? 'translate-x-0 transition-transform duration-300 ease-in-out' : '-translate-x-full transition-transform duration-300 ease-in-out lg:transition-none'}
                `}
                style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center justify-center py-6 px-6 flex-shrink-0 gap-3" style={{ willChange: 'auto' }}>
                    <Link href="/" aria-label="Home" prefetch={true}>
                        <Logo className="h-12 w-auto" />
                    </Link>
                    {isPremium && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#FFC107] to-[#FFD54F] rounded-full shadow-md">
                            <SparklesIcon className="h-3.5 w-3.5 text-[#004D40]" />
                            <span className="text-xs font-bold text-[#004D40] tracking-wide">PREMIUM</span>
                        </div>
                    )}
                </div>

                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="lg:hidden absolute top-6 right-4 p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors z-10"
                    aria-label="Close menu"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>

                <nav className="px-4 space-y-1 mt-4 overflow-y-auto flex-1">
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

                {/* Bottom Section */}
                <div className="flex-shrink-0 border-t border-gray-200 bg-white">
                    {/* Upgrade prompt for free users */}
                    <div
                        className={`overflow-hidden transition-all duration-200 ${showUpgradeBanner ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                        style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
                    >
                        <div className="p-4 border-b border-gray-200">
                            <div className="bg-gradient-to-r from-[#004D40] to-[#00695C] rounded-lg p-4 text-white">
                                <p className="text-xs font-semibold mb-2">Upgrade to Premium</p>
                                <p className="text-xs mb-3 opacity-90">Unlock reports, transactions & more</p>
                                <button
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    className="block w-full px-3 py-2 bg-white text-[#004D40] text-xs font-semibold rounded text-center hover:bg-gray-100 transition-colors"
                                >
                                    Choose Plan
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* User Profile Section */}
                    <div className="p-4">
                        {/* Account Dropdown Button */}
                        <button
                            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                            className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <UserCircleIcon className="h-10 w-10 text-gray-600" />
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {user.email}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {isPremium ? 'Premium Account' : 'Account'}
                                </p>
                            </div>
                            {isAccountDropdownOpen ? (
                                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                                <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isAccountDropdownOpen ? 'max-h-44 opacity-100 mt-2' : 'max-h-0 opacity-0'
                            }`}
                        >
                            <div className="space-y-1">
                                <Link
                                    href="/dashboard/settings"
                                    onClick={() => setIsAccountDropdownOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Cog6ToothIcon className="h-5 w-5" />
                                    Settings
                                </Link>
                                <button
                                    onClick={() => {
                                        setIsAccountDropdownOpen(false)
                                        handleSignOut()
                                    }}
                                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors w-full text-left"
                                >
                                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
            />
        </>
    )
}
