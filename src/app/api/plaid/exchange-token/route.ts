import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { PlaidItem } from '@/lib/interfaces/plaid';

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

    const { public_token, metadata } = await request.json();

    if (!public_token) {
      return NextResponse.json({ error: 'Missing public_token' }, { status: 400 });
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get institution details
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    });

    const institutionId = itemResponse.data.item.institution_id!;

    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ['US'] as any,
    });

    const institutionName = institutionResponse.data.institution.name;

    // Check if user has already connected this institution
    const { data: existingItem } = await supabase
      .from('plaid_items')
      .select('id, institution_id')
      .eq('user_id', user.id)
      .eq('institution_id', institutionId)
      .maybeSingle();

    let plaidItem: PlaidItem | null = null;

    if (existingItem) {
      // Update existing connection with new access token
      const { data: updatedItem, error: updateError } = await supabase
        .from('plaid_items')
        .update({
          item_id: itemId,
          access_token: accessToken,
          sync_status: 'active',
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating plaid item:', updateError);
        return NextResponse.json(
          { error: 'Failed to update plaid item', details: updateError.message },
          { status: 500 }
        );
      }

      plaidItem = updatedItem;

      // Delete old accounts associated with this item (will be replaced with fresh data)
      await supabase
        .from('plaid_accounts')
        .delete()
        .eq('plaid_item_id', existingItem.id);
    } else {
      // Insert new plaid item
      const { data: newItem, error: insertError } = await supabase
        .from('plaid_items')
        .insert({
          user_id: user.id,
          item_id: itemId,
          access_token: accessToken,
          institution_id: institutionId,
          institution_name: institutionName,
          sync_status: 'active',
          last_sync_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting plaid item:', insertError);
        return NextResponse.json(
          { error: 'Failed to insert plaid item', details: insertError.message },
          { status: 500 }
        );
      }

      plaidItem = newItem;
    }

    if (!plaidItem) {
      console.error('Error storing plaid item: plaidItem is null');
      return NextResponse.json(
        { error: 'Failed to store plaid item' },
        { status: 500 }
      );
    }

    // Get accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts;

    // Store accounts in database
    const accountsToInsert = accounts.map((account) => ({
      user_id: user.id,
      plaid_item_id: plaidItem!.id, // Safe: we checked for null above
      account_id: account.account_id,
      account_name: account.name,
      account_type: account.type,
      account_subtype: account.subtype || null,
      current_balance: account.balances.current || 0,
      available_balance: account.balances.available || null,
      currency: account.balances.iso_currency_code || 'USD',
      is_active: true,
    }));

    const { error: accountsError } = await supabase
      .from('plaid_accounts')
      .insert(accountsToInsert);

    if (accountsError) {
      console.error('Error storing accounts:', accountsError);
      return NextResponse.json(
        { error: 'Failed to store accounts', details: accountsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item_id: itemId,
      institution_name: institutionName,
      accounts_count: accounts.length,
    });
  } catch (error: any) {
    console.error('Error exchanging token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange token', details: error.message },
      { status: 500 }
    );
  }
}
