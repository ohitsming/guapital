import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/cashflow/monthly
 *
 * Calculates monthly cash flow from Plaid transactions
 *
 * Returns:
 * - income: Total income for the current month (negative amounts = money in)
 * - expenses: Total expenses for the current month (positive amounts = money out)
 * - netIncome: income - expenses
 *
 * Note: Plaid convention:
 * - Positive amounts = debits (money leaving) = EXPENSES
 * - Negative amounts = credits (money coming in) = INCOME
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get current month's date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Format dates for SQL query (YYYY-MM-DD)
    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = endOfMonth.toISOString().split('T')[0];

    // Fetch transactions for current month
    const { data: transactions, error } = await supabase
      .from('plaid_transactions')
      .select('amount, pending, is_hidden')
      .eq('user_id', user.id)
      .eq('is_hidden', false) // Exclude hidden transactions (guilt-free spending)
      .eq('pending', false) // Only include posted transactions
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Calculate income and expenses
    // In Plaid's convention:
    // - Positive amounts = money out (expenses)
    // - Negative amounts = money in (income)
    let totalExpenses = 0;
    let totalIncome = 0;

    transactions.forEach((txn) => {
      const amount = parseFloat(txn.amount.toString());

      if (amount > 0) {
        // Positive = money out = expense
        totalExpenses += amount;
      } else if (amount < 0) {
        // Negative = money in = income (convert to positive for display)
        totalIncome += Math.abs(amount);
      }
      // Skip zero amounts
    });

    const netIncome = totalIncome - totalExpenses;

    return NextResponse.json({
      income: totalIncome,
      expenses: totalExpenses,
      netIncome: netIncome,
      transactionCount: transactions.length,
      period: {
        start: startDate,
        end: endDate,
      },
    });
  } catch (error: any) {
    console.error('Error in monthly cash flow API:', error);
    return NextResponse.json(
      { error: 'Failed to calculate cash flow', details: error.message },
      { status: 500 }
    );
  }
}
