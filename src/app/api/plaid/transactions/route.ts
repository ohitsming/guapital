import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch transactions with account information
    const { data: transactions, error } = await supabase
      .from('plaid_transactions')
      .select(`
        *,
        plaid_accounts!inner (
          account_name,
          account_type,
          plaid_items!inner (
            institution_name
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_hidden', false)
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Format transactions for frontend
    const formattedTransactions = transactions.map((txn: any) => ({
      id: txn.id,
      transaction_id: txn.transaction_id,
      date: txn.transaction_date,
      authorized_date: txn.authorized_date,
      merchant_name: txn.merchant_name,
      category: Array.isArray(txn.category) ? txn.category : [],
      amount: txn.amount,
      currency: txn.currency,
      pending: txn.pending,
      ai_category: txn.ai_category,
      ai_confidence: txn.ai_confidence,
      account_name: txn.plaid_accounts?.account_name,
      account_type: txn.plaid_accounts?.account_type,
      institution_name: txn.plaid_accounts?.plaid_items?.institution_name,
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      count: formattedTransactions.length,
    });
  } catch (error: any) {
    console.error('Error in transactions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error.message },
      { status: 500 }
    );
  }
}
