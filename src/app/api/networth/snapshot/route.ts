import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/networth/snapshot?date=YYYY-MM-DD - Create a net worth snapshot
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get optional date parameter from URL (defaults to today)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    let snapshotDate: string;
    if (dateParam) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateParam)) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      snapshotDate = dateParam;
    } else {
      // Use today's date
      snapshotDate = new Date().toISOString().split('T')[0];
    }

    // Call the database function to record the snapshot
    const { data, error } = await supabase.rpc('record_user_snapshot', {
      target_user_id: user.id,
      p_snapshot_date: snapshotDate,
    });

    if (error) {
      console.error('Error recording snapshot:', error);
      return NextResponse.json(
        { error: 'Failed to record snapshot', details: error.message },
        { status: 500 }
      );
    }

    // Fetch the created snapshot to return to the user
    const { data: snapshot, error: fetchError } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .eq('snapshot_date', snapshotDate)
      .single();

    if (fetchError) {
      console.error('Error fetching created snapshot:', fetchError);
      return NextResponse.json(
        { error: 'Snapshot created but failed to fetch', details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Snapshot recorded successfully',
        snapshot,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/networth/snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/networth/snapshot - Get snapshot for a specific date
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get optional date parameter from URL (defaults to today)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Fetch the snapshot for the specified date
    const { data: snapshot, error } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .eq('snapshot_date', dateParam)
      .maybeSingle();

    if (error) {
      console.error('Error fetching snapshot:', error);
      return NextResponse.json(
        { error: 'Failed to fetch snapshot', details: error.message },
        { status: 500 }
      );
    }

    if (!snapshot) {
      return NextResponse.json(
        { error: 'No snapshot found for this date' },
        { status: 404 }
      );
    }

    return NextResponse.json({ snapshot }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/networth/snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
