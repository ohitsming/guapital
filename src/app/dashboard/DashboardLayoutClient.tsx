'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

interface DashboardLayoutClientProps {
    user: User
    children: React.ReactNode
}

export default function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen">
            {/* Sidebar Navigation */}
            <DashboardNav
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onOpen={() => setIsSidebarOpen(true)}
                user={user}
            />

            {/* Floating Header */}
            <DashboardHeader
                onMenuClick={() => setIsSidebarOpen(true)}
                user={user}
            />

            {/* Main Content */}
            <div className="pt-24 lg:pt-0 lg:ml-64 px-2 md:px-4 md:px-8 lg:px-12">
                {children}
            </div>
        </div>
    )
}
