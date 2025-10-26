import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { TrendDataPoint } from '@/lib/interfaces/subscription';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/networth/history?days=30 - Get historical net worth snapshots
// Returns both simple trend data (for Dashboard) and full snapshots (for Reports page)
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get days parameter from URL
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90', 10);

    // Calculate the date range
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch full snapshots from the database (include ALL fields)
    const { data: snapshots, error } = await supabase
      .from('net_worth_snapshots')
      .select('snapshot_date, total_assets, total_liabilities, net_worth, breakdown')
      .eq('user_id', user.id)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (error) {
      console.error('Error fetching snapshots:', error);
      return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
    }

    // Transform to simple TrendDataPoint format for Dashboard
    const trendData: TrendDataPoint[] = (snapshots || []).map(snapshot => ({
      date: snapshot.snapshot_date,
      value: snapshot.net_worth,
    }));

    // Return both formats to support both Dashboard and Reports page
    return NextResponse.json({
      trendData,           // Simple format for Dashboard trend chart
      snapshots: snapshots || []  // Full format for Reports page analytics
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/networth/history:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
