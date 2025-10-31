/**
 * Default Annual Growth Rates by Asset Category
 *
 * These rates are used for net worth trajectory projections.
 * All rates are annual percentages in decimal format (e.g., 0.07 = 7% per year).
 *
 * Based on historical market averages and should be adjusted based on individual
 * circumstances and risk tolerance.
 */

export const GROWTH_RATE_CONFIG = {
  // ============================================================================
  // TRADITIONAL ASSETS
  // ============================================================================

  /**
   * Cash & Cash Equivalents
   */
  cash: 0.001,          // 0.1% - Minimal interest
  checking: 0.001,      // 0.1% - Minimal interest
  savings: 0.02,        // 2% - High-yield savings accounts
  cd: 0.04,             // 4% - Certificates of Deposit

  /**
   * Investment Accounts
   */
  brokerage: 0.07,      // 7% - Stock market historical average (S&P 500)
  investment: 0.07,     // 7% - General investment accounts

  /**
   * Retirement Accounts
   */
  '401k': 0.07,         // 7% - 401(k) retirement accounts
  '403b': 0.07,         // 7% - 403(b) for non-profits/education
  roth: 0.07,           // 7% - Roth IRA
  ira: 0.07,            // 7% - Traditional IRA
  '529': 0.06,          // 6% - Education savings plans
  hsa: 0.07,            // 7% - Health Savings Accounts

  // ============================================================================
  // CRYPTOCURRENCY
  // ============================================================================

  crypto: 0.15,         // 15% - General crypto (high volatility)
  ethereum: 0.15,       // 15% - Ethereum
  bitcoin: 0.20,        // 20% - Bitcoin (historically higher, more volatile)
  polygon: 0.15,        // 15% - Polygon
  base: 0.15,           // 15% - Base
  arbitrum: 0.15,       // 15% - Arbitrum
  optimism: 0.15,       // 15% - Optimism

  // ============================================================================
  // REAL ESTATE
  // ============================================================================

  real_estate: 0.05,    // 5% - General property appreciation
  home: 0.04,           // 4% - Primary residence appreciation
  rental_property: 0.08, // 8% - Rental income + appreciation

  // ============================================================================
  // ALTERNATIVE INVESTMENTS
  // ============================================================================

  commodity: 0.03,      // 3% - Gold, silver, commodities
  art: 0.06,            // 6% - Art and collectibles
  business: 0.10,       // 10% - Business ownership/equity
  other_investment: 0.05, // 5% - Other alternative investments

  // ============================================================================
  // LIABILITIES - Interest Rates
  // ============================================================================
  // Note: These are POSITIVE interest rates for liabilities.
  // These are default interest rates used when users don't specify custom rates.
  //
  // Database: manual_assets.interest_rate (nullable)
  // - When NULL: uses these defaults (as positive values, e.g., 0.06 = 6%)
  // - When set: uses user's custom value
  //
  // For trajectory calculations, we use these rates + loan terms to calculate
  // monthly payments with proper principal/interest split.
  //
  // The trajectory calculation logic uses Math.abs() to ensure proper handling,
  // but we store them as positive values for consistency.

  credit_card: 0.00,    // 20% APR - High interest credit card debt
  mortgage: 0.06,       // 6% APR - Typical mortgage interest rate
  auto_loan: 0.06,      // 6% APR - Auto loan interest rate
  student_loan: 0.05,   // 5% APR - Student loan interest rate
  personal_loan: 0.10,  // 10% APR - Personal loan interest rate
  other_liability: 0.08, // 8% APR - Generic debt interest rate
  loan: 0.08,           // 8% APR - Generic loan interest rate
  credit: 0.18,         // 18% APR - Credit/revolving debt

  // ============================================================================
  // MANUAL ENTRIES & FALLBACK
  // ============================================================================

  manual_asset: 0.05,   // 5% - Conservative default for manual entries
  other: 0.05,          // 5% - Conservative fallback for uncategorized assets
  asset: 0.05,          // 5% - Generic asset type
  liability: 0.0,       // Generic liability type
} as const

/**
 * Default growth rate for assets without a specific category match
 */
export const DEFAULT_FALLBACK_RATE = 0.05 // 5%

/**
 * Default Loan Terms by Category (in years)
 *
 * These defaults are used when users don't specify custom loan terms.
 * Users can override these in the UI when adding/editing liabilities.
 *
 * Database: manual_assets.loan_term_years (nullable)
 * - When NULL: uses these defaults
 * - When set: uses user's custom value
 */
export const LOAN_TERM_CONFIG = {
  // Credit cards - treated as revolving debt (minimum payment = 2-3% of balance)
  credit_card: 0, // Revolving credit
  credit: 0,      // Revolving credit

  // Fixed-term loans (typical terms)
  mortgage: 30,        // 30-year mortgage
  auto_loan: 5,        // 5-year auto loan
  student_loan: 10,    // 10-year student loan (standard repayment)
  personal_loan: 5,    // 5-year personal loan
  other_liability: 5,  // 5-year default for generic debt
  loan: 5,            // 5-year default for generic loan
  liability: 0,       // Generic liability (no term)
} as const

/**
 * Default fallback loan term (in years) for unmatched categories
 */
export const DEFAULT_LOAN_TERM = 5 // 5 years

/**
 * Get the growth rate for a given category
 * Performs fuzzy matching if exact match not found
 */
export function getGrowthRateForCategory(category: string): number {
  const normalizedCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '_')

  // Check exact match first
  if (normalizedCategory in GROWTH_RATE_CONFIG) {
    return GROWTH_RATE_CONFIG[normalizedCategory as keyof typeof GROWTH_RATE_CONFIG]
  }

  // Check partial matches
  for (const [key, rate] of Object.entries(GROWTH_RATE_CONFIG)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      return rate
    }
  }

  // Return fallback rate if no match
  return DEFAULT_FALLBACK_RATE
}

/**
 * Get a human-readable label for a category's growth rate
 */
export function getGrowthRateLabel(category: string): string {
  const rate = getGrowthRateForCategory(category)
  return `${(rate * 100).toFixed(1)}%`
}

/**
 * Get the loan term (in years) for a given category
 * Performs fuzzy matching if exact match not found
 */
export function getLoanTermForCategory(category: string): number {
  const normalizedCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '_')

  // Check exact match first
  if (normalizedCategory in LOAN_TERM_CONFIG) {
    return LOAN_TERM_CONFIG[normalizedCategory as keyof typeof LOAN_TERM_CONFIG]
  }

  // Check partial matches
  for (const [key, term] of Object.entries(LOAN_TERM_CONFIG)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      return term
    }
  }

  // Return fallback term if no match
  return DEFAULT_LOAN_TERM
}

/**
 * Calculate monthly payment for a loan using amortization formula
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * Where:
 *   M = Monthly payment
 *   P = Principal (loan balance)
 *   r = Monthly interest rate (annual rate / 12)
 *   n = Total number of payments (years * 12)
 *
 * For revolving credit (term = 0), returns minimum payment of 3% of balance
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  termInYears: number
): number {
  // Handle revolving credit (credit cards)
  if (termInYears === 0) {
    // Minimum payment = 3% of balance (industry standard)
    return Math.abs(principal) * 0.03
  }

  // Handle zero interest or already paid off
  if (annualInterestRate === 0 || principal <= 0) {
    return 0
  }

  const monthlyRate = Math.abs(annualInterestRate) / 12
  const numPayments = termInYears * 12

  // Amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, numPayments)
  const denominator = Math.pow(1 + monthlyRate, numPayments) - 1

  const monthlyPayment = Math.abs(principal) * (numerator / denominator)

  return monthlyPayment
}

/**
 * Calculate the interest portion of the first month's payment
 * Interest = Current Balance * (Annual Rate / 12)
 */
export function calculateMonthlyInterest(
  balance: number,
  annualInterestRate: number
): number {
  if (balance <= 0 || annualInterestRate === 0) {
    return 0
  }
  const monthlyRate = Math.abs(annualInterestRate) / 12
  return Math.abs(balance) * monthlyRate
}

/**
 * Calculate the principal portion of a payment
 * Principal = Total Payment - Interest
 */
export function calculatePrincipalPayment(
  balance: number,
  annualInterestRate: number,
  termInYears: number
): number {
  const totalPayment = calculateMonthlyPayment(balance, annualInterestRate, termInYears)
  const interestPayment = calculateMonthlyInterest(balance, annualInterestRate)
  return totalPayment - interestPayment
}

/**
 * Calculate remaining balance after one month's payment
 */
export function calculateRemainingBalance(
  balance: number,
  annualInterestRate: number,
  termInYears: number
): number {
  const principal = calculatePrincipalPayment(balance, annualInterestRate, termInYears)
  return Math.max(0, Math.abs(balance) - principal)
}

/**
 * Get total monthly liability payments for all user liabilities
 * Used in trajectory calculations to determine true monthly expenses
 */
export function calculateTotalLiabilityPayments(
  liabilities: Array<{
    balance: number;
    category: string;
    loan_term_years?: number | null;
    interest_rate?: number | null;
  }>
): number {
  return liabilities.reduce((total, liability) => {
    // Use user-provided values if available, otherwise use defaults from config
    const interestRate = liability.interest_rate ?? getGrowthRateForCategory(liability.category)
    const term = liability.loan_term_years ?? getLoanTermForCategory(liability.category)

    const monthlyPayment = calculateMonthlyPayment(
      liability.balance,
      interestRate,
      term
    )
    return total + monthlyPayment
  }, 0)
}

/**
 * Get total monthly INTEREST payments (not principal)
 * This is the true "expense" - principal payments are transfers to net worth
 */
export function calculateTotalInterestExpense(
  liabilities: Array<{
    balance: number;
    category: string;
    loan_term_years?: number | null;
    interest_rate?: number | null;
  }>
): number {
  return liabilities.reduce((total, liability) => {
    // Use user-provided values if available, otherwise use defaults from config
    const interestRate = liability.interest_rate ?? getGrowthRateForCategory(liability.category)

    const monthlyInterest = calculateMonthlyInterest(
      liability.balance,
      interestRate
    )
    return total + monthlyInterest
  }, 0)
}
