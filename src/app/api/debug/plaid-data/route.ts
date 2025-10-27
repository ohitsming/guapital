import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get all plaid items
    const { data: plaidItems, error: itemsError } = await supabase
      .from('plaid_items')
      .select('*')
      .eq('user_id', user.id);

    // Get all plaid accounts
    const { data: plaidAccounts, error: accountsError } = await supabase
      .from('plaid_accounts')
      .select(`
        *,
        plaid_items (
          institution_name,
          sync_status,
          last_sync_at
        )
      `)
      .eq('user_id', user.id);

    // Get all manual assets
    const { data: manualAssets, error: assetsError } = await supabase
      .from('manual_assets')
      .select('*')
      .eq('user_id', user.id);

    // Get all crypto wallets
    const { data: cryptoWallets, error: cryptoError } = await supabase
      .from('crypto_wallets')
      .select('*')
      .eq('user_id', user.id);

    return NextResponse.json({
      user_id: user.id,
      plaid_items: {
        count: plaidItems?.length || 0,
        data: plaidItems || [],
        error: itemsError?.message || null,
      },
      plaid_accounts: {
        count: plaidAccounts?.length || 0,
        data: plaidAccounts || [],
        error: accountsError?.message || null,
      },
      manual_assets: {
        count: manualAssets?.length || 0,
        data: manualAssets || [],
        error: assetsError?.message || null,
      },
      crypto_wallets: {
        count: cryptoWallets?.length || 0,
        data: cryptoWallets || [],
        error: cryptoError?.message || null,
      },
    });
  } catch (error: any) {
    console.error('Error in debug route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
