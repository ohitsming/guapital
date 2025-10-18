// Mock data for dashboard - FOR REFERENCE/TESTING ONLY
// This data is NOT used in production dashboard
// Real data should come from API endpoints

export interface MockAccount {
  name: string;
  balance: number;
  type: 'checking' | 'investment' | 'crypto' | 'property' | 'loan' | 'credit';
}

export interface MockTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface MockCategorySpending {
  category: string;
  amount: number;
  percentage: number;
}

export interface MockDashboardData {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  accounts: MockAccount[];
  recentTransactions: MockTransaction[];
  categorySpending: MockCategorySpending[];
}

// Sample data for testing/reference
export const mockDashboardData: MockDashboardData = {
  netWorth: 125430.0,
  totalAssets: 185430.0,
  totalLiabilities: 60000.0,
  monthlyIncome: 8500.0,
  monthlyExpenses: 5200.0,
  savingsRate: 38.8,
  accounts: [
    { name: 'Chase Checking', balance: 12430.0, type: 'checking' },
    { name: 'Vanguard Brokerage', balance: 85000.0, type: 'investment' },
    { name: 'Coinbase Wallet', balance: 15000.0, type: 'crypto' },
    { name: 'Primary Residence', balance: 45000.0, type: 'property' },
    { name: 'Student Loan', balance: -35000.0, type: 'loan' },
    { name: 'Credit Card', balance: -2500.0, type: 'credit' },
  ],
  recentTransactions: [
    { date: '2024-01-15', description: 'Salary Deposit', amount: 8500.0, category: 'Income' },
    { date: '2024-01-14', description: 'Rent Payment', amount: -2200.0, category: 'Housing' },
    { date: '2024-01-12', description: 'Grocery Store', amount: -125.43, category: 'Food' },
    { date: '2024-01-10', description: 'Gas Station', amount: -45.0, category: 'Transportation' },
  ],
  categorySpending: [
    { category: 'Housing', amount: 2200, percentage: 42.3 },
    { category: 'Food & Dining', amount: 650, percentage: 12.5 },
    { category: 'Transportation', amount: 400, percentage: 7.7 },
    { category: 'Utilities', amount: 250, percentage: 4.8 },
    { category: 'Entertainment', amount: 300, percentage: 5.8 },
    { category: 'Other', amount: 1400, percentage: 26.9 },
  ],
};
