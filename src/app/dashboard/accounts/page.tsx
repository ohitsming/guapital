import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AccountsPageContent } from '@/components/accounts/AccountsPageContent'

export default async function AccountsPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen">
            <AccountsPageContent />
        </div>
    )
}
