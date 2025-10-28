import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NetWorthCalculation, NetWorthBreakdown } from '@/lib/interfaces/networth';
import { logger } from '@/utils/logger';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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
      // Assets
      cash: 0,
      investments: 0,
      crypto: 0,
      real_estate: 0,
      other: 0,
      // Liabilities (detailed)
      mortgage: 0,
      personal_loan: 0,
      business_debt: 0,
      credit_debt: 0,
      other_debt: 0,
      // Legacy fields
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
      logger.error('Error fetching Plaid accounts', {
        userId: user.id,
        error: plaidError.message,
        code: plaidError.code,
      });
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
          breakdown.credit_debt += Math.abs(balance);
        } else if (account.account_type === 'loan') {
          // Loans -> liabilities (defaulting to personal_loan for Plaid)
          // In the future, could use account_subtype to differentiate
          breakdown.personal_loan += Math.abs(balance);
        }
      }
    }

    // 2. Fetch crypto holdings
    const { data: cryptoHoldings, error: cryptoError } = await supabase
      .from('crypto_holdings')
      .select('usd_value')
      .eq('user_id', user.id);

    if (cryptoError) {
      logger.error('Error fetching crypto holdings', {
        userId: user.id,
        error: cryptoError.message,
        code: cryptoError.code,
      });
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
      logger.error('Error fetching manual assets', {
        userId: user.id,
        error: assetsError.message,
        code: assetsError.code,
      });
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
          // Liabilities - track in detailed categories
          switch (asset.category) {
            case 'mortgage':
              breakdown.mortgage += value;
              break;
            case 'personal_loan':
              breakdown.personal_loan += value;
              break;
            case 'business_debt':
              breakdown.business_debt += value;
              break;
            case 'credit_debt':
              breakdown.credit_debt += value;
              break;
            case 'other_debt':
              breakdown.other_debt += value;
              break;
          }
        }
      }
    }

    // Populate legacy fields for backward compatibility
    breakdown.credit_card_debt = breakdown.credit_debt;
    breakdown.loans = breakdown.mortgage + breakdown.personal_loan + breakdown.business_debt + breakdown.other_debt;

    // Calculate totals
    const total_assets =
      breakdown.cash +
      breakdown.investments +
      breakdown.crypto +
      breakdown.real_estate +
      breakdown.other;

    const total_liabilities =
      breakdown.mortgage +
      breakdown.personal_loan +
      breakdown.business_debt +
      breakdown.credit_debt +
      breakdown.other_debt;

    const net_worth = total_assets - total_liabilities;

    const result: NetWorthCalculation = {
      total_assets,
      total_liabilities,
      net_worth,
      breakdown,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    logger.error('Error calculating net worth', error, {
      route: '/api/networth',
      userId: user?.id,
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
