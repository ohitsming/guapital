import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/percentile/distribution?age_bracket=26-28
 *
 * Get anonymous percentile distribution data for an age bracket
 * Used for rendering distribution charts
 *
 * Query params:
 * - age_bracket: string (required) - One of: '18-21', '22-25', '26-28', '29-32', '33-35', '36-40', '41+'
 *
 * Returns:
 * - age_bracket: string
 * - total_users: number - approximate number of users in bracket
 * - distribution: array - percentile thresholds for P10, P25, P50, P75, P90, P95, P99
 * - source: string - 'scf_2022' or 'real_users' or 'blended'
 */
export async function GET(request: Request) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const ageBracket = searchParams.get('age_bracket');

        // Validate age_bracket
        const validBrackets = ['18-21', '22-25', '26-28', '29-32', '33-35', '36-40', '41+'];
        if (!ageBracket || !validBrackets.includes(ageBracket)) {
            return NextResponse.json({
                error: 'Invalid or missing age bracket',
                message: `age_bracket must be one of: ${validBrackets.join(', ')}`
            }, { status: 400 });
        }

        // Get distribution data from the database function
        const { data: distribution, error: distError } = await supabase
            .rpc('get_percentile_distribution', {
                p_age_bracket: ageBracket
            });

        if (distError) {
            console.error('Error fetching distribution:', distError);
            return NextResponse.json({ error: 'Failed to fetch distribution data' }, { status: 500 });
        }

        // Count real users in this bracket
        const { count: realUserCount } = await supabase
            .from('user_demographics')
            .select('*', { count: 'exact', head: true })
            .eq('age_bracket', ageBracket)
            .eq('percentile_opt_in', true);

        // Determine data source
        const totalUsers = realUserCount || 0;
        let dataSource = 'scf_2022';
        if (totalUsers >= 1000) {
            dataSource = 'real_users';
        } else if (totalUsers >= 100) {
            dataSource = 'blended';
        }

        // Format distribution data with labels
        const formattedDistribution = (distribution || []).map((item: any) => ({
            percentile: item.percentile,
            min_net_worth: item.min_net_worth,
            label: `P${item.percentile}`,
            formatted_value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(item.min_net_worth)
        }));

        // Get key statistics
        const p50 = formattedDistribution.find((d: any) => d.percentile === 50);
        const p90 = formattedDistribution.find((d: any) => d.percentile === 90);
        const p10 = formattedDistribution.find((d: any) => d.percentile === 10);

        return NextResponse.json({
            age_bracket: ageBracket,
            total_users: totalUsers,
            distribution: formattedDistribution,
            source: dataSource,
            stats: {
                median: p50?.min_net_worth || 0,
                median_formatted: p50?.formatted_value || '$0',
                p90_threshold: p90?.min_net_worth || 0,
                p10_threshold: p10?.min_net_worth || 0,
                range: p90 && p10 ? (p90.min_net_worth - p10.min_net_worth) : 0
            },
            disclaimer: dataSource === 'scf_2022' || dataSource === 'blended'
                ? `Based on Federal Reserve Survey of Consumer Finances 2022 data${totalUsers > 0 ? ` and ${totalUsers} Guapital users` : ''}`
                : `Based on ${totalUsers} Guapital users in this age group`
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error in GET /api/percentile/distribution:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
