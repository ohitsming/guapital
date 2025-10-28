'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon, UserCircleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/20/solid'
import { HomeIcon, WalletIcon, CreditCardIcon, ChartBarIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { Logo } from '@/components/Logo'
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
]

interface DashboardHeaderProps {
    onMenuClick?: () => void
    user: User
}

export function DashboardHeader({ onMenuClick, user }: DashboardHeaderProps) {
    const pathname = usePathname()
    const [isSticky, setIsSticky] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const { hasAccess, isLoading, tier } = useSubscription()
    const supabase = createClient()
    const isPremium = tier === 'premium'

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 104)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    return (
        <>
            <div
                className={clsx(
                    'fixed top-4 z-50 transition-all duration-200 lg:hidden',
                    'left-8 right-8 sm:left-12 sm:right-12',
                    'rounded-full border border-neutral-200',
                    isSticky
                        ? 'bg-white/80 backdrop-blur-md shadow-sm'
                        : 'bg-white'
                )}
            >
                <div className="mx-auto px-6">
                    <div className="flex items-center justify-between h-14">
                        {/* Mobile: Hamburger + Logo */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 -m-2 text-neutral-600 hover:text-neutral-950 transition-colors"
                                aria-label="Toggle menu"
                            >
                                {isMenuOpen ? (
                                    <XMarkIcon className="h-5 w-5" />
                                ) : (
                                    <Bars3Icon className="h-5 w-5" />
                                )}
                            </button>
                            <Link href="/dashboard" aria-label="Dashboard">
                                <Logo className="h-10" />
                            </Link>
                            {isPremium && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-[#FFC107] to-[#FFD54F] rounded-full shadow-md">
                                    <SparklesIcon className="h-3 w-3 text-[#004D40]" />
                                    <span className="text-xs font-bold text-[#004D40] tracking-wide">PREMIUM</span>
                                </div>
                            )}
                        </div>

                        {/* Right side - User menu */}
                        <div className="flex items-center gap-x-3 ml-auto">
                            <Menu as="div" className="relative">
                                <MenuButton className="flex items-center gap-x-2 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-950 transition-colors">
                                    <UserCircleIcon className="h-5 w-5" />
                                    <span className="hidden sm:inline">Account</span>
                                    <ChevronDownIcon className="h-4 w-4" />
                                </MenuButton>
                                <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                                    <div className="py-1">
                                        <div className="px-4 py-3 border-b border-neutral-100">
                                            <p className="text-sm font-medium text-neutral-900 truncate">
                                                {user.email}
                                            </p>
                                            <p className="text-xs text-neutral-500 mt-0.5">Account</p>
                                        </div>
                                        <MenuItem>
                                            {({ focus }) => (
                                                <Link
                                                    href="/dashboard/settings"
                                                    className={clsx(
                                                        focus ? 'bg-neutral-100' : '',
                                                        'block px-4 py-2 text-sm text-neutral-700'
                                                    )}
                                                >
                                                    Settings
                                                </Link>
                                            )}
                                        </MenuItem>
                                        <MenuItem>
                                            {({ focus }) => (
                                                <Link
                                                    href="/dashboard/billing"
                                                    className={clsx(
                                                        focus ? 'bg-neutral-100' : '',
                                                        'block px-4 py-2 text-sm text-neutral-700'
                                                    )}
                                                >
                                                    Billing
                                                </Link>
                                            )}
                                        </MenuItem>
                                        <MenuItem>
                                            {({ focus }) => (
                                                <Link
                                                    href="/dashboard/support"
                                                    className={clsx(
                                                        focus ? 'bg-neutral-100' : '',
                                                        'block px-4 py-2 text-sm text-neutral-700'
                                                    )}
                                                >
                                                    Support
                                                </Link>
                                            )}
                                        </MenuItem>
                                        <div className="border-t border-neutral-100" />
                                        <MenuItem>
                                            {({ focus }) => (
                                                <button
                                                    onClick={handleSignOut}
                                                    className={clsx(
                                                        focus ? 'bg-neutral-100' : '',
                                                        'block w-full px-4 py-2 text-left text-sm text-neutral-700'
                                                    )}
                                                >
                                                    Sign out
                                                </button>
                                            )}
                                        </MenuItem>
                                    </div>
                                </MenuItems>
                            </Menu>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile navigation menu dropdown */}
            {isMenuOpen && (
                <div className="lg:hidden fixed top-20 left-8 right-8 sm:left-12 sm:right-12 z-40 bg-white border border-neutral-200 rounded-2xl shadow-lg overflow-hidden">
                    <nav className="px-4 py-6 space-y-1">
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
                                        className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-400 rounded-lg cursor-not-allowed"
                                        title="Premium feature - upgrade to unlock"
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="h-5 w-5" />
                                            {item.name}
                                        </div>
                                        <LockClosedIcon className="h-4 w-4" />
                                    </div>
                                )
                            }

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={clsx(
                                        'flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                                        isActive
                                            ? 'text-neutral-950 bg-neutral-100'
                                            : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            )}
        </>
    )
}
