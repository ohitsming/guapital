import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/networth/snapshot/backfill?days=30&variance=0.05 - Backfill historical snapshots
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get parameters from URL
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const variance = parseFloat(searchParams.get('variance') || '0.05'); // 5% default variance

    // Validate parameters
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 365' },
        { status: 400 }
      );
    }

    if (variance < 0 || variance > 0.5) {
      return NextResponse.json(
        { error: 'Variance must be between 0 and 0.5 (50%)' },
        { status: 400 }
      );
    }

    // Get current net worth to use as baseline
    const currentNetWorthResponse = await fetch(
      `${process.env.NEXT_PUBLIC_ENV_URL || 'http://localhost:3000'}/api/networth`,
      {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      }
    );

    if (!currentNetWorthResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch current net worth' },
        { status: 500 }
      );
    }

    const currentNetWorth = await currentNetWorthResponse.json();
    const baselineNetWorth = currentNetWorth.net_worth;
    const baselineAssets = currentNetWorth.total_assets;
    const baselineLiabilities = currentNetWorth.total_liabilities;
    const baselineBreakdown = currentNetWorth.breakdown;

    // Create historical snapshots with variance
    const today = new Date();
    const snapshots = [];
    const createdSnapshots = [];

    for (let i = days; i >= 1; i--) {
      const snapshotDate = new Date(today);
      snapshotDate.setDate(today.getDate() - i);
      const dateString = snapshotDate.toISOString().split('T')[0];

      // Calculate variance for this day
      // Create a gradual trend from lower value to current value
      const trendFactor = 1 - (i / days) * variance; // Starts at (1 - variance), ends at 1
      const randomVariance = 1 + (Math.random() - 0.5) * variance * 0.2; // Small random fluctuation

      const netWorthValue = baselineNetWorth * trendFactor * randomVariance;
      const assetsValue = baselineAssets * trendFactor * randomVariance;
      const liabilitiesValue = baselineLiabilities * (1 + (Math.random() - 0.5) * variance * 0.1);

      // Scale breakdown proportionally
      const scaleFactor = trendFactor * randomVariance;
      const scaledBreakdown = {
        cash: baselineBreakdown.cash * scaleFactor,
        investments: baselineBreakdown.investments * scaleFactor,
        crypto: baselineBreakdown.crypto * scaleFactor,
        real_estate: baselineBreakdown.real_estate * scaleFactor,
        other: baselineBreakdown.other * scaleFactor,
        credit_card_debt: baselineBreakdown.credit_card_debt * (1 + (Math.random() - 0.5) * variance * 0.1),
        loans: baselineBreakdown.loans * (1 + (Math.random() - 0.5) * variance * 0.1),
      };

      snapshots.push({
        user_id: user.id,
        snapshot_date: dateString,
        total_assets: assetsValue,
        total_liabilities: liabilitiesValue,
        net_worth: netWorthValue,
        breakdown: scaledBreakdown,
      });
    }

    // Insert all snapshots in a single query using upsert
    const { data, error } = await supabase
      .from('net_worth_snapshots')
      .upsert(snapshots, {
        onConflict: 'user_id,snapshot_date',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('Error inserting backfill snapshots:', error);
      return NextResponse.json(
        { error: 'Failed to create backfill snapshots', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully backfilled ${days} days of snapshots`,
        snapshotsCreated: data?.length || 0,
        dateRange: {
          start: snapshots[0]?.snapshot_date,
          end: snapshots[snapshots.length - 1]?.snapshot_date,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/networth/snapshot/backfill:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/networth/snapshot/backfill - Get info about backfill capability
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Check how many snapshots the user already has
    const { count, error } = await supabase
      .from('net_worth_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error counting snapshots:', error);
      return NextResponse.json(
        { error: 'Failed to check existing snapshots', details: error.message },
        { status: 500 }
      );
    }

    // Get oldest and newest snapshot dates
    const { data: oldestSnapshot } = await supabase
      .from('net_worth_snapshots')
      .select('snapshot_date')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: newestSnapshot } = await supabase
      .from('net_worth_snapshots')
      .select('snapshot_date')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json(
      {
        existingSnapshots: count || 0,
        oldestDate: oldestSnapshot?.snapshot_date || null,
        newestDate: newestSnapshot?.snapshot_date || null,
        canBackfill: true,
        maxBackfillDays: 365,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in GET /api/networth/snapshot/backfill:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
