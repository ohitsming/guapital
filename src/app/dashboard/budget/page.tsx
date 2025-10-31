import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { BudgetPageContent } from '@/components/budget/BudgetPageContent'

export default async function BudgetPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen">
            <BudgetPageContent />
        </div>
    )
}
