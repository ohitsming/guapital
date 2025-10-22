'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Bars3Icon } from '@heroicons/react/20/solid'

interface DashboardHeaderProps {
    onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
    return (
        <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
            <div className="flex items-center justify-between h-full px-4 lg:px-6 lg:ml-64">
                {/* Hamburger Menu Button - Mobile Only */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Open menu"
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>

                <Link href="/" aria-label="Home" className="flex-1 flex justify-center lg:justify-start">
                    <Logo className="h-8" />
                </Link>

                {/* Empty div to maintain spacing on desktop */}
                <div className="w-10 lg:hidden"></div>
            </div>
        </div>
    )
}
