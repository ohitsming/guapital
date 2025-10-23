import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/founding-members/remaining - Get remaining founding member slots
export async function GET() {
  try {
    const supabase = createClient();

    // If stripe_price_id column doesn't exist or env var not set, return full availability
    // This allows the modal to work even before Stripe is fully configured
    if (!process.env.STRIPE_PRICE_FOUNDING) {
      console.warn('STRIPE_PRICE_FOUNDING env var not set, returning default availability');
      return NextResponse.json({
        total: 0,
        remaining: 1000,
        isFull: false,
        limit: 1000,
      }, { status: 200 });
    }

    // Count users with founding member pricing
    const { count, error } = await supabase
      .from('user_settings')
      .select('user_id', { count: 'exact', head: true })
      .eq('subscription_tier', 'premium')
      .eq('stripe_price_id', process.env.STRIPE_PRICE_FOUNDING);

    if (error) {
      console.error('Error counting founding members:', error);
      // Return default availability if query fails (column might not exist yet)
      return NextResponse.json({
        total: 0,
        remaining: 1000,
        isFull: false,
        limit: 1000,
      }, { status: 200 });
    }

    const total = count || 0;
    const remaining = Math.max(0, 1000 - total);
    const isFull = remaining === 0;

    return NextResponse.json({
      total,
      remaining,
      isFull,
      limit: 1000,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/founding-members/remaining:', error);
    // Return default availability on any error
    return NextResponse.json({
      total: 0,
      remaining: 1000,
      isFull: false,
      limit: 1000,
    }, { status: 200 });
  }
}
