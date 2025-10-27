import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { convertPlaidAccountsToManual } from '@/lib/plaid/convert-to-manual';

/**
 * Convert Plaid accounts to manual assets
 *
 * Called when user downgrades from Premium to Free tier
 *
 * Flow:
 * 1. Fetch all active Plaid accounts for user
 * 2. Create manual assets with current balances
 * 3. Call Plaid itemRemove API to stop subscription charges
 * 4. Soft-delete Plaid accounts (mark as inactive, preserve transactions)
 *
 * Benefits:
 * - User continues tracking net worth without interruption
 * - Transaction history preserved for reporting
 * - Plaid per-account fees stop immediately ($0.45/account/month saved)
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use shared conversion logic
    const result = await convertPlaidAccountsToManual(supabase, user.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ Error converting Plaid accounts to manual:', error);
    return NextResponse.json(
      { error: 'Failed to convert accounts', details: error.message },
      { status: 500 }
    );
  }
}
