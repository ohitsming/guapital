/**
 * Tests for Trajectory (FIRE Calculator) API endpoints
 */

import { createClient } from '@/utils/supabase/server'
import { GET } from '@/app/api/trajectory/route'
import { GET as getHistory } from '@/app/api/trajectory/history/route'
import { POST as simulate } from '@/app/api/trajectory/simulate/route'
import { NextRequest } from 'next/server'
import {
  calculateMonthlyPayment,
  calculateMonthlyInterest,
  calculatePrincipalPayment,
  calculateRemainingBalance,
  calculateTotalLiabilityPayments,
  calculateTotalInterestExpense,
  getLoanTermForCategory,
  getGrowthRateForCategory,
} from '@/lib/config/growth-rates'

// Mock Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('Trajectory API', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
      })),
      rpc: jest.fn(),
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('GET /api/trajectory', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new Request('http://localhost/api/trajectory')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should calculate trajectory for authenticated user with transactions', async () => {
      const mockUser = { id: 'test-user-id' }
      const mockNetWorth = {
        total_assets: 100000,
        total_liabilities: 20000,
      }
      const mockTransactions = [
        { amount: -5000, category: 'Transfer' }, // Income (avg $1,666.67/mo)
        { amount: 3000, category: 'Food' }, // Expense (avg $1,000/mo)
      ]
      // Monthly: $1,666.67 income, $1,000 expense = $666.67 savings (40% savings rate)
      // Annual expenses: $1,000 * 12 = $12,000
      // FIRE number: $12,000 * 25 = $300,000
      const mockTrajectoryResult = [{
        years_to_fire: 15.5,
        months_to_fire: 186,
        fire_number: 300000,
        savings_rate: 40,
        projected_date: '2040-10-28',
      }]
      const mockScenarios = [{
        conservative_years: 18,
        conservative_date: '2043-10-28',
        base_years: 15.5,
        base_date: '2040-10-28',
        aggressive_years: 13,
        aggressive_date: '2038-10-28',
      }]
      const mockMilestones = [{
        coast_fire_achieved: false,
        coast_fire_amount: 100000,
        lean_fire_achieved: false,
        lean_fire_amount: 240000,
        fire_achieved: false,
        fire_amount: 300000,
        fat_fire_achieved: false,
        fat_fire_amount: 450000,
      }]

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock demographics query
      mockSupabaseClient.from.mockImplementation((table: string) => {
        const queryBuilder = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn(),
          upsert: jest.fn().mockResolvedValue({ error: null }),
        }

        if (table === 'user_demographics') {
          queryBuilder.single.mockResolvedValue({
            data: { age: 30 },
            error: null,
          })
        } else if (table === 'net_worth_snapshots') {
          queryBuilder.single.mockResolvedValue({
            data: mockNetWorth,
            error: null,
          })
        } else if (table === 'manual_assets') {
          // Mock manual liabilities
          queryBuilder.eq.mockReturnValue({
            ...queryBuilder,
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })
        } else if (table === 'plaid_accounts') {
          // Mock Plaid liabilities
          queryBuilder.eq.mockReturnValue({
            ...queryBuilder,
            in: jest.fn().mockReturnValue({
              ...queryBuilder,
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          })
        } else if (table === 'plaid_transactions') {
          queryBuilder.eq.mockReturnValue({
            ...queryBuilder,
            gte: jest.fn().mockResolvedValue({
              data: mockTransactions,
              error: null,
            }),
          })
        } else if (table === 'trajectory_snapshots' || table === 'trajectory_milestones') {
          queryBuilder.upsert.mockResolvedValue({ error: null })
        }

        return queryBuilder
      })

      // Mock RPC calls
      mockSupabaseClient.rpc.mockImplementation((funcName: string) => {
        if (funcName === 'calculate_trajectory') {
          return Promise.resolve({ data: mockTrajectoryResult })
        } else if (funcName === 'calculate_trajectory_scenarios') {
          return Promise.resolve({ data: mockScenarios })
        } else if (funcName === 'calculate_fire_milestones') {
          return Promise.resolve({ data: mockMilestones })
        }
        return Promise.resolve({ data: null })
      })

      const request = new Request('http://localhost/api/trajectory')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      // Verify response structure
      expect(data).toHaveProperty('current_status')
      expect(data).toHaveProperty('fire_calculation')
      expect(data).toHaveProperty('projections')
      expect(data).toHaveProperty('milestones')
      expect(data).toHaveProperty('insights')

      // Verify calculations
      expect(data.current_status.current_net_worth).toBe(80000)
      expect(data.projections.base_case.years_to_fire).toBe(15.5)
      expect(data.fire_calculation.fire_number).toBe(300000)
    })

    it('should handle users with no transaction data', async () => {
      const mockUser = { id: 'test-user-id' }
      const mockNetWorth = {
        total_assets: 50000,
        total_liabilities: 0,
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        const queryBuilder = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn(),
        }

        if (table === 'user_demographics') {
          queryBuilder.single.mockResolvedValue({
            data: { age: 30 },
            error: null,
          })
        } else if (table === 'net_worth_snapshots') {
          queryBuilder.single.mockResolvedValue({
            data: mockNetWorth,
            error: null,
          })
        } else if (table === 'manual_assets') {
          // Mock manual liabilities
          queryBuilder.eq.mockReturnValue({
            ...queryBuilder,
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })
        } else if (table === 'plaid_accounts') {
          // Mock Plaid liabilities
          queryBuilder.eq.mockReturnValue({
            ...queryBuilder,
            in: jest.fn().mockReturnValue({
              ...queryBuilder,
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          })
        } else if (table === 'plaid_transactions') {
          queryBuilder.eq.mockReturnValue({
            ...queryBuilder,
            gte: jest.fn().mockResolvedValue({
              data: [], // No transactions
              error: null,
            }),
          })
        }

        return queryBuilder
      })

      const request = new Request('http://localhost/api/trajectory')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.error).toContain('No transaction data available')
      expect(data.current_status.monthly_income).toBe(0)
      expect(data.current_status.monthly_expenses).toBe(0)
    })
  })

  describe('GET /api/trajectory/history', () => {
    it('should return historical trajectory data', async () => {
      const mockUser = { id: 'test-user-id' }
      const mockSnapshots = [
        {
          snapshot_date: '2025-10-28',
          savings_rate: 45,
          current_net_worth: 100000,
          fire_number: 750000,
          years_to_fire: 15,
          projected_fire_date: '2040-10-28',
        },
        {
          snapshot_date: '2025-09-28',
          savings_rate: 42,
          current_net_worth: 95000,
          fire_number: 750000,
          years_to_fire: 16,
          projected_fire_date: '2041-09-28',
        },
      ]

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockSnapshots,
          error: null,
        }),
      }))

      const request = new Request('http://localhost/api/trajectory/history?days=30')
      const response = await getHistory(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.snapshots).toHaveLength(2)
      expect(data.trends).toBeDefined()
      expect(data.trends.savings_rate_change_30d).toBe(3) // 45 - 42
      expect(data.trends.net_worth_growth_30d).toBe(5000) // 100000 - 95000
    })
  })

  describe('POST /api/trajectory/simulate', () => {
    it('should simulate trajectory with custom inputs', async () => {
      const mockUser = { id: 'test-user-id' }
      const mockTrajectoryResult = [{
        years_to_fire: 10,
        months_to_fire: 120,
        fire_number: 500000,
        savings_rate: 60,
        projected_date: '2035-10-28',
      }]

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { age: 30 },
          error: null,
        }),
      }))

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockTrajectoryResult,
      })

      const requestBody = {
        monthly_income: 8000,
        monthly_expenses: 3200,
        current_net_worth: 150000,
        expected_return: 0.08,
      }

      const request = new Request('http://localhost/api/trajectory/simulate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await simulate(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.current_status.monthly_income).toBe(8000)
      expect(data.current_status.monthly_expenses).toBe(3200)
      expect(data.current_status.monthly_savings).toBe(4800)
      expect(data.current_status.savings_rate).toBe(60)
    })

    it('should reject invalid simulation inputs', async () => {
      const mockUser = { id: 'test-user-id' }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const requestBody = {
        monthly_income: -1000, // Invalid negative income
        monthly_expenses: 2000,
      }

      const request = new Request('http://localhost/api/trajectory/simulate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await simulate(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('must be positive values')
    })
  })

  describe('FIRE calculation logic', () => {
    it('should correctly calculate FIRE number as 25x annual expenses', () => {
      const monthlyExpenses = 4000
      const annualExpenses = monthlyExpenses * 12
      const fireNumber = annualExpenses * 25

      expect(fireNumber).toBe(1200000) // 4000 * 12 * 25
    })

    it('should correctly calculate savings rate', () => {
      const monthlyIncome = 10000
      const monthlyExpenses = 6000
      const monthlySavings = monthlyIncome - monthlyExpenses
      const savingsRate = (monthlySavings / monthlyIncome) * 100

      expect(savingsRate).toBe(40) // (4000 / 10000) * 100
    })

    it('should handle edge case where user is already financially independent', () => {
      const currentNetWorth = 2000000
      const fireNumber = 1000000

      const yearsToFire = currentNetWorth >= fireNumber ? 0 : null

      expect(yearsToFire).toBe(0)
    })

    it('should handle negative savings rate scenario', () => {
      const monthlyIncome = 5000
      const monthlyExpenses = 6000
      const monthlySavings = monthlyIncome - monthlyExpenses

      expect(monthlySavings).toBe(-1000)
      // With negative savings, years to FIRE should be null/undefined
    })
  })

  describe('Liability payment calculations', () => {
    it('should correctly calculate monthly payment for a 30-year mortgage', () => {
      const principal = 300000
      const annualRate = 0.06 // 6%
      const term = 30

      const monthlyPayment = calculateMonthlyPayment(principal, annualRate, term)

      // Monthly payment should be around $1,799
      expect(monthlyPayment).toBeGreaterThan(1790)
      expect(monthlyPayment).toBeLessThan(1810)
    })

    it('should correctly calculate monthly payment for a 5-year auto loan', () => {
      const principal = 30000
      const annualRate = 0.06 // 6%
      const term = 5

      const monthlyPayment = calculateMonthlyPayment(principal, annualRate, term)

      // Monthly payment should be around $580
      expect(monthlyPayment).toBeGreaterThan(575)
      expect(monthlyPayment).toBeLessThan(585)
    })

    it('should correctly calculate minimum payment for credit card (3% of balance)', () => {
      const principal = 5000
      const annualRate = 0.20 // 20%
      const term = 0 // Revolving credit

      const monthlyPayment = calculateMonthlyPayment(principal, annualRate, term)

      // Minimum payment should be 3% of balance = $150
      expect(monthlyPayment).toBe(150)
    })

    it('should return 0 for zero balance', () => {
      const principal = 0
      const annualRate = 0.06
      const term = 5

      const monthlyPayment = calculateMonthlyPayment(principal, annualRate, term)

      expect(monthlyPayment).toBe(0)
    })

    it('should correctly get loan term for different categories', () => {
      expect(getLoanTermForCategory('mortgage')).toBe(30)
      expect(getLoanTermForCategory('auto_loan')).toBe(5)
      expect(getLoanTermForCategory('student_loan')).toBe(10)
      expect(getLoanTermForCategory('credit_card')).toBe(0)
      expect(getLoanTermForCategory('personal_loan')).toBe(5)
    })

    it('should calculate total liability payments for multiple debts', () => {
      const liabilities = [
        { balance: 300000, category: 'mortgage' },
        { balance: 30000, category: 'auto_loan' },
        { balance: 5000, category: 'credit_card' },
      ]

      const totalPayment = calculateTotalLiabilityPayments(liabilities)

      // Should be approximately:
      // Mortgage: ~$1,799
      // Auto: ~$580
      // Credit card: $150
      // Total: ~$2,529
      expect(totalPayment).toBeGreaterThan(2500)
      expect(totalPayment).toBeLessThan(2550)
    })

    it('should handle empty liabilities array', () => {
      const liabilities: Array<{ balance: number; category: string }> = []

      const totalPayment = calculateTotalLiabilityPayments(liabilities)

      expect(totalPayment).toBe(0)
    })

    it('should correctly apply fuzzy matching for Plaid subtypes', () => {
      // Plaid uses different naming conventions
      const rate1 = getGrowthRateForCategory('auto')
      const rate2 = getGrowthRateForCategory('student')
      const rate3 = getGrowthRateForCategory('credit')

      expect(rate1).toBe(-0.06) // Should match auto_loan
      expect(rate2).toBe(-0.05) // Should match student_loan
      expect(rate3).toBe(-0.18) // Should match credit
    })
  })

  describe('Principal vs Interest calculations', () => {
    it('should correctly split mortgage payment into principal and interest', () => {
      const principal = 300000
      const annualRate = 0.06 // 6%
      const term = 30

      const monthlyPayment = calculateMonthlyPayment(principal, annualRate, term)
      const monthlyInterest = calculateMonthlyInterest(principal, annualRate)
      const monthlyPrincipal = calculatePrincipalPayment(principal, annualRate, term)

      // First month of $300K mortgage at 6%:
      // Payment: ~$1,799
      // Interest: $300,000 * 0.06 / 12 = $1,500
      // Principal: $1,799 - $1,500 = ~$299

      expect(monthlyPayment).toBeGreaterThan(1790)
      expect(monthlyPayment).toBeLessThan(1810)
      expect(monthlyInterest).toBeCloseTo(1500, 0)
      expect(monthlyPrincipal).toBeCloseTo(299, 0)

      // Verify: payment = interest + principal
      expect(monthlyPayment).toBeCloseTo(monthlyInterest + monthlyPrincipal, 2)
    })

    it('should correctly calculate remaining balance after payment', () => {
      const principal = 300000
      const annualRate = 0.06
      const term = 30

      const remainingBalance = calculateRemainingBalance(principal, annualRate, term)

      // After first payment, balance should be ~$299,701 (reduced by ~$299 principal)
      expect(remainingBalance).toBeCloseTo(299701, 0)
      expect(remainingBalance).toBeLessThan(principal)
    })

    it('should show liability decreasing over multiple months', () => {
      let balance = 300000
      const annualRate = 0.06
      const term = 30

      // Simulate 12 months of payments
      for (let month = 0; month < 12; month++) {
        balance = calculateRemainingBalance(balance, annualRate, term)
      }

      // After 12 months, balance should be noticeably lower
      // First year principal payments total ~$3,600
      expect(balance).toBeLessThan(297000)
      expect(balance).toBeGreaterThan(296000)
    })

    it('should separate interest expense from principal in total calculations', () => {
      const liabilities = [
        { balance: 300000, category: 'mortgage', loan_term_years: 30, interest_rate: 0.06 },
        { balance: 30000, category: 'auto_loan', loan_term_years: 5, interest_rate: 0.06 },
      ]

      const totalPayment = calculateTotalLiabilityPayments(liabilities)
      const totalInterest = calculateTotalInterestExpense(liabilities)
      const totalPrincipal = totalPayment - totalInterest

      // Mortgage: ~$1,799/mo, ~$1,500 interest, ~$299 principal
      // Auto: ~$580/mo, ~$150 interest, ~$430 principal
      // Total payment: ~$2,379
      // Total interest: ~$1,650
      // Total principal: ~$729

      expect(totalPayment).toBeGreaterThan(2370)
      expect(totalPayment).toBeLessThan(2390)

      expect(totalInterest).toBeGreaterThan(1640)
      expect(totalInterest).toBeLessThan(1660)

      expect(totalPrincipal).toBeGreaterThan(720)
      expect(totalPrincipal).toBeLessThan(740)

      // Verify: total payment = total interest + total principal
      expect(totalPayment).toBeCloseTo(totalInterest + totalPrincipal, 2)
    })

    it('should only count interest as expense, not principal', () => {
      const liabilities = [
        { balance: 300000, category: 'mortgage', loan_term_years: 30, interest_rate: 0.06 },
      ]

      const totalPayment = calculateTotalLiabilityPayments(liabilities) // ~$1,799
      const trueExpense = calculateTotalInterestExpense(liabilities) // ~$1,500

      // Principal payment (~$299) is NOT an expense - it's a transfer that reduces liability
      const principalTransfer = totalPayment - trueExpense

      expect(principalTransfer).toBeGreaterThan(290)
      expect(principalTransfer).toBeLessThan(310)

      // In net worth terms:
      // - Cash decreases by $1,799 (total payment)
      // - Liabilities decrease by $299 (principal)
      // - Net effect: -$1,500 (the interest expense)
    })
  })

  describe('Loan payoff timeline', () => {
    // Note: These tests would require the calculateLiabilityProjection function
    // which is in the projection API route. For now, we test the building blocks.

    it('should calculate correct balance reduction over time', () => {
      let balance = 300000
      const rate = 0.06
      const term = 30

      // Simulate 30 years (360 months) of payments
      const monthlyRate = rate / 12
      const totalMonths = term * 12
      const monthlyPayment = balance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)

      for (let month = 0; month < 360; month++) {
        const interest = balance * monthlyRate
        const principal = monthlyPayment - interest
        balance = Math.max(0, balance - principal)
      }

      // After 360 months (30 years), balance should be essentially 0
      // Allow for small floating point errors (< $1)
      expect(balance).toBeLessThan(1)
      expect(balance).toBeGreaterThanOrEqual(0)
    })

    it('should show loan paid off after term expires', () => {
      const balance = 30000
      const rate = 0.06
      const term = 5 // 5-year auto loan

      // Simulate 5 years (60 months)
      const monthlyRate = rate / 12
      const totalMonths = term * 12
      const monthlyPayment = balance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)

      let currentBalance = balance
      for (let month = 0; month < 60; month++) {
        const interest = currentBalance * monthlyRate
        const principal = monthlyPayment - interest
        currentBalance = Math.max(0, currentBalance - principal)
      }

      // After 60 months (5 years), balance should be essentially 0
      expect(currentBalance).toBeLessThan(1)
      expect(currentBalance).toBeGreaterThanOrEqual(0)
    })

    it('should have increasing principal payments over time', () => {
      const balance = 300000
      const rate = 0.06
      const term = 30
      const monthlyRate = rate / 12
      const totalMonths = term * 12
      const monthlyPayment = balance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)

      let currentBalance = balance

      // Month 1
      const interest1 = currentBalance * monthlyRate
      const principal1 = monthlyPayment - interest1
      currentBalance -= principal1

      // Skip to month 180 (halfway through)
      for (let i = 1; i < 180; i++) {
        const interest = currentBalance * monthlyRate
        const principal = monthlyPayment - interest
        currentBalance -= principal
      }

      // Month 180
      const interest180 = currentBalance * monthlyRate
      const principal180 = monthlyPayment - interest180

      // Principal payment should be higher in month 180 than month 1
      // (because more goes to principal as balance decreases)
      expect(principal180).toBeGreaterThan(principal1)

      // Interest payment should be lower in month 180 than month 1
      expect(interest180).toBeLessThan(interest1)

      // But total payment stays the same
      expect(principal1 + interest1).toBeCloseTo(principal180 + interest180, 2)
    })

    it('should calculate correct remaining balance for $370K mortgage after 20 years', () => {
      // User's specific scenario:
      // $370,000 loan, 30-year term, 6% interest
      // After 20 years (240 payments), what's the remaining balance?
      const principal = 370000
      const annualRate = 0.06
      const term = 30

      // Calculate monthly payment
      const monthlyRate = annualRate / 12
      const totalMonths = term * 12
      const fixedMonthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)

      // Should be approximately $2,218.34
      expect(fixedMonthlyPayment).toBeCloseTo(2218.34, 0)

      // Calculate remaining balance after 20 years (240 payments)
      let balance = principal
      const paymentsToMake = 20 * 12 // 240 payments

      for (let month = 0; month < paymentsToMake; month++) {
        const monthlyInterest = balance * monthlyRate
        const principalPayment = fixedMonthlyPayment - monthlyInterest
        balance = balance - principalPayment
      }

      // Verify with standard amortization formula for remaining balance:
      // Remaining = P × [(1+r)^n - (1+r)^p] / [(1+r)^n - 1]
      const p = paymentsToMake // payments made = 240
      const n = totalMonths // total payments = 360
      const expectedRemaining = principal * (Math.pow(1 + monthlyRate, n) - Math.pow(1 + monthlyRate, p)) / (Math.pow(1 + monthlyRate, n) - 1)

      console.log(`Remaining balance after 20 years (loop method): $${balance.toFixed(2)}`)
      console.log(`Remaining balance after 20 years (formula): $${expectedRemaining.toFixed(2)}`)

      // CORRECT remaining balance after 20 years: approximately $199,813
      // This is mathematically correct! After 20 years (2/3 of loan term), only 46% is paid off
      // This is normal for mortgages - early payments are mostly interest
      expect(balance).toBeCloseTo(expectedRemaining, 0) // Loop method matches formula
      expect(expectedRemaining).toBeGreaterThan(199000)
      expect(expectedRemaining).toBeLessThan(200500)
    })
  })
})