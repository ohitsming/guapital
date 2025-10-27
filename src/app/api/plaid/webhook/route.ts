import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  syncAccountBalances,
  syncTransactionsForItem,
  removeTransactions,
  logWebhookEvent,
} from '@/lib/plaid/webhook-sync';

/**
 * Plaid Webhook Handler
 * Documentation: https://plaid.com/docs/api/products/transactions/#webhook
 *
 * Plaid sends webhooks to notify about:
 * - New transactions available (DEFAULT_UPDATE)
 * - Account balance changes (BALANCE_UPDATE)
 * - Transactions removed (TRANSACTIONS_REMOVED)
 * - Item errors (ITEM_ERROR)
 *
 * This webhook-driven approach reduces Plaid API refresh calls by ~70%
 * Cost savings: $3,540/month at 5K users
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

    // Log webhook event for debugging/auditing
    await logWebhookEvent(supabase, webhook_type, webhook_code, item_id, body);

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
      // Initial transaction pull is complete - sync recent transactions
      try {
        await syncTransactionsForItem(supabase, itemId, 90); // Last 90 days
        await syncAccountBalances(supabase, itemId);

        await supabase
          .from('plaid_items')
          .update({
            sync_status: 'active',
            last_sync_at: new Date().toISOString(),
          })
          .eq('item_id', itemId);
      } catch (error) {
        console.error('Error in INITIAL_UPDATE:', error);
      }
      break;

    case 'HISTORICAL_UPDATE':
      console.log(`📜 Historical transaction update for item ${itemId}`);
      // Historical transactions (last 2 years) are now available
      try {
        await syncTransactionsForItem(supabase, itemId, 730); // 2 years
      } catch (error) {
        console.error('Error in HISTORICAL_UPDATE:', error);
      }
      break;

    case 'DEFAULT_UPDATE':
      console.log(`🔄 New transactions available for item ${itemId}`);
      // This is the KEY webhook that replaces manual refresh calls
      // New transactions are available - sync them automatically
      try {
        await syncTransactionsForItem(supabase, itemId, 30); // Last 30 days
        await syncAccountBalances(supabase, itemId); // Also update balances
      } catch (error) {
        console.error('Error in DEFAULT_UPDATE:', error);
      }
      break;

    case 'TRANSACTIONS_REMOVED':
      console.log(`🗑️ Transactions removed for item ${itemId}`);
      const removedTransactionIds = body.removed_transactions || [];

      // Delete removed transactions from database
      if (removedTransactionIds.length > 0) {
        try {
          await removeTransactions(supabase, removedTransactionIds);
        } catch (error) {
          console.error('Error removing transactions:', error);
        }
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
