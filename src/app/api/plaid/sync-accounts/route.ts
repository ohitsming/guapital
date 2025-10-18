import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { item_id } = await request.json();

    // Get the plaid item from database
    const { data: plaidItem, error: itemError } = await supabase
      .from('plaid_items')
      .select('*')
      .eq('user_id', user.id)
      .eq(item_id ? 'id' : 'user_id', item_id || user.id)
      .single();

    if (itemError || !plaidItem) {
      return NextResponse.json({ error: 'Plaid item not found' }, { status: 404 });
    }

    try {
      // Sync accounts
      const accountsResponse = await plaidClient.accountsGet({
        access_token: plaidItem.access_token,
      });

      const accounts = accountsResponse.data.accounts;

      // Update existing accounts
      for (const account of accounts) {
        await supabase
          .from('plaid_accounts')
          .update({
            current_balance: account.balances.current || 0,
            available_balance: account.balances.available || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('account_id', account.account_id);
      }

      // Update last sync time
      await supabase
        .from('plaid_items')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: 'active',
          error_message: null,
        })
        .eq('id', plaidItem.id);

      return NextResponse.json({
        success: true,
        accounts_synced: accounts.length,
        last_sync_at: new Date().toISOString(),
      });
    } catch (plaidError: any) {
      // Update sync status to error
      await supabase
        .from('plaid_items')
        .update({
          sync_status: 'error',
          error_message: plaidError.message,
        })
        .eq('id', plaidItem.id);

      throw plaidError;
    }
  } catch (error: any) {
    console.error('Error syncing accounts:', error);
    return NextResponse.json(
      { error: 'Failed to sync accounts', details: error.message },
      { status: 500 }
    );
  }
}
