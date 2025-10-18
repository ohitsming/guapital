// Budget-related type definitions

export interface SpendingByCategory {
  category: string;
  amount: number;
  transaction_count: number;
  percentage: number;
  is_hidden: boolean;
}

export interface MonthlySpending {
  month: string; // YYYY-MM
  total_spending: number;
  total_income: number;
  net_cashflow: number;
  categories: SpendingByCategory[];
}

export interface BudgetSummary {
  current_month: MonthlySpending;
  previous_month: MonthlySpending;
  spending_trend: {
    month: string;
    total: number;
  }[];
}

export interface UserSettings {
  id: string;
  user_id: string;
  default_currency: string;
  budget_hidden_categories: string[];
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}
