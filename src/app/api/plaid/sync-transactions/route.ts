import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { subDays, format } from 'date-fns';

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

    const { item_id, days = 90 } = await request.json();

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

    // Sync transactions for each item
    for (const item of plaidItems) {
      try {
        const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
        const endDate = format(new Date(), 'yyyy-MM-dd');

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
      } catch (itemError: any) {
        console.error(`Error syncing transactions for item ${item.id}:`, itemError);
        // Continue with other items even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      transactions_synced: totalTransactionsSynced,
      items_processed: plaidItems.length,
    });
  } catch (error: any) {
    console.error('Error syncing transactions:', error);
    return NextResponse.json(
      { error: 'Failed to sync transactions', details: error.message },
      { status: 500 }
    );
  }
}
