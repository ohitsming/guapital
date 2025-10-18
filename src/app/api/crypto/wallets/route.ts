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

    // Get all wallets with their holdings
    const { data: wallets, error } = await supabase
      .from('crypto_wallets')
      .select(
        `
        *,
        crypto_holdings (*)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wallets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch wallets', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ wallets });
  } catch (error: any) {
    console.error('Error in wallets route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { wallet_address, wallet_name, blockchain } = await request.json();

    if (!wallet_address || !blockchain) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet_address and blockchain' },
        { status: 400 }
      );
    }

    // Validate blockchain
    const validBlockchains = ['ethereum', 'polygon', 'base', 'arbitrum', 'optimism'];
    if (!validBlockchains.includes(blockchain.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid blockchain' }, { status: 400 });
    }

    // Check if wallet already exists
    const { data: existing } = await supabase
      .from('crypto_wallets')
      .select('id')
      .eq('user_id', user.id)
      .eq('wallet_address', wallet_address.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Wallet already added' }, { status: 400 });
    }

    // Insert wallet
    const { data: wallet, error: insertError } = await supabase
      .from('crypto_wallets')
      .insert({
        user_id: user.id,
        wallet_address: wallet_address.toLowerCase(),
        wallet_name: wallet_name || null,
        blockchain: blockchain.toLowerCase(),
        sync_status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting wallet:', insertError);
      return NextResponse.json(
        { error: 'Failed to add wallet', details: insertError.message },
        { status: 500 }
      );
    }

    // Trigger initial sync
    try {
      await fetch(`${process.env.NEXT_PUBLIC_ENV_URL}/api/crypto/sync-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet_id: wallet.id }),
      });
    } catch (syncError) {
      console.error('Error triggering wallet sync:', syncError);
    }

    return NextResponse.json({ wallet });
  } catch (error: any) {
    console.error('Error in add wallet route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('id');

    if (!walletId) {
      return NextResponse.json({ error: 'Missing wallet ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('crypto_wallets')
      .delete()
      .eq('id', walletId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting wallet:', error);
      return NextResponse.json(
        { error: 'Failed to delete wallet', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in delete wallet route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
