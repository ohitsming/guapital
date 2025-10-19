import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { AssetFormData } from '@/lib/interfaces/asset';

// GET /api/assets - Fetch all manual assets for authenticated user
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { data: assets, error } = await supabase
      .from('manual_assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching manual assets:', error);
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }

    return NextResponse.json({ assets }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/assets:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/assets - Create new manual asset
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const body: AssetFormData = await request.json();

    // Validation
    if (!body.asset_name || body.current_value === undefined || !body.category || !body.entry_type) {
      return NextResponse.json(
        { error: 'Missing required fields: asset_name, current_value, category, entry_type' },
        { status: 400 }
      );
    }

    if (body.current_value < 0) {
      return NextResponse.json(
        { error: 'Value must be a positive number' },
        { status: 400 }
      );
    }

    // Validate entry_type
    const validEntryTypes = ['asset', 'liability'];
    if (!validEntryTypes.includes(body.entry_type)) {
      return NextResponse.json(
        { error: 'Invalid entry_type. Must be either "asset" or "liability"' },
        { status: 400 }
      );
    }

    // Validate category based on entry_type
    const assetCategories = ['real_estate', 'vehicle', 'private_equity', 'collectibles', 'cash', 'investment', 'private_stock', 'bonds', 'p2p_lending', 'other'];
    const liabilityCategories = ['mortgage', 'personal_loan', 'business_debt', 'credit_debt', 'other_debt'];
    const validCategories = body.entry_type === 'asset' ? assetCategories : liabilityCategories;

    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: `Invalid category for ${body.entry_type}. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert the asset/liability
    const { data: newAsset, error: insertError } = await supabase
      .from('manual_assets')
      .insert({
        user_id: user.id,
        asset_name: body.asset_name,
        current_value: body.current_value,
        category: body.category,
        entry_type: body.entry_type,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating manual asset:', insertError);
      return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
    }

    // Record initial value in history table
    const { error: historyError } = await supabase.from('manual_asset_history').insert({
      manual_asset_id: newAsset.id,
      user_id: user.id,
      old_value: null,
      new_value: body.current_value,
    });

    if (historyError) {
      console.error('Error recording asset history:', historyError);
      // Don't fail the request if history recording fails
    }

    return NextResponse.json({ asset: newAsset }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/assets:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
