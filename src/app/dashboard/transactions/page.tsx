import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TransactionsPageContent } from '@/components/transactions/TransactionsPageContent'

export default async function TransactionsPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen" style={{ background: '#F7F9F9' }}>
            <TransactionsPageContent />
        </div>
    )
}
