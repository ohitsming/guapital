import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from './DashboardLayoutClient'
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
            <DashboardLayoutClient user={user}>
                {children}
            </DashboardLayoutClient>
        </SubscriptionProvider>
    )
}
