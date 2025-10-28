import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { logger } from '@/utils/logger';

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
 * Shared conversion logic for Plaid → Manual accounts
 * Used by both:
 * 1. /api/plaid/convert-to-manual (user-initiated)
 * 2. Stripe webhook (automatic on downgrade)
 */
export async function convertPlaidAccountsToManual(supabase: any, userId: string) {
  logger.info('Starting Plaid to manual conversion', {
    userId,
    action: 'convert_plaid_to_manual_start'
  });

  // Fetch all active Plaid accounts
  const { data: plaidAccounts, error: fetchError } = await supabase
    .from('plaid_accounts')
    .select(`
      *,
      plaid_items (
        id,
        item_id,
        access_token,
        institution_name
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (fetchError) {
    logger.error('Failed to fetch Plaid accounts for conversion', fetchError, {
      userId,
      action: 'convert_fetch_accounts_error'
    });
    throw new Error(`Failed to fetch Plaid accounts: ${fetchError.message}`);
  }

  if (!plaidAccounts || plaidAccounts.length === 0) {
    logger.info('No active Plaid accounts found for user', {
      userId,
      action: 'convert_no_accounts_found'
    });
    return {
      success: true,
      accounts_converted: 0,
      items_removed: 0,
      message: 'No Plaid accounts to convert',
    };
  }

  logger.info('Found Plaid accounts to convert', {
    userId,
    accountCount: plaidAccounts.length,
    action: 'convert_accounts_found'
  });

  const convertedAssets: any[] = [];
  const plaidItemsToRemove = new Map<string, any>();

  // Group accounts by Plaid item
  for (const account of plaidAccounts) {
    const plaidItem = (account as any).plaid_items;
    if (plaidItem && !plaidItemsToRemove.has(plaidItem.item_id)) {
      plaidItemsToRemove.set(plaidItem.item_id, plaidItem);
    }
  }

  // Convert each account to manual asset
  for (const account of plaidAccounts) {
    const plaidItem = (account as any).plaid_items;
    const isLiability = account.account_type === 'credit' || account.account_type === 'loan';

    // Map Plaid account types to manual asset categories
    let category = 'other';
    if (isLiability) {
      category = account.account_type === 'credit' ? 'credit_debt' : 'personal_loan';
    } else {
      // Asset categories
      switch (account.account_type) {
        case 'depository':
          category = 'cash';
          break;
        case 'investment':
        case 'brokerage':
          category = 'investment';
          break;
        default:
          category = 'other';
      }
    }

    // Create manual asset
    const { data: manualAsset, error: insertError } = await supabase
      .from('manual_assets')
      .insert({
        user_id: userId,
        asset_name: account.account_name,
        entry_type: isLiability ? 'liability' : 'asset',
        category,
        current_value: Math.abs(account.current_balance),
        notes: `Converted from ${plaidItem?.institution_name || 'Plaid'} on ${new Date().toLocaleDateString()}`,
        converted_from_plaid_account_id: account.id,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to create manual asset during conversion', insertError, {
        userId,
        accountId: account.id,
        accountName: account.account_name,
        action: 'convert_create_manual_asset_error'
      });
      continue;
    }

    convertedAssets.push(manualAsset);

    // Mark Plaid account as inactive and link to manual asset
    await supabase
      .from('plaid_accounts')
      .update({
        is_active: false,
        converted_to_manual_asset_id: manualAsset.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id);

    logger.info('Successfully converted Plaid account to manual asset', {
      userId,
      plaidAccountId: account.id,
      plaidAccountName: account.account_name,
      manualAssetId: manualAsset.id,
      action: 'convert_account_success'
    });
  }

  // Remove Plaid items to stop subscription charges
  let itemsRemoved = 0;
  for (const [, plaidItem] of plaidItemsToRemove) {
    try {
      logger.info('Attempting to remove Plaid item', {
        userId,
        plaidItemId: plaidItem.id,
        itemId: plaidItem.item_id,
        institutionName: plaidItem.institution_name,
        action: 'plaid_item_remove_attempt'
      });

      // Call Plaid API to remove item (stops billing)
      await plaidClient.itemRemove({
        access_token: plaidItem.access_token,
      });

      logger.info('Successfully called Plaid itemRemove API', {
        userId,
        plaidItemId: plaidItem.id,
        itemId: plaidItem.item_id,
        institutionName: plaidItem.institution_name,
        action: 'plaid_api_remove_success'
      });

      // Mark item as removed in database
      const { error: updateError } = await supabase
        .from('plaid_items')
        .update({
          sync_status: 'removed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', plaidItem.id);

      if (updateError) {
        logger.error('Failed to update Plaid item status to removed', updateError, {
          userId,
          plaidItemId: plaidItem.id,
          institutionName: plaidItem.institution_name,
          action: 'plaid_db_update_error'
        });
      } else {
        logger.info('Plaid item marked as removed in database', {
          userId,
          plaidItemId: plaidItem.id,
          itemId: plaidItem.item_id,
          institutionName: plaidItem.institution_name,
          action: 'plaid_db_update_success'
        });
      }

      itemsRemoved++;
    } catch (plaidError: any) {
      logger.error('Failed to remove Plaid item via API', plaidError, {
        userId,
        plaidItemId: plaidItem.id,
        itemId: plaidItem.item_id,
        institutionName: plaidItem.institution_name,
        errorMessage: plaidError.message,
        errorCode: plaidError.error_code,
        action: 'plaid_item_remove_failure'
      });
    }
  }

  logger.info('Plaid to manual conversion completed', {
    userId,
    accountsConverted: convertedAssets.length,
    itemsRemoved,
    totalItemsAttempted: plaidItemsToRemove.size,
    action: 'convert_plaid_to_manual_complete',
    success: true
  });

  return {
    success: true,
    accounts_converted: convertedAssets.length,
    items_removed: itemsRemoved,
    converted_assets: convertedAssets,
    message: `Successfully converted ${convertedAssets.length} Plaid account(s) to manual tracking`,
  };
}
