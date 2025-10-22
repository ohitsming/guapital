import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/percentile/opt-in
 *
 * Opt user into percentile tracking
 *
 * Request body:
 * - age_bracket: string (required) - One of: '18-21', '22-25', '26-28', '29-32', '33-35', '36-40', '41+'
 * - birth_year: number (optional) - For more accurate age tracking
 *
 * Returns:
 * - success: boolean
 * - message: string
 * - age_bracket: string
 */
export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { age_bracket, birth_year } = body;

        // Validate age_bracket
        const validBrackets = ['18-21', '22-25', '26-28', '29-32', '33-35', '36-40', '41+'];
        if (!age_bracket || !validBrackets.includes(age_bracket)) {
            return NextResponse.json({
                error: 'Invalid age bracket',
                message: `age_bracket must be one of: ${validBrackets.join(', ')}`
            }, { status: 400 });
        }

        // Calculate date_of_birth from birth_year if provided
        let dateOfBirth = null;
        if (birth_year && typeof birth_year === 'number') {
            if (birth_year < 1900 || birth_year > new Date().getFullYear()) {
                return NextResponse.json({
                    error: 'Invalid birth year',
                    message: 'Birth year must be between 1900 and current year'
                }, { status: 400 });
            }
            // Set to January 1st of birth year for privacy
            dateOfBirth = `${birth_year}-01-01`;
        }

        // Use SECURITY DEFINER function to handle opt-in (bypasses RLS restrictions)
        const { data: optInResult, error: optInError } = await supabase
            .rpc('opt_in_percentile_tracking', {
                p_user_id: user.id,
                p_age_bracket: age_bracket,
                p_date_of_birth: dateOfBirth
            });

        if (optInError) {
            console.error('Error in opt_in_percentile_tracking function:', optInError);
            return NextResponse.json({
                error: 'Failed to opt in to percentile tracking',
                details: optInError.message
            }, { status: 500 });
        }

        // Update consent timestamp for GDPR compliance
        const consentTimestamp = new Date().toISOString();
        const { error: timestampError } = await supabase
            .from('user_demographics')
            .update({
                percentile_consent_timestamp: consentTimestamp,
                updated_at: consentTimestamp
            })
            .eq('user_id', user.id);

        if (timestampError) {
            console.error('Error updating consent timestamp:', timestampError);
            // Don't fail the request - timestamp is for audit purposes only
        }

        // Create a net worth snapshot for today if one doesn't exist
        const today = new Date().toISOString().split('T')[0];
        const { error: snapshotError } = await supabase.rpc('record_user_snapshot', {
            target_user_id: user.id,
            p_snapshot_date: today
        });

        if (snapshotError) {
            console.error('Error creating initial snapshot:', snapshotError);
        }

        // Trigger initial percentile calculation
        const { data: percentileData, error: calcError } = await supabase
            .rpc('calculate_percentile_hybrid', {
                p_user_id: user.id,
                p_age_bracket: age_bracket
            });

        if (calcError) {
            console.error('Error calculating initial percentile:', calcError);
        }

        const result = percentileData && percentileData.length > 0 ? percentileData[0] : null;
        const optInResultData = optInResult && optInResult.length > 0 ? optInResult[0] : null;

        return NextResponse.json({
            success: true,
            message: optInResultData?.percentile_opt_in
                ? 'Percentile tracking updated!'
                : 'You\'re now opted in! Check your rank on the dashboard.',
            age_bracket: age_bracket,
            percentile_available: result && result.percentile !== null,
            current_percentile: result?.percentile || null,
            rank_position: result?.rank_position || null,
            total_users: result?.total_users || null,
            uses_seed_data: result?.uses_seed_data || null
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error in POST /api/percentile/opt-in:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/percentile/opt-in
 *
 * Opt user OUT of percentile tracking
 */
export async function DELETE() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        // Update to opt out
        const { error: updateError } = await supabase
            .from('user_demographics')
            .update({
                percentile_opt_in: false,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

        if (updateError) {
            console.error('Error opting out:', updateError);
            return NextResponse.json({ error: 'Failed to opt out of percentile tracking' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'You have been opted out of percentile tracking. You can opt back in anytime from settings.'
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error in DELETE /api/percentile/opt-in:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
