import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // TODO: Implement Stripe refund logic here

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignId } = await req.json();

    if (!campaignId) {
        return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    try {
        // Verify that the user owns this campaign before deleting
        const { data: campaign, error: fetchError } = await supabase
            .from('tasks')
            .select('business_id')
            .eq('id', campaignId)
            .single();

        if (fetchError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found or inaccessible' }, { status: 404 });
        }

        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (businessError || !business || business.id !== campaign.business_id) {
            return NextResponse.json({ error: 'Unauthorized to delete this campaign' }, { status: 403 });
        }

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', campaignId);

        if (error) {
            throw error;
        }

        return NextResponse.json({ error: 'Stripe refund implementation pending. Campaign deletion halted.' }, { status: 500 });


        return NextResponse.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
    }
}