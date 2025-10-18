// Net worth and financial snapshot type definitions

export interface NetWorthBreakdown {
  cash: number;
  investments: number;
  crypto: number;
  real_estate: number;
  other: number;
  credit_card_debt: number;
  loans: number;
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
