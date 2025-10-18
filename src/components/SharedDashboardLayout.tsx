'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Logo } from '@/components/Logo'
import { usePathname } from 'next/navigation'
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
    TransitionChild,
} from '@headlessui/react'
import {
    Bars3Icon,
    BellIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { motion } from 'framer-motion'
import { GridPattern } from '@/components/GridPattern'
import Link from 'next/link'
import LetterAvatar from '@/components/LetterAvatar'


// Define a type for navigation items
interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const userNavigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Sign out', href: '/logout' },
]

function classNames(...classes: any) {
    return classes.filter(Boolean).join(' ')
}

interface SharedDashboardLayoutProps {
    children: React.ReactNode;
}

export default function SharedDashboardLayout({ children }: SharedDashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userProfile, setUserProfile] = useState<any>(null)
    const supabase = createClient()
    const pathname = usePathname()

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUserProfile(null);
        window.location.href = '/'; // Redirect to home page after sign out
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await fetch('/api/supabase/settings/profile');
                if (!response.ok) {
                    throw new Error('Failed to fetch user profile');
                }
                const data = await response.json();
                setUserProfile(data);
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        fetchUserProfile();
    }, []);

    return (
        <div>
            <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
                />

                <div className="fixed inset-0 flex">
                    <DialogPanel
                        transition
                        className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
                    >
                        <TransitionChild>
                            <div className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
                                <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                                    <span className="sr-only">Close sidebar</span>
                                    <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                                </button>
                            </div>
                        </TransitionChild>

                        {/* Sidebar component, swap this element with another sidebar if you like */}
                        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                            <div className="flex h-16 shrink-0 items-center justify-center my-7">
                                <Link href="/" aria-label="Home" className="flex items-center gap-x-4">
                                    <Logo
                                        className="hidden h-8 w-auto sm:block"
                                        invert={true}
                                        filled={true}
                                    />
                                </Link>
                            </div>
                            
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center justify-center my-4">
                        <Link href="/" aria-label="Home" className="flex items-center gap-x-10">
                            <Logo className="h-10 w-auto" />
                        </Link>

                    </div>
                    
                </div>
            </div>

            <div className="lg:pl-72">
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-gray-700 lg:hidden">
                        <span className="sr-only">Open sidebar</span>
                        <Bars3Icon aria-hidden="true" className="size-6" />
                    </button>

                    {/* Separator */}
                    <div aria-hidden="true" className="h-6 w-px bg-gray-200 lg:hidden" />

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex flex-1 justify-end items-center"> {/* This is where headerExtraContent will go */}
                        </div>
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                                <span className="sr-only">View notifications</span>
                                <BellIcon aria-hidden="true" className="size-6" />
                            </button>

                            {/* Separator */}
                            <div aria-hidden="true" className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

                            {/* Profile dropdown */}
                            <Menu as="div" className="relative">
                                <MenuButton className="relative flex items-center">
                                    <span className="absolute -inset-1.5" />
                                    <span className="sr-only">Open user menu</span>
                                    <LetterAvatar
                                        name={userProfile?.full_name || ''}
                                        size={32}
                                        textSize="text-sm"
                                    />
                                    <span className="hidden lg:flex lg:items-center">
                                        <span aria-hidden="true" className="ml-4 text-sm/6 font-semibold text-gray-900">
                                            {userProfile?.full_name || 'User'}
                                        </span>
                                        <ChevronDownIcon aria-hidden="true" className="ml-2 size-5 text-gray-400" />
                                    </span>
                                </MenuButton>
                                <MenuItems
                                    transition
                                    className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                                >
                                    {userNavigation.map((item) => (
                                        <MenuItem key={item.name}>
                                            {item.href === '/logout' ? (
                                                <button
                                                    onClick={handleSignOut}
                                                    className="block w-full px-3 py-1 text-left text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                                                >
                                                    {item.name}
                                                </button>
                                            ) : (
                                                <Link
                                                    href={item.href}
                                                    className="block px-3 py-1 text-sm/6 text-gray-900 data-[focus]:bg-gray-50 data-[focus]:outline-none"
                                                >
                                                    {item.name}
                                                </Link>
                                            )}
                                        </MenuItem>
                                    ))}
                                </MenuItems>
                            </Menu>
                        </div>
                    </div>
                </div>

                <motion.div
                    layout
                    className="relative flex flex-auto overflow-hidden bg-white"
                >
                    <motion.div
                        layout
                        className="relative isolate flex w-full flex-col"
                    >
                        <GridPattern
                            className="absolute inset-x-0 -top-14 -z-10 h-[1000px] w-full mask-[linear-gradient(to_bottom_left,white_40%,transparent_50%)] fill-neutral-50 stroke-neutral-950/5"
                            yOffset={-96}
                            interactive
                        />

                        <main>
                            <div className="container mx-auto py-12 px-6 lg:px-8">
                                <div className="min-h-screen">
                                    <div className="px-4 sm:px-6 lg:px-8">{children}</div>
                                </div>
                            </div>
                        </main>

                    </motion.div>
                </motion.div>


            </div>
        </div>
        
    )
}