import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { SubscriptionProvider } from '@/lib/context/SubscriptionContext'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <SubscriptionProvider>
            <div className="min-h-screen bg-gray-50">
                {/* Top Header */}
                <DashboardHeader user={user} />

                {/* Sidebar Navigation */}
                <DashboardNav />

                {/* Main Content */}
                <div className="ml-64 pt-16">
                    {children}
                </div>
            </div>
        </SubscriptionProvider>
    )
}
