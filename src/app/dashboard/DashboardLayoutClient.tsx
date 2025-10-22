'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

interface DashboardLayoutClientProps {
    user: User
    children: React.ReactNode
}

export default function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar Navigation */}
            <DashboardNav
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onOpen={() => setIsSidebarOpen(true)}
                user={user}
            />

            {/* Main Content */}
            <div className="lg:ml-64">
                {children}
            </div>
        </div>
    )
}
