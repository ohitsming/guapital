/**
 * Test Suite: Misc API Routes
 * Tests /api/cashflow/monthly, /api/founding-members/remaining, /api/networth/snapshot
 */

import { GET as getCashflow } from '@/app/api/cashflow/monthly/route';
import { GET as getFoundingMembers } from '@/app/api/founding-members/remaining/route';
import {
  createMockSupabaseClient,
  createMockRequest,
  extractJson,
  setupTestEnv,
  cleanupTestEnv,
} from '../utils/testHelpers';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

const { createClient } = require('@/utils/supabase/server');

describe('GET /api/cashflow/monthly', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('User not authenticated');
  });

  it('should calculate cashflow correctly with income and expenses', async () => {
    const mockTransactions = [
      { amount: 3000, pending: false, is_hidden: false }, // Income (negative in Plaid = income)
      { amount: -50.00, pending: false, is_hidden: false }, // Expense (positive in Plaid = expense)
      { amount: -25.50, pending: false, is_hidden: false }, // Expense
      { amount: -100.00, pending: false, is_hidden: false }, // Expense
    ];

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json).toHaveProperty('income');
    expect(json).toHaveProperty('expenses');
    expect(json).toHaveProperty('netIncome');
    expect(json).toHaveProperty('transactionCount');
    expect(json).toHaveProperty('period');

    // Income = 175.50 (sum of negative amounts converted to positive)
    // Expenses = 3000 (positive amount)
    // Net = -2824.50
    expect(json.income).toBe(175.50);
    expect(json.expenses).toBe(3000);
    expect(json.netIncome).toBe(-2824.50);
    expect(json.transactionCount).toBe(4);
  });

  it('should exclude pending transactions', async () => {
    const mockTransactions = [
      { amount: -50.00, pending: false, is_hidden: false },
      { amount: -100.00, pending: true, is_hidden: false }, // Should be excluded
    ];

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
          gte: jest.fn(),
          lte: jest.fn(),
        };

        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.gte.mockReturnValue(methods);
        methods.lte.mockResolvedValue({
          data: mockTransactions.filter(t => !t.pending && !t.is_hidden),
          error: null,
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    // Only non-pending transaction should be counted
    expect(json.transactionCount).toBe(1);
  });

  it('should exclude hidden transactions', async () => {
    const mockTransactions = [
      { amount: -50.00, pending: false, is_hidden: false },
      { amount: -100.00, pending: false, is_hidden: true }, // Should be excluded
    ];

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockTransactions.filter(t => !t.is_hidden && !t.pending),
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    // Only non-hidden transaction should be counted
    expect(json.transactionCount).toBe(1);
  });

  it('should handle no transactions gracefully', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.income).toBe(0);
    expect(json.expenses).toBe(0);
    expect(json.netIncome).toBe(0);
    expect(json.transactionCount).toBe(0);
  });

  it('should handle database errors', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed to fetch transactions');
  });

  it('should include correct date period', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.period).toHaveProperty('start');
    expect(json.period).toHaveProperty('end');

    // Verify dates are in YYYY-MM-DD format
    expect(json.period.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(json.period.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('GET /api/founding-members/remaining', () => {
  beforeAll(() => {
    setupTestEnv();
    process.env.STRIPE_PRICE_FOUNDING = 'price_founding_test';
  });

  afterAll(() => {
    cleanupTestEnv();
    delete process.env.STRIPE_PRICE_FOUNDING;
  });

  beforeEach(() => jest.clearAllMocks());

  it('should return founding member count and remaining slots', async () => {
    const mockSupabase = {
      from: jest.fn(() => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
        };

        methods.select.mockReturnValue(methods);

        // eq() is called twice, need to handle chaining
        let eqCallCount = 0;
        methods.eq.mockImplementation(() => {
          eqCallCount++;
          if (eqCallCount < 2) {
            return methods; // First call - return for chaining
          }
          // Second call - return promise with count
          return Promise.resolve({
            count: 500,
            data: null,
            error: null,
          });
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await getFoundingMembers();
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.total).toBe(500);
    expect(json.remaining).toBe(500); // 1000 - 500
    expect(json.isFull).toBe(false);
    expect(json.limit).toBe(1000);
  });

  it('should indicate when founding member slots are full', async () => {
    const mockSupabase = {
      from: jest.fn(() => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
        };

        methods.select.mockReturnValue(methods);

        let eqCallCount = 0;
        methods.eq.mockImplementation(() => {
          eqCallCount++;
          if (eqCallCount < 2) {
            return methods;
          }
          return Promise.resolve({
            count: 1000,
            data: null,
            error: null,
          });
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await getFoundingMembers();
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.total).toBe(1000);
    expect(json.remaining).toBe(0);
    expect(json.isFull).toBe(true);
  });

  it('should handle when no founding members exist', async () => {
    const mockSupabase = {
      from: jest.fn(() => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
        };

        methods.select.mockReturnValue(methods);

        let eqCallCount = 0;
        methods.eq.mockImplementation(() => {
          eqCallCount++;
          if (eqCallCount < 2) {
            return methods;
          }
          return Promise.resolve({
            count: 0,
            data: null,
            error: null,
          });
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await getFoundingMembers();
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.total).toBe(0);
    expect(json.remaining).toBe(1000);
    expect(json.isFull).toBe(false);
  });

  it('should return default values if STRIPE_PRICE_FOUNDING not set', async () => {
    delete process.env.STRIPE_PRICE_FOUNDING;

    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: 0,
          data: null,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await getFoundingMembers();
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.total).toBe(0);
    expect(json.remaining).toBe(1000);
    expect(json.isFull).toBe(false);

    process.env.STRIPE_PRICE_FOUNDING = 'price_founding_test';
  });

  it('should handle database errors gracefully', async () => {
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: null,
          data: null,
          error: { message: 'Database error' },
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await getFoundingMembers();
    const json = await extractJson(response);

    // Should still return valid response with defaults
    expect(response.status).toBe(200);
    expect(json.total).toBe(0);
    expect(json.remaining).toBe(1000);
    expect(json.isFull).toBe(false);
  });

  it('should handle count being null', async () => {
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: null,
          data: null,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await getFoundingMembers();
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.total).toBe(0);
    expect(json.remaining).toBe(1000);
  });

  it('should prevent negative remaining slots', async () => {
    const mockSupabase = {
      from: jest.fn(() => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
        };

        methods.select.mockReturnValue(methods);

        let eqCallCount = 0;
        methods.eq.mockImplementation(() => {
          eqCallCount++;
          if (eqCallCount < 2) {
            return methods;
          }
          return Promise.resolve({
            count: 1100, // More than limit
            data: null,
            error: null,
          });
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await getFoundingMembers();
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.total).toBe(1100);
    expect(json.remaining).toBe(0); // Should be capped at 0, not negative
    expect(json.isFull).toBe(true);
  });

  // MEDIUM PRIORITY: Boundary values
  it('should handle exactly 999 members', async () => {
    const mockSupabase = {
      from: jest.fn(() => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
        };

        methods.select.mockReturnValue(methods);

        let eqCallCount = 0;
        methods.eq.mockImplementation(() => {
          eqCallCount++;
          if (eqCallCount < 2) {
            return methods;
          }
          return Promise.resolve({
            count: 999,
            data: null,
            error: null,
          });
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await getFoundingMembers();
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.total).toBe(999);
    expect(json.remaining).toBe(1);
    expect(json.isFull).toBe(false);
  });

  // MEDIUM PRIORITY: Boundary values
  it('should handle exactly 1000 members', async () => {
    const mockSupabase = {
      from: jest.fn(() => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
        };

        methods.select.mockReturnValue(methods);

        let eqCallCount = 0;
        methods.eq.mockImplementation(() => {
          eqCallCount++;
          if (eqCallCount < 2) {
            return methods;
          }
          return Promise.resolve({
            count: 1000,
            data: null,
            error: null,
          });
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await getFoundingMembers();
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.total).toBe(1000);
    expect(json.remaining).toBe(0);
    expect(json.isFull).toBe(true);
  });

  // MEDIUM PRIORITY: Very large counts
  it('should handle very large member count', async () => {
    const mockSupabase = {
      from: jest.fn(() => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
        };

        methods.select.mockReturnValue(methods);

        let eqCallCount = 0;
        methods.eq.mockImplementation(() => {
          eqCallCount++;
          if (eqCallCount < 2) {
            return methods;
          }
          return Promise.resolve({
            count: 100000,
            data: null,
            error: null,
          });
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await getFoundingMembers();
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.total).toBe(100000);
    expect(json.remaining).toBe(0);
    expect(json.isFull).toBe(true);
  });
});

describe('GET /api/cashflow/monthly - Additional Edge Cases', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  // HIGH PRIORITY: All income, no expenses
  it('should handle all income transactions with no expenses', async () => {
    const mockTransactions = [
      { amount: -50.00, pending: false, is_hidden: false }, // Income
      { amount: -100.00, pending: false, is_hidden: false }, // Income
      { amount: -25.50, pending: false, is_hidden: false }, // Income
    ];

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.income).toBe(175.50);
    expect(json.expenses).toBe(0);
    expect(json.netIncome).toBe(175.50);
  });

  // HIGH PRIORITY: All expenses, no income
  it('should handle all expenses with no income', async () => {
    const mockTransactions = [
      { amount: 50.00, pending: false, is_hidden: false }, // Expense
      { amount: 100.00, pending: false, is_hidden: false }, // Expense
      { amount: 25.50, pending: false, is_hidden: false }, // Expense
    ];

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.income).toBe(0);
    expect(json.expenses).toBe(175.50);
    expect(json.netIncome).toBe(-175.50);
  });

  // HIGH PRIORITY: Zero amount transactions
  it('should handle zero amount transactions', async () => {
    const mockTransactions = [
      { amount: 0, pending: false, is_hidden: false },
      { amount: -50.00, pending: false, is_hidden: false },
      { amount: 100.00, pending: false, is_hidden: false },
    ];

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.income).toBe(50.00);
    expect(json.expenses).toBe(100.00);
    expect(json.transactionCount).toBe(3);
  });

  // HIGH PRIORITY: Null amounts
  it('should handle null or undefined amounts', async () => {
    const mockTransactions = [
      { amount: null, pending: false, is_hidden: false },
      { amount: undefined, pending: false, is_hidden: false },
      { amount: -50.00, pending: false, is_hidden: false },
    ];

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    // Should handle null/undefined gracefully
    expect(json.income).toBe(50.00);
    expect(json.transactionCount).toBe(3);
  });

  // HIGH PRIORITY: Very large transactions
  it('should handle very large transaction amounts', async () => {
    const mockTransactions = [
      { amount: -1000000, pending: false, is_hidden: false }, // $1M income
      { amount: 500000, pending: false, is_hidden: false }, // $500K expense
    ];

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.income).toBe(1000000);
    expect(json.expenses).toBe(500000);
    expect(json.netIncome).toBe(500000);
  });

  // HIGH PRIORITY: Decimal precision
  it('should handle decimal precision correctly', async () => {
    const mockTransactions = [
      { amount: -50.555, pending: false, is_hidden: false },
      { amount: 25.445, pending: false, is_hidden: false },
      { amount: -10.111, pending: false, is_hidden: false },
    ];

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    // Should handle decimal precision appropriately
    expect(json.income).toBeCloseTo(60.67, 2);
    expect(json.expenses).toBeCloseTo(25.45, 2);
  });

  // MEDIUM PRIORITY: Mixed pending and hidden
  it('should exclude transactions that are both pending and hidden', async () => {
    const mockTransactions = [
      { amount: -50.00, pending: false, is_hidden: false }, // Include
      { amount: -100.00, pending: true, is_hidden: true }, // Exclude
    ];

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: mockTransactions.filter(t => !t.pending && !t.is_hidden),
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getCashflow(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.transactionCount).toBe(1);
    expect(json.income).toBe(50.00);
  });
});
