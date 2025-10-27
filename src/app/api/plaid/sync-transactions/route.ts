import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { subDays, format } from 'date-fns';
import { getPlaidClient } from '@/lib/plaid/client';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { item_id, days = 90, force = false } = await request.json();

    // INPUT VALIDATION
    if (item_id !== undefined) {
      if (typeof item_id !== 'number' || !Number.isInteger(item_id) || item_id <= 0) {
        return NextResponse.json(
          { error: 'Invalid item_id: must be a positive integer' },
          { status: 400 }
        );
      }
    }

    if (days !== undefined) {
      if (typeof days !== 'number' || !Number.isInteger(days) || days <= 0 || days > 730) {
        return NextResponse.json(
          { error: 'Invalid days parameter: must be between 1 and 730' },
          { status: 400 }
        );
      }
    }

    // COST OPTIMIZATION: Check subscription tier for transaction access
    // DEVELOPMENT MODE: Skip tier check to enable all features
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!isDevelopment) {
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single();

      const tier = userSettings?.subscription_tier || 'free';

      // Free tier users can't sync transactions (Premium+ only feature)
      if (tier === 'free') {
        return NextResponse.json(
          {
            error: 'Premium feature',
            message: 'Transaction syncing is only available for Premium subscribers. Upgrade to access this feature.',
          },
          { status: 403 }
        );
      }
    } else {
      console.log('🔧 Development mode: Skipping subscription tier check for transaction sync');
    }

    // Get all plaid items for the user (or specific item if provided)
    const query = supabase
      .from('plaid_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('sync_status', 'active');

    if (item_id) {
      query.eq('id', item_id);
    }

    const { data: plaidItems, error: itemsError } = await query;

    if (itemsError || !plaidItems || plaidItems.length === 0) {
      return NextResponse.json({ error: 'No active plaid items found' }, { status: 404 });
    }

    let totalTransactionsSynced = 0;
    let cachedItems = 0;

    // Sync transactions for each item
    for (const item of plaidItems) {
      // COST OPTIMIZATION: Check if sync is needed (24-hour cache for transactions too)
      if (!force) {
        const { data: shouldSync } = await supabase
          .rpc('should_sync_plaid_item', { item_id: item.id });

        if (!shouldSync) {
          cachedItems++;
          continue; // Skip API call, use cached data
        }
      }
      try {
        const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
        const endDate = format(new Date(), 'yyyy-MM-dd');

        // Get Plaid client instance
        const plaidClient = getPlaidClient();

        // Get transactions
        const transactionsResponse = await plaidClient.transactionsGet({
          access_token: item.access_token,
          start_date: startDate,
          end_date: endDate,
          options: {
            count: 500,
            offset: 0,
          },
        });

        const transactions = transactionsResponse.data.transactions;

        // Get account mapping
        const { data: accounts } = await supabase
          .from('plaid_accounts')
          .select('id, account_id')
          .eq('plaid_item_id', item.id);

        if (!accounts) continue;

        const accountMap = new Map(accounts.map((a) => [a.account_id, a.id]));

        // Prepare transactions for insertion
        const transactionsToUpsert = transactions.map((txn) => ({
          user_id: user.id,
          plaid_account_id: accountMap.get(txn.account_id),
          transaction_id: txn.transaction_id,
          transaction_date: txn.date,
          authorized_date: txn.authorized_date || null,
          merchant_name: txn.merchant_name || txn.name,
          category: txn.category || [],
          amount: txn.amount,
          currency: txn.iso_currency_code || 'USD',
          pending: txn.pending,
          is_hidden: false,
        }));

        // Upsert transactions (insert or update if exists)
        for (const txn of transactionsToUpsert) {
          const { error: txnError } = await supabase
            .from('plaid_transactions')
            .upsert(txn, {
              onConflict: 'transaction_id',
              ignoreDuplicates: false,
            });

          if (txnError) {
            console.error('Error upserting transaction:', txnError);
          } else {
            totalTransactionsSynced++;
          }
        }

        // Increment sync counter for successful transaction sync
        await supabase.rpc('increment_sync_counter', { item_id: item.id });
      } catch (itemError: any) {
        console.error(`Error syncing transactions for item ${item.id}:`, itemError);
        // Continue with other items even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      transactions_synced: totalTransactionsSynced,
      items_processed: plaidItems.length,
      cached_items: cachedItems,
      message: cachedItems > 0
        ? `${cachedItems} item(s) used cached data (synced within last 24 hours)`
        : 'Successfully synced from Plaid',
    });
  } catch (error: any) {
    console.error('Error syncing transactions:', error);
    return NextResponse.json(
      { error: 'Failed to sync transactions', details: error.message },
      { status: 500 }
    );
  }
}
