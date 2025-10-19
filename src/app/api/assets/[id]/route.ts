import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/assets/[id] - Fetch single asset with history
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { id } = params;

    // Fetch the asset
    const { data: asset, error: assetError } = await supabase
      .from('manual_assets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Fetch edit history
    const { data: history, error: historyError } = await supabase
      .from('manual_asset_history')
      .select('*')
      .eq('manual_asset_id', id)
      .order('changed_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching asset history:', historyError);
    }

    return NextResponse.json({ asset, history: history || [] }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/assets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/assets/[id] - Update asset value
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Fetch current asset to get old value
    const { data: currentAsset, error: fetchError } = await supabase
      .from('manual_assets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !currentAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Validate the update
    const updates: any = {};

    if (body.asset_name !== undefined) {
      if (!body.asset_name.trim()) {
        return NextResponse.json({ error: 'Asset name cannot be empty' }, { status: 400 });
      }
      updates.asset_name = body.asset_name;
    }

    if (body.current_value !== undefined) {
      if (body.current_value < 0) {
        return NextResponse.json(
          { error: 'Asset value must be a positive number' },
          { status: 400 }
        );
      }
      updates.current_value = body.current_value;
    }

    if (body.category !== undefined) {
      // Get valid categories based on the asset's entry_type
      const assetCategories = ['real_estate', 'vehicle', 'private_equity', 'collectibles', 'cash', 'investment', 'private_stock', 'bonds', 'p2p_lending', 'other'];
      const liabilityCategories = ['personal_loan', 'business_debt', 'credit_debt', 'other_debt'];
      const validCategories = currentAsset.entry_type === 'asset' ? assetCategories : liabilityCategories;

      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { error: `Invalid category for ${currentAsset.entry_type}. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
      updates.category = body.category;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Always update the updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // Update the asset
    const { data: updatedAsset, error: updateError } = await supabase
      .from('manual_assets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating asset:', updateError);
      return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
    }

    // If value changed, record in history
    if (body.current_value !== undefined && body.current_value !== currentAsset.current_value) {
      const { error: historyError } = await supabase.from('manual_asset_history').insert({
        manual_asset_id: id,
        user_id: user.id,
        old_value: currentAsset.current_value,
        new_value: body.current_value,
      });

      if (historyError) {
        console.error('Error recording asset history:', historyError);
        // Don't fail the request if history recording fails
      }
    }

    return NextResponse.json({ asset: updatedAsset }, { status: 200 });
  } catch (error: any) {
    console.error('Error in PATCH /api/assets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/[id] - Delete asset
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { id } = params;

    // Delete the asset (history will cascade delete due to FK constraint)
    const { error: deleteError } = await supabase
      .from('manual_assets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting asset:', deleteError);
      return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Asset deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/assets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
