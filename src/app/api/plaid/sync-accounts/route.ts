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

    const { item_id, force = false } = await request.json();

    // PREMIUM FEATURE CHECK: Plaid syncing is Premium+ only
    // DEVELOPMENT MODE: Skip check in development to enable all features
    const isDevelopment = process.env.NODE_ENV === 'development';

    let tier = 'premium'; // Default for development

    if (!isDevelopment) {
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single();

      tier = userSettings?.subscription_tier || 'free';

      if (tier === 'free') {
        return NextResponse.json(
          {
            error: 'Premium feature',
            message: 'Plaid account syncing is only available for Premium subscribers. Upgrade to connect your bank accounts automatically.',
          },
          { status: 403 }
        );
      }
    }

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

    // COST OPTIMIZATION: Check if sync is needed (24-hour cache)
    if (!force) {
      const { data: shouldSync } = await supabase
        .rpc('should_sync_plaid_item', { item_id: plaidItem.id });

      if (!shouldSync) {
        // Return cached data without hitting Plaid API
        const { data: accounts } = await supabase
          .from('plaid_accounts')
          .select('*')
          .eq('plaid_item_id', plaidItem.id);

        return NextResponse.json({
          success: true,
          cached: true,
          accounts_synced: accounts?.length || 0,
          last_sync_at: plaidItem.last_successful_sync_at,
          message: 'Using cached data (synced within last 24 hours)',
        });
      }
    }

    // Check sync quota for Premium users (20 syncs/day)
    const { data: hasQuota } = await supabase
      .rpc('check_sync_quota', { p_user_id: user.id, p_tier: tier });

    if (!hasQuota && !force) {
      return NextResponse.json(
        {
          error: 'Daily sync quota exceeded',
          message: 'Daily sync limit reached (7/day). Automatic syncs will continue tomorrow.',
        },
        { status: 429 }
      );
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

      // Increment sync counter and update last sync time
      await supabase.rpc('increment_sync_counter', { item_id: plaidItem.id });

      await supabase
        .from('plaid_items')
        .update({
          sync_status: 'active',
          error_message: null,
        })
        .eq('id', plaidItem.id);

      return NextResponse.json({
        success: true,
        cached: false,
        accounts_synced: accounts.length,
        last_sync_at: new Date().toISOString(),
        message: 'Successfully synced from Plaid',
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
