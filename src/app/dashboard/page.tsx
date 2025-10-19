import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import GetStartedView from '@/components/dashboard/GetStartedView'
import DashboardContent from '@/components/dashboard/DashboardContent'

export default async function Dashboard() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user has any data to determine which view to show
    const [plaidAccountsResult, manualAssetsResult, cryptoWalletsResult] = await Promise.all([
        supabase.from('plaid_accounts').select('id').eq('user_id', user.id).limit(1),
        supabase.from('manual_assets').select('id').eq('user_id', user.id).limit(1),
        supabase.from('crypto_wallets').select('id').eq('user_id', user.id).limit(1),
    ])

    const hasPlaidAccounts = (plaidAccountsResult.data?.length ?? 0) > 0
    const hasManualAssets = (manualAssetsResult.data?.length ?? 0) > 0
    const hasCryptoWallets = (cryptoWalletsResult.data?.length ?? 0) > 0
    const hasAnyData = hasPlaidAccounts || hasManualAssets || hasCryptoWallets

    // Show simplified "Get Started" view for new users with no data
    if (!hasAnyData) {
        return (
            <div className="px-8 py-8">
                <GetStartedView />
            </div>
        )
    }

    // Show full dashboard for users with data
    return <DashboardContent />
}
