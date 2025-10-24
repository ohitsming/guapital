import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Plaid Webhook Handler
 * Documentation: https://plaid.com/docs/api/products/transactions/#webhook
 *
 * Plaid sends webhooks to notify about:
 * - New transactions available
 * - Account updates
 * - Item errors (e.g., login required)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { webhook_type, webhook_code, item_id, error } = body;

    console.log('📥 Plaid Webhook Received:', {
      webhook_type,
      webhook_code,
      item_id,
      timestamp: new Date().toISOString(),
    });

    // Use service role to bypass RLS for background processing
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Handle different webhook types
    switch (webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionWebhook(supabase, webhook_code, item_id, body);
        break;

      case 'ITEM':
        await handleItemWebhook(supabase, webhook_code, item_id, body, error);
        break;

      case 'AUTH':
        console.log('Auth webhook received:', webhook_code);
        break;

      default:
        console.log(`Unhandled webhook type: ${webhook_type}`);
    }

    // Always return 200 to acknowledge receipt (prevents Plaid from retrying)
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Error processing Plaid webhook:', error);
    // Still return 200 to prevent Plaid from retrying indefinitely
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}

/**
 * Handle transaction-related webhooks
 */
async function handleTransactionWebhook(
  supabase: any,
  code: string,
  itemId: string,
  body: any
) {
  switch (code) {
    case 'INITIAL_UPDATE':
      console.log(`✅ Initial transaction update for item ${itemId}`);
      // Initial transaction pull is complete
      // You could trigger a full sync here if needed
      await supabase
        .from('plaid_items')
        .update({
          sync_status: 'active',
          last_sync_at: new Date().toISOString(),
        })
        .eq('item_id', itemId);
      break;

    case 'HISTORICAL_UPDATE':
      console.log(`📜 Historical transaction update for item ${itemId}`);
      // Historical transactions (last 2 years) are now available
      // Trigger a sync if you want to pull them
      break;

    case 'DEFAULT_UPDATE':
      console.log(`🔄 New transactions available for item ${itemId}`);
      // New transactions are available since last sync
      // This is the most common webhook you'll receive
      // Trigger a transaction sync:
      // await syncTransactionsForItem(itemId);
      break;

    case 'TRANSACTIONS_REMOVED':
      console.log(`🗑️ Transactions removed for item ${itemId}`);
      const removedTransactions = body.removed_transactions || [];

      // Delete removed transactions from database
      if (removedTransactions.length > 0) {
        await supabase
          .from('plaid_transactions')
          .delete()
          .in('transaction_id', removedTransactions);

        console.log(`Deleted ${removedTransactions.length} transactions`);
      }
      break;

    default:
      console.log(`Unhandled transaction webhook code: ${code}`);
  }
}

/**
 * Handle item-related webhooks (errors, permission changes, etc.)
 */
async function handleItemWebhook(
  supabase: any,
  code: string,
  itemId: string,
  body: any,
  error: any
) {
  switch (code) {
    case 'ERROR':
      console.error(`❌ Item error for ${itemId}:`, error);

      // Update item status in database
      await supabase
        .from('plaid_items')
        .update({
          sync_status: 'error',
          error_message: error?.error_message || 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('item_id', itemId);

      // Common errors:
      // - ITEM_LOGIN_REQUIRED: User needs to re-authenticate
      // - INVALID_CREDENTIALS: Credentials no longer valid
      // You should notify the user to reconnect their account
      break;

    case 'PENDING_EXPIRATION':
      console.warn(`⚠️ Item ${itemId} will expire soon`);

      await supabase
        .from('plaid_items')
        .update({
          sync_status: 'pending_expiration',
          error_message: 'Item will expire soon. Please reconnect.',
          updated_at: new Date().toISOString(),
        })
        .eq('item_id', itemId);

      // Notify user to reconnect their account before it expires
      // You can send an email or show a banner in the dashboard
      break;

    case 'USER_PERMISSION_REVOKED':
      console.warn(`🚫 User revoked permission for item ${itemId}`);

      await supabase
        .from('plaid_items')
        .update({
          sync_status: 'disconnected',
          error_message: 'User revoked access at their bank',
          updated_at: new Date().toISOString(),
        })
        .eq('item_id', itemId);

      // Mark all associated accounts as inactive
      await supabase
        .from('plaid_accounts')
        .update({ is_active: false })
        .eq('plaid_item_id', itemId);
      break;

    case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
      console.log(`✅ Webhook URL update acknowledged for item ${itemId}`);
      break;

    default:
      console.log(`Unhandled item webhook code: ${code}`);
  }
}

/**
 * GET handler - Return webhook status (useful for testing)
 */
export async function GET(request: Request) {
  return NextResponse.json(
    {
      message: 'Plaid webhook endpoint is active',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
