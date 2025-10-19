import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { TrendDataPoint } from '@/lib/interfaces/subscription';

// GET /api/networth/history?days=30 - Get historical net worth snapshots
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
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Calculate the date range
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch snapshots from the database (exclude today to always use live data)
    const { data: snapshots, error } = await supabase
      .from('net_worth_snapshots')
      .select('snapshot_date, net_worth')
      .eq('user_id', user.id)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .lt('snapshot_date', todayString) // Exclude today's snapshot
      .order('snapshot_date', { ascending: true });

    if (error) {
      console.error('Error fetching snapshots:', error);
      return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
    }

    // If no historical snapshots exist, check if there's a snapshot from today
    // This handles the case for brand new users who just created their first snapshot
    if (!snapshots || snapshots.length === 0) {
      const { data: todaySnapshot, error: todayError } = await supabase
        .from('net_worth_snapshots')
        .select('snapshot_date, net_worth')
        .eq('user_id', user.id)
        .eq('snapshot_date', todayString)
        .maybeSingle();

      if (!todayError && todaySnapshot) {
        // Return today's snapshot so new users see something
        const trendData: TrendDataPoint[] = [{
          date: todaySnapshot.snapshot_date,
          value: todaySnapshot.net_worth,
        }];
        return NextResponse.json({ trendData }, { status: 200 });
      }
    }

    // Transform to TrendDataPoint format
    const trendData: TrendDataPoint[] = (snapshots || []).map(snapshot => ({
      date: snapshot.snapshot_date,
      value: snapshot.net_worth,
    }));

    return NextResponse.json({ trendData }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/networth/history:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
