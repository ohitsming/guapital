'use client'; // Add use client directive

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link'; // Use next/link
import { usePathname } from 'next/navigation'; // Use usePathname
import Image from 'next/image'; // Use next/image for Logo
import SidebarLinkGroup from './SidebarLinkGroup';
import { Logo } from './Logo';
import { Cog6ToothIcon, ArrowRightOnRectangleIcon, ArrowLeftCircleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/utils/supabase/client';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (arg: boolean) => void;
    navigation: { name: string; href: string; icon: React.ElementType }[]; // Added navigation prop
}

const AppSidebar = ({ sidebarOpen, setSidebarOpen, navigation }: SidebarProps) => { // Destructure navigation
    const pathname = usePathname(); // Use usePathname

    const trigger = useRef<any>(null);
    const sidebar = useRef<any>(null);

    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        if (typeof window !== 'undefined') { // Ensure localStorage is available
            const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
            if (storedSidebarExpanded !== null) {
                setSidebarExpanded(storedSidebarExpanded === 'true');
            }
        }
    }, []); // Empty dependency array means it runs once on mount

    // close on click outside
    useEffect(() => {
        const clickHandler = ({ target }: MouseEvent) => {
            if (!sidebar.current || !trigger.current) return;
            if (
                !sidebarOpen ||
                sidebar.current.contains(target) ||
                trigger.current.contains(target)
            )
                return;
            setSidebarOpen(false);
        };
        document.addEventListener('click', clickHandler);
        return () => document.removeEventListener('click', clickHandler);
    });

    // close if the esc key is pressed
    useEffect(() => {
        const keyHandler = ({ keyCode }: KeyboardEvent) => {
            if (!sidebar.current) return;
            if (keyCode === 27) {
                setSidebarOpen(false);
            }
        };
        document.addEventListener('keydown', keyHandler);
        return () => document.removeEventListener('keydown', keyHandler);
    });

    useEffect(() => {
        localStorage.setItem('sidebar-expanded', sidebarExpanded.toString());
        if (sidebarExpanded) {
            document.querySelector('body')?.classList.add('sidebar-expanded');
        } else {
            document.querySelector('body')?.classList.remove('sidebar-expanded');
        }
    }, [sidebarExpanded]);

    const handleLogout = async () => {
        setShowLogoutModal(false); // Close modal first
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error.message);
        } else {
            // Redirect to login page or home page after logout
            window.location.href = '/'; 
        }
    };

    return (
        <>
            <aside
                ref={sidebar}
                className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden duration-300 ease-linear lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${!sidebarExpanded ? 'bg-white ' : ''}`}
            >
                {/* <!-- SIDEBAR HEADER --> */}
                <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5 mt-4">
                    <Link href="/" className="flex items-center gap-x-10 flex-grow justify-center">
                        <Logo className="h-10 w-auto" />
                        {pathname.includes('/business') ? (
                            <span className="text-xl font-semibold text-gray-800">Business</span>
                        ) : pathname.includes('/earner') ? (
                            <span className="text-xl font-semibold text-gray-800">Earner</span>
                        ) : null}
                    </Link>

                    <button
                        ref={trigger}
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-controls="sidebar"
                        aria-expanded={sidebarOpen}
                        className="block lg:hidden"
                    >
                        <svg
                            className="fill-current"
                            width="20"
                            height="18"
                            viewBox="0 0 20 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.825H19C19.45 9.825 19.825 9.45 19.825 9C19.825 8.55 19.45 8.175 19 8.175Z"
                                fill=""
                            />
                        </svg>
                    </button>
                </div>
                {/* <!-- SIDEBAR HEADER --> */}

                <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear flex-grow">
                    {/* <!-- Sidebar Menu --> */}
                    <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
                        {/* <!-- Menu Group --> */}
                        <div>
                            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">MENU</h3>

                            <ul className="mb-6 flex flex-col gap-1.5">
                                {navigation.map((item) => {
                                    const Icon = item.icon; // Get the icon component
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out ${pathname.includes(item.href) && ''
                                                    }`}
                                            >
                                                <Icon className="h-6 w-6" aria-hidden="true" /> {/* Render the icon */}
                                                {item.name}
                                            </Link>
                                        </li>
                                    );
                                })}

                            </ul>
                        </div>

                        {/* Removed "OTHERS" group and hardcoded menu items */}
                    </nav>
                    {/* <!-- Sidebar Menu --> */}
                </div>
                {/* <!-- Settings Menu at the bottom --> */}
                <div className="sticky bottom-0 w-full bg-white py-4 px-4 lg:px-6 mb-4"> {/* Added sticky bottom positioning */}
                    <ul>
                        <li>
                            <Link
                                href={pathname.includes('/dashboard/earner') ? "/dashboard/earner/settings" : "/dashboard/business/settings"}
                                className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out ${pathname.includes('/dashboard/settings') && ''
                                    }`}
                            >
                                <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />
                                Settings
                            </Link>
                        </li>
                        <li>
                            <button
                                type="button"
                                onClick={() => setShowLogoutModal(true)}
                                className="group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-red-500 hover:text-red-700 duration-300 ease-in-out w-full justify-start"
                            >
                                <ArrowLeftCircleIcon className="h-6 w-6" aria-hidden="true" />
                                Logout
                            </button>
                        </li>
                    </ul>
                </div>
            </aside>

            {showLogoutModal && (
                <div className="fixed inset-0 bg-neutral-100 bg-opacity-50 flex items-center justify-center z-[99999]">
                    <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
                        <h2 className="text-2xl font-bold mb-4">Confirm Logout</h2>
                        <p className="mb-6">Are you sure you want to log out?</p>
                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-black rounded-md"
                                onClick={() => setShowLogoutModal(false)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md"
                                onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AppSidebar;