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

/**
 * Shared conversion logic for Plaid → Manual accounts
 * Used by both:
 * 1. /api/plaid/convert-to-manual (user-initiated)
 * 2. Stripe webhook (automatic on downgrade)
 */
export async function convertPlaidAccountsToManual(supabase: any, userId: string) {
  console.log(`🔄 Converting Plaid accounts to manual for user ${userId}`);

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
    console.error('Error fetching Plaid accounts:', fetchError);
    throw new Error(`Failed to fetch Plaid accounts: ${fetchError.message}`);
  }

  if (!plaidAccounts || plaidAccounts.length === 0) {
    console.log('No active Plaid accounts found for user');
    return {
      success: true,
      accounts_converted: 0,
      items_removed: 0,
      message: 'No Plaid accounts to convert',
    };
  }

  console.log(`Found ${plaidAccounts.length} Plaid accounts to convert`);

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
      console.error('Error creating manual asset:', insertError);
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

    console.log(`✅ Converted ${account.account_name} to manual asset`);
  }

  // Remove Plaid items to stop subscription charges
  let itemsRemoved = 0;
  for (const [itemId, plaidItem] of plaidItemsToRemove) {
    try {
      console.log(`🗑️ Removing Plaid item: ${plaidItem.institution_name}`);
      await plaidClient.itemRemove({
        access_token: plaidItem.access_token,
      });

      // Mark item as removed in database
      await supabase
        .from('plaid_items')
        .update({
          sync_status: 'removed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', plaidItem.id);

      itemsRemoved++;
      console.log(`✅ Removed Plaid item: ${plaidItem.institution_name}`);
    } catch (plaidError: any) {
      console.error(`⚠️ Failed to remove Plaid item ${plaidItem.institution_name}:`, plaidError.message);
    }
  }

  console.log(`✅ Conversion complete: ${convertedAssets.length} accounts converted, ${itemsRemoved} Plaid items removed`);

  return {
    success: true,
    accounts_converted: convertedAssets.length,
    items_removed: itemsRemoved,
    converted_assets: convertedAssets,
    message: `Successfully converted ${convertedAssets.length} Plaid account(s) to manual tracking`,
  };
}
