// Net worth and financial snapshot type definitions

export interface NetWorthBreakdown {
  // Assets
  cash: number;
  investments: number;
  crypto: number;
  real_estate: number;
  other: number;
  // Liabilities (detailed breakdown)
  mortgage: number;
  personal_loan: number;
  business_debt: number;
  credit_debt: number;
  other_debt: number;
  // Legacy fields for backward compatibility
  credit_card_debt: number; // Same as credit_debt
  loans: number; // Sum of mortgage + personal_loan + business_debt + other_debt
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  breakdown: NetWorthBreakdown;
  created_at: string;
}

export interface NetWorthCalculation {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  breakdown: NetWorthBreakdown;
}

export interface NetWorthTrend {
  date: string;
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
}

export interface NetWorthDashboardData {
  current: NetWorthCalculation;
  history: NetWorthTrend[];
  change_30d: number;
  change_30d_percent: number;
  change_90d: number;
  change_90d_percent: number;
  change_365d: number;
  change_365d_percent: number;
}
