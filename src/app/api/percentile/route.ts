import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/percentile
 *
 * Get user's current percentile ranking
 *
 * Returns:
 * - opted_in: boolean - whether user is opted into percentile tracking
 * - age_bracket: string - user's age bracket
 * - current_percentile: number - user's percentile (e.g., 87.5 = top 12.5%)
 * - rank_position: number - actual rank (e.g., 127 out of 1024)
 * - total_users: number - total users in age bracket
 * - uses_seed_data: boolean - whether calculation uses blended SCF data
 * - net_worth: number - user's current net worth
 * - milestones: object - achieved and next milestones
 * - distribution: array - percentile distribution for age bracket
 */
export async function GET(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        // Get user demographics
        const { data: demographics, error: demoError } = await supabase
            .from('user_demographics')
            .select('age_bracket, percentile_opt_in, uses_seed_data, last_percentile_calculation')
            .eq('user_id', user.id)
            .single();

        if (demoError && demoError.code !== 'PGRST116') {
            // PGRST116 = no rows returned, which is OK for new users
            console.error('Error fetching user demographics:', demoError);
            return NextResponse.json({ error: 'Failed to fetch user demographics' }, { status: 500 });
        }

        // If user hasn't opted in or no demographics exist
        if (!demographics || !demographics.percentile_opt_in) {
            return NextResponse.json({
                opted_in: false,
                message: 'User has not opted into percentile tracking',
                has_demographics: !!demographics
            });
        }

        // Always update the snapshot for today to ensure percentile reflects current net worth
        // The record_user_snapshot function has ON CONFLICT logic to update if exists
        const today = new Date().toISOString().split('T')[0];
        const { error: snapshotError } = await supabase.rpc('record_user_snapshot', {
            target_user_id: user.id,
            p_snapshot_date: today
        });

        if (snapshotError) {
            console.error('Error creating/updating snapshot:', snapshotError);
        }

        // Call the hybrid percentile calculation function
        const { data: percentileData, error: calcError } = await supabase
            .rpc('calculate_percentile_hybrid', {
                p_user_id: user.id,
                p_age_bracket: demographics.age_bracket
            });

        if (calcError) {
            console.error('Error calculating percentile:', calcError);
            return NextResponse.json({ error: 'Failed to calculate percentile' }, { status: 500 });
        }

        // Get the first result (rpc returns array)
        const result = percentileData && percentileData.length > 0 ? percentileData[0] : null;

        if (!result || result.percentile === null) {
            return NextResponse.json({
                opted_in: true,
                age_bracket: demographics.age_bracket,
                message: 'No net worth data available yet. Add accounts to see your rank!',
                current_percentile: null,
                rank_position: null,
                total_users: null
            });
        }

        // Get user's current net worth
        const { data: netWorthData } = await supabase
            .from('net_worth_snapshots')
            .select('net_worth')
            .eq('user_id', user.id)
            .order('snapshot_date', { ascending: false })
            .limit(1)
            .single();

        const currentNetWorth = netWorthData?.net_worth || 0;

        // Get achieved milestones
        const { data: milestones } = await supabase
            .from('percentile_milestones')
            .select('milestone_type, achieved_at, net_worth_at_achievement')
            .eq('user_id', user.id)
            .order('achieved_at', { ascending: false });

        const achievedMilestones = milestones ? milestones.map(m => m.milestone_type) : [];

        // Calculate next milestone info
        let nextMilestone: any = null;
        if (result.next_milestone_type && result.next_milestone_net_worth) {
            const gap = result.next_milestone_net_worth - currentNetWorth;
            const milestoneLabels: Record<string, string> = {
                'top_50': 'Top 50%',
                'top_25': 'Top 25%',
                'top_10': 'Top 10%',
                'top_5': 'Top 5%',
                'top_1': 'Top 1%'
            };

            nextMilestone = {
                type: result.next_milestone_type,
                label: milestoneLabels[result.next_milestone_type] || result.next_milestone_type,
                required_net_worth: result.next_milestone_net_worth,
                gap: gap,
                current_progress: gap > 0 ? (currentNetWorth / result.next_milestone_net_worth) * 100 : 100
            };
        }

        // Get distribution data for charts
        const { data: distribution } = await supabase
            .rpc('get_percentile_distribution', {
                p_age_bracket: demographics.age_bracket
            });

        // Calculate percentile change (if we have historical data)
        const { data: historicalSnapshot } = await supabase
            .from('percentile_snapshots')
            .select('percentile, snapshot_date')
            .eq('user_id', user.id)
            .lt('snapshot_date', new Date().toISOString().split('T')[0])
            .order('snapshot_date', { ascending: false })
            .limit(1)
            .single();

        let percentileChange30d = null;
        if (historicalSnapshot && historicalSnapshot.percentile) {
            const daysDiff = Math.floor(
                (new Date().getTime() - new Date(historicalSnapshot.snapshot_date).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            if (daysDiff <= 35) { // Within ~30 days
                percentileChange30d = result.percentile - historicalSnapshot.percentile;
            }
        }

        return NextResponse.json({
            opted_in: true,
            age_bracket: demographics.age_bracket,
            current_percentile: result.percentile,
            rank_position: result.rank_position,
            total_users: result.total_users,
            net_worth: currentNetWorth,
            uses_seed_data: result.uses_seed_data,
            last_updated: demographics.last_percentile_calculation || new Date().toISOString(),
            milestones: {
                achieved: achievedMilestones,
                next: nextMilestone,
                total_unlocked: achievedMilestones.length
            },
            distribution: distribution || [],
            insights: {
                percentile_change_30d: percentileChange30d,
                is_climbing: percentileChange30d ? percentileChange30d > 0 : null
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error in GET /api/percentile:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
