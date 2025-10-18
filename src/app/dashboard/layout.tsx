import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import {
    HomeIcon,
    WalletIcon,
    CreditCardIcon,
    ChartBarIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline'

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
        <div className="min-h-screen bg-gray-50">
            {/* Top Header */}
            <DashboardHeader user={user} />

            {/* Sidebar Navigation */}
            <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 pt-24">
                <nav className="px-4 space-y-1 mt-4">
                    <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg">
                        <HomeIcon className="w-5 h-5 mr-3" />
                        Dashboard
                    </a>
                    <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                        <WalletIcon className="w-5 h-5 mr-3" />
                        Accounts
                    </a>
                    <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                        <CreditCardIcon className="w-5 h-5 mr-3" />
                        Transactions
                    </a>
                    <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                        <ChartBarIcon className="w-5 h-5 mr-3" />
                        Reports
                    </a>
                    <a href="#" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                        <BanknotesIcon className="w-5 h-5 mr-3" />
                        Budget
                    </a>
                </nav>
            </div>

            {/* Main Content */}
            <div className="ml-64 pt-16">
                {children}
            </div>
        </div>
    )
}
