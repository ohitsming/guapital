import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { format, subDays } from 'date-fns';

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

/**
 * Sync account balances for a specific Plaid item
 * Called by webhook when Plaid detects balance changes
 */
export async function syncAccountBalances(supabase: any, itemId: string) {
  try {
    console.log(`🔄 Syncing account balances for item ${itemId}`);

    // Get the plaid item
    const { data: plaidItem, error: itemError } = await supabase
      .from('plaid_items')
      .select('access_token, user_id')
      .eq('item_id', itemId)
      .single();

    if (itemError || !plaidItem) {
      console.error('❌ Plaid item not found:', itemError);
      throw new Error(`Plaid item not found: ${itemId}`);
    }

    // Fetch latest balances from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: plaidItem.access_token,
    });

    const accounts = accountsResponse.data.accounts;

    // Update balances in database
    for (const account of accounts) {
      await supabase
        .from('plaid_accounts')
        .update({
          current_balance: account.balances.current || 0,
          available_balance: account.balances.available || null,
          last_balance_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('account_id', account.account_id)
        .eq('user_id', plaidItem.user_id);
    }

    console.log(`✅ Synced ${accounts.length} account balances for item ${itemId}`);
    return { success: true, accounts_synced: accounts.length };
  } catch (error: any) {
    console.error('❌ Error syncing account balances:', error);
    throw error;
  }
}

/**
 * Sync transactions for a specific Plaid item
 * Called by webhook when new transactions are available
 */
export async function syncTransactionsForItem(supabase: any, itemId: string, days = 30) {
  try {
    console.log(`🔄 Syncing transactions for item ${itemId}`);

    // Get the plaid item
    const { data: plaidItem, error: itemError } = await supabase
      .from('plaid_items')
      .select('id, access_token, user_id')
      .eq('item_id', itemId)
      .single();

    if (itemError || !plaidItem) {
      console.error('❌ Plaid item not found:', itemError);
      throw new Error(`Plaid item not found: ${itemId}`);
    }

    // Fetch transactions from Plaid
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    const endDate = format(new Date(), 'yyyy-MM-dd');

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: plaidItem.access_token,
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
      .eq('plaid_item_id', plaidItem.id);

    if (!accounts || accounts.length === 0) {
      console.warn('⚠️ No accounts found for item:', itemId);
      return { success: true, transactions_synced: 0 };
    }

    const accountMap = new Map(accounts.map((a: any) => [a.account_id, a.id]));

    // Prepare transactions for upsert
    const transactionsToUpsert = transactions.map((txn) => ({
      user_id: plaidItem.user_id,
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

    // Upsert transactions in batches
    const batchSize = 500;
    let totalSynced = 0;

    for (let i = 0; i < transactionsToUpsert.length; i += batchSize) {
      const batch = transactionsToUpsert.slice(i, i + batchSize);
      const { error: txnError } = await supabase
        .from('plaid_transactions')
        .upsert(batch, {
          onConflict: 'transaction_id',
          ignoreDuplicates: false,
        });

      if (!txnError) {
        totalSynced += batch.length;
      } else {
        console.error('❌ Error upserting transaction batch:', txnError);
      }
    }

    // Update last sync timestamp
    await supabase
      .from('plaid_items')
      .update({
        last_sync_at: new Date().toISOString(),
        webhook_last_received_at: new Date().toISOString(),
      })
      .eq('item_id', itemId);

    console.log(`✅ Synced ${totalSynced} transactions for item ${itemId}`);
    return { success: true, transactions_synced: totalSynced };
  } catch (error: any) {
    console.error('❌ Error syncing transactions:', error);
    throw error;
  }
}

/**
 * Remove transactions that were deleted/cancelled at the bank
 * Called by webhook when Plaid sends TRANSACTIONS_REMOVED event
 */
export async function removeTransactions(supabase: any, removedTransactionIds: string[]) {
  try {
    console.log(`🗑️ Removing ${removedTransactionIds.length} transactions`);

    const { error } = await supabase
      .from('plaid_transactions')
      .delete()
      .in('transaction_id', removedTransactionIds);

    if (error) {
      console.error('❌ Error removing transactions:', error);
      throw error;
    }

    console.log(`✅ Removed ${removedTransactionIds.length} transactions`);
    return { success: true, transactions_removed: removedTransactionIds.length };
  } catch (error: any) {
    console.error('❌ Error removing transactions:', error);
    throw error;
  }
}

/**
 * Log webhook event for debugging/auditing
 */
export async function logWebhookEvent(
  supabase: any,
  webhookType: string,
  webhookCode: string,
  itemId: string,
  payload: any
) {
  try {
    await supabase.from('webhook_event_log').insert({
      webhook_type: webhookType,
      webhook_code: webhookCode,
      item_id: itemId,
      payload,
      received_at: new Date().toISOString(),
    });
  } catch (error) {
    // Don't fail webhook processing if logging fails
    console.error('⚠️ Failed to log webhook event:', error);
  }
}
