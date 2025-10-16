
import { SupabaseClient } from '@supabase/supabase-js';

export async function getRecommendedMaxQuota(supabase: SupabaseClient): Promise<number> {
    const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .contains('roles', ['earner']);

    if (error) {
        console.error('Error fetching earner count:', error);
        // Return a default value in case of error
        return 200;
    }

    const totalEarners = count || 0;

    const recommendedPercentage = 0.10;
    const minRecommendedQuota = 50;
    const absoluteMaxQuota = 500;

    let recommendedMaxQuota = Math.floor(totalEarners * recommendedPercentage);

    recommendedMaxQuota = Math.max(minRecommendedQuota, recommendedMaxQuota);
    recommendedMaxQuota = Math.min(absoluteMaxQuota, recommendedMaxQuota);

    if (totalEarners < 200) {
        recommendedMaxQuota = 50;
    }

    return recommendedMaxQuota;
}
