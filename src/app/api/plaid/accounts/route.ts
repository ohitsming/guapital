import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get all ACTIVE accounts for the user (RLS policy filters inactive ones)
    // Inactive accounts are those converted to manual assets on downgrade
    const { data: accounts, error } = await supabase
      .from('plaid_accounts')
      .select(
        `
        *,
        plaid_items (
          institution_name,
          sync_status,
          last_sync_at
        )
      `
      )
      .eq('user_id', user.id)
      .eq('is_active', true) // Only show active Plaid accounts
      .order('created_at', { ascending: false });

    console.log('🔍 Plaid accounts API - User ID:', user.id);
    console.log('🔍 Plaid accounts API - Accounts found:', accounts?.length || 0);
    console.log('🔍 Plaid accounts API - Error:', error);
    console.log('🔍 Plaid accounts API - Data:', JSON.stringify(accounts, null, 2));

    if (error) {
      console.error('Error fetching accounts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch accounts', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error('Error in accounts route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json({ error: 'Missing account ID' }, { status: 400 });
    }

    // Get the plaid_item_id and access_token for this account
    const { data: account, error: fetchError } = await supabase
      .from('plaid_accounts')
      .select('plaid_item_id, plaid_items(id, access_token, institution_name)')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !account) {
      console.error('Error fetching account:', fetchError);
      return NextResponse.json(
        { error: 'Account not found', details: fetchError?.message },
        { status: 404 }
      );
    }

    const plaidItem = account.plaid_items as any;

    if (!plaidItem) {
      console.error('No plaid_items found for account');
      return NextResponse.json(
        { error: 'Plaid item not found' },
        { status: 404 }
      );
    }

    // HARD DELETE: Call Plaid API to remove item (stops subscription charges)
    try {
      console.log(`🗑️ Calling Plaid itemRemove for institution: ${plaidItem.institution_name}`);
      await plaidClient.itemRemove({
        access_token: plaidItem.access_token,
      });
      console.log('✅ Successfully removed Plaid item');
    } catch (plaidError: any) {
      // Log error but continue with database deletion
      // This ensures we clean up even if Plaid API fails
      console.error('⚠️ Plaid itemRemove failed (continuing with database deletion):', plaidError.message);
    }

    // Delete the plaid_items record (CASCADE will delete all accounts and transactions)
    const { error: deleteError } = await supabase
      .from('plaid_items')
      .delete()
      .eq('id', plaidItem.id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting plaid_items:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete Plaid item', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Hard deleted Plaid item and all associated accounts/transactions`);

    return NextResponse.json({
      success: true,
      message: 'Plaid account permanently removed. Subscription charges stopped.'
    });
  } catch (error: any) {
    console.error('Error in delete account route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
