import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TrajectoryPageContent } from '@/components/trajectory/TrajectoryPageContent'

export default async function TrajectoryPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen" style={{ background: '#F7F9F9' }}>
            <TrajectoryPageContent />
        </div>
    )
}