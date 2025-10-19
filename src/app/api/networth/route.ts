import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NetWorthCalculation, NetWorthBreakdown } from '@/lib/interfaces/networth';

// GET /api/networth - Calculate current net worth from all sources
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Initialize breakdown
    const breakdown: NetWorthBreakdown = {
      cash: 0,
      investments: 0,
      crypto: 0,
      real_estate: 0,
      other: 0,
      credit_card_debt: 0,
      loans: 0,
    };

    // 1. Fetch Plaid accounts
    const { data: plaidAccounts, error: plaidError } = await supabase
      .from('plaid_accounts')
      .select('account_type, account_subtype, current_balance, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (plaidError) {
      console.error('Error fetching Plaid accounts:', plaidError);
    }

    // Process Plaid accounts
    if (plaidAccounts) {
      for (const account of plaidAccounts) {
        const balance = account.current_balance || 0;

        if (account.account_type === 'depository') {
          // Checking, savings accounts -> cash
          breakdown.cash += balance;
        } else if (account.account_type === 'investment') {
          // Investment accounts -> investments
          breakdown.investments += balance;
        } else if (account.account_type === 'credit') {
          // Credit cards -> liabilities (debt)
          // Note: Plaid returns credit card balances as positive numbers representing debt
          breakdown.credit_card_debt += Math.abs(balance);
        } else if (account.account_type === 'loan') {
          // Loans -> liabilities
          breakdown.loans += Math.abs(balance);
        }
      }
    }

    // 2. Fetch crypto holdings
    const { data: cryptoHoldings, error: cryptoError } = await supabase
      .from('crypto_holdings')
      .select('usd_value')
      .eq('user_id', user.id);

    if (cryptoError) {
      console.error('Error fetching crypto holdings:', cryptoError);
    }

    // Process crypto holdings
    if (cryptoHoldings) {
      breakdown.crypto = cryptoHoldings.reduce((sum, holding) => sum + (holding.usd_value || 0), 0);
    }

    // 3. Fetch manual assets (real estate, vehicles, etc.)
    const { data: manualAssets, error: assetsError } = await supabase
      .from('manual_assets')
      .select('current_value, category, entry_type')
      .eq('user_id', user.id);

    if (assetsError) {
      console.error('Error fetching manual assets:', assetsError);
    }

    // Process manual assets
    if (manualAssets) {
      for (const asset of manualAssets) {
        const value = asset.current_value || 0;

        if (asset.entry_type === 'asset') {
          // Assets
          if (asset.category === 'real_estate') {
            breakdown.real_estate += value;
          } else if (asset.category === 'cash') {
            breakdown.cash += value;
          } else if (['investment', 'private_equity', 'private_stock', 'bonds', 'p2p_lending'].includes(asset.category)) {
            breakdown.investments += value;
          } else {
            // vehicle, collectibles, other
            breakdown.other += value;
          }
        } else if (asset.entry_type === 'liability') {
          // Liabilities
          if (asset.category === 'credit_debt') {
            breakdown.credit_card_debt += value;
          } else if (['mortgage', 'personal_loan', 'business_debt', 'other_debt'].includes(asset.category)) {
            breakdown.loans += value;
          }
        }
      }
    }

    // Calculate totals
    const total_assets =
      breakdown.cash +
      breakdown.investments +
      breakdown.crypto +
      breakdown.real_estate +
      breakdown.other;

    const total_liabilities =
      breakdown.credit_card_debt +
      breakdown.loans;

    const net_worth = total_assets - total_liabilities;

    const result: NetWorthCalculation = {
      total_assets,
      total_liabilities,
      net_worth,
      breakdown,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/networth:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
