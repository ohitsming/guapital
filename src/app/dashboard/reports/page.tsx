import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ReportsPageContent } from '@/components/reports/ReportsPageContent'

export default async function ReportsPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen">
            <ReportsPageContent />
        </div>
    )
}
