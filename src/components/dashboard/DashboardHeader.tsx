'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon, UserCircleIcon } from '@heroicons/react/20/solid'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import clsx from 'clsx'

export function DashboardHeader({ user }: { user: User }) {
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    return (
        <div className="fixed top-0 left-0 right-0 h-24 bg-white border-b border-gray-200 z-50">
            <div className="flex items-center justify-between h-full px-6 ml-24">
                <Link href="/" aria-label="Home">
                    <Logo className="hidden h-8 sm:block" />
                </Link>
                <div className="flex items-center gap-4">
                    <Menu as="div" className="relative">
                        <MenuButton className="flex items-center gap-x-1 rounded-full p-1 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition">
                            <UserCircleIcon className="h-8 w-8" />
                            <ChevronDownIcon className="h-4 w-4" />
                        </MenuButton>
                        <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                            <div className="py-1">
                                <MenuItem>
                                    {({ focus }) => (
                                        <Link
                                            href="/dashboard"
                                            className={clsx(
                                                focus ? 'bg-gray-100' : '',
                                                'block px-4 py-2 text-sm text-gray-700'
                                            )}
                                        >
                                            Dashboard
                                        </Link>
                                    )}
                                </MenuItem>
                                <MenuItem>
                                    {({ focus }) => (
                                        <Link
                                            href="/profile"
                                            className={clsx(
                                                focus ? 'bg-gray-100' : '',
                                                'block px-4 py-2 text-sm text-gray-700'
                                            )}
                                        >
                                            Profile
                                        </Link>
                                    )}
                                </MenuItem>
                                <MenuItem>
                                    {({ focus }) => (
                                        <Link
                                            href="/settings"
                                            className={clsx(
                                                focus ? 'bg-gray-100' : '',
                                                'block px-4 py-2 text-sm text-gray-700'
                                            )}
                                        >
                                            Settings
                                        </Link>
                                    )}
                                </MenuItem>
                                <div className="border-t border-gray-100" />
                                <MenuItem>
                                    {({ focus }) => (
                                        <button
                                            onClick={handleSignOut}
                                            className={clsx(
                                                focus ? 'bg-gray-100' : '',
                                                'block w-full px-4 py-2 text-left text-sm text-gray-700'
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
    )
}
