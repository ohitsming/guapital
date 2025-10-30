import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getPlaidClient } from '@/lib/plaid/client';

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

    console.log('Plaid accounts API - User ID:', user.id);
    console.log('Plaid accounts API - Accounts found:', accounts?.length || 0);
    console.log('Plaid accounts API - Error:', error);
    console.log('Plaid accounts API - Data:', JSON.stringify(accounts, null, 2));

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

    // Get the account and check how many accounts exist for this plaid_item
    const { data: account, error: fetchError } = await supabase
      .from('plaid_accounts')
      .select('plaid_item_id, account_name, plaid_items(id, access_token, institution_name)')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    // Handle case where account doesn't exist (already deleted or never existed)
    if (fetchError) {
      console.error('Error fetching account for deletion:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch account', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!account) {
      console.log('Account not found, may have been already deleted:', accountId);
      return NextResponse.json(
        { error: 'Account not found. It may have already been deleted.' },
        { status: 404 }
      );
    }

    const plaidItem = account.plaid_items as any;

    if (!plaidItem) {
      console.error('No plaid_items found for account:', accountId);
      return NextResponse.json(
        { error: 'Associated Plaid connection not found' },
        { status: 404 }
      );
    }

    // Check how many ACTIVE accounts exist for this plaid_item
    const { data: siblingAccounts, error: countError } = await supabase
      .from('plaid_accounts')
      .select('id')
      .eq('plaid_item_id', account.plaid_item_id)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (countError) {
      console.error('Error counting sibling accounts:', countError);
      return NextResponse.json(
        { error: 'Failed to check related accounts', details: countError.message },
        { status: 500 }
      );
    }

    const accountCount = siblingAccounts?.length || 0;
    console.log(`Found ${accountCount} active account(s) for ${plaidItem.institution_name}`);

    // If this is the LAST active account, remove the entire plaid_item
    if (accountCount === 1) {
      console.log(`Last account - removing entire Plaid connection for ${plaidItem.institution_name}`);

      // Call Plaid API to remove item (stops subscription charges)
      try {
        const plaidClient = getPlaidClient();
        await plaidClient.itemRemove({
          access_token: plaidItem.access_token,
        });
        console.log('Successfully removed Plaid item via API');
      } catch (plaidError: any) {
        // Log error but continue with database deletion
        console.error('Plaid itemRemove failed (continuing with database deletion):', plaidError.message);
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
          { error: 'Failed to delete Plaid connection', details: deleteError.message },
          { status: 500 }
        );
      }

      console.log(`Removed ${plaidItem.institution_name} and all associated accounts`);

      return NextResponse.json({
        success: true,
        message: `Removed ${plaidItem.institution_name} connection and all accounts`,
        removed_item: true
      });
    }

    // If there are other accounts, just soft-delete this specific account
    console.log(`Soft-deleting account "${account.account_name}" (${accountCount - 1} other account(s) remain)`);

    const { error: softDeleteError } = await supabase
      .from('plaid_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (softDeleteError) {
      console.error('Error soft-deleting account:', softDeleteError);
      return NextResponse.json(
        { error: 'Failed to remove account', details: softDeleteError.message },
        { status: 500 }
      );
    }

    console.log(`Soft-deleted account "${account.account_name}"`);

    return NextResponse.json({
      success: true,
      message: `Removed "${account.account_name}" (${accountCount - 1} account(s) remaining)`,
      removed_item: false
    });
  } catch (error: any) {
    console.error('Error in delete account route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
