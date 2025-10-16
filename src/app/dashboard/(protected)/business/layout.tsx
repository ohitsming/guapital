'use client'

import { HomeIcon, ClipboardIcon } from '@heroicons/react/24/outline'

import { useState, useEffect } from 'react'
import AppSidebar from '@/components/AppSidebar' 

export default function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
    const [userProfile, setUserProfile] = useState<any>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false); // State for sidebar

    const navigation = [
        { name: 'Overview', href: '/dashboard/business', icon: HomeIcon },
        { name: 'Campaigns', href: '/dashboard/business/campaigns', icon: ClipboardIcon },
    ]


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
        <>
            <div className="flex h-screen overflow-hidden">
                {/* <!-- Sidebar Start --> */}
                <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} navigation={navigation} />
                {/* <!-- Sidebar End --> */}

                {/* <!-- Content Area Start --> */}
                <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                    {/* <!-- Header Start --> */}
                    <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
                        <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
                            <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
                                {/* <!-- Hamburger Toggle BTN --> */}
                                <button
                                    aria-controls="sidebar"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSidebarOpen(!sidebarOpen);
                                    }}
                                    className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
                                >
                                    <span className="relative block h-5.5 w-5.5 cursor-pointer">
                                        <span className="du-block absolute right-0 h-full w-full">
                                            <span
                                                className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${
                                                    !sidebarOpen && '!w-full delay-300'
                                                }`}
                                            ></span>
                                            <span
                                                className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${
                                                    !sidebarOpen && 'delay-400 !w-full'
                                                }`}
                                            ></span>
                                            <span
                                                className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${
                                                    !sidebarOpen && '!w-full delay-500'
                                                }`}
                                            ></span>
                                        </span>
                                        <span className="absolute right-0 h-full w-full rotate-45">
                                            <span
                                                className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-black delay-300 duration-200 ease-in-out dark:bg-white ${
                                                    !sidebarOpen && '!h-0 !delay-[0]'
                                                }`}
                                            ></span>
                                            <span
                                                className={`absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black delay-400 duration-200 ease-in-out dark:bg-white ${
                                                    !sidebarOpen && '!w-0 !delay-200'
                                                }`}
                                            ></span>
                                        </span>
                                    </span>
                                </button>
                            </div>

                            <div className="hidden sm:block">
                                {/* You can add search bar or other header content here */}
                            </div>

                            <div className="flex items-center gap-3 2xsm:gap-7">
                            </div>
                        </div>
                        
                    </header>
                    {/* <!-- Header End --> */}

                    {/* <!-- Main Content Start --> */}
                    <main className="h-full">
                        <div className="mx-auto max-w-screen-2xl bg-neutral-100 p-4 md:p-6 2xl:p-10 min-h-full rounded-lg">
                            {children}
                        </div>
                    </main>
                    {/* <!-- Main Content End --> */}
                </div>
                {/* <!-- Content Area End --> */}
            </div>
            <div id="modal-root"></div>
        </>
    )
} 