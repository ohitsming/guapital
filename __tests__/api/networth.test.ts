/**
 * Test Suite: /api/networth
 * Tests net worth calculation from all sources (Plaid, Crypto, Manual)
 */

import { GET } from '@/app/api/networth/route';
import {
  createMockSupabaseClient,
  createMockRequest,
  extractJson,
  setupTestEnv,
  cleanupTestEnv,
  mockPlaidAccountsDB,
  mockCryptoHoldings,
  mockManualAssets,
} from '../utils/testHelpers';

// Mock the Supabase server module
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

const { createClient } = require('@/utils/supabase/server');

// Helper to create proper Supabase mock with double .eq() chaining
const createNetworthMock = (data: { plaid?: any[], crypto?: any[], manual?: any[] }) => {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: jest.fn((table: string) => {
      const methods: any = {
        select: jest.fn(),
        eq: jest.fn(),
      };

      methods.select.mockReturnValue(methods);
      methods.eq.mockReturnValue(methods);

      // Make the chain awaitable
      methods.then = function(resolve: any) {
        let result = { data: null, error: null };

        if (table === 'plaid_accounts') {
          result.data = data.plaid || null;
        } else if (table === 'crypto_holdings') {
          result.data = data.crypto || null;
        } else if (table === 'manual_assets') {
          result.data = data.manual || null;
        }

        return Promise.resolve(result).then(resolve);
      };

      return methods;
    }),
  };
};

describe('GET /api/networth', () => {
  beforeAll(() => {
    setupTestEnv();
  });

  afterAll(() => {
    cleanupTestEnv();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('User not authenticated');
  });

  it('should calculate net worth from all sources (Plaid + Crypto + Manual)', async () => {
    const mockSupabase = createNetworthMock({
      plaid: mockPlaidAccountsDB,
      crypto: mockCryptoHoldings,
      manual: mockManualAssets,
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json).toHaveProperty('total_assets');
    expect(json).toHaveProperty('total_liabilities');
    expect(json).toHaveProperty('net_worth');
    expect(json).toHaveProperty('breakdown');

    // Verify breakdown structure
    expect(json.breakdown).toHaveProperty('cash');
    expect(json.breakdown).toHaveProperty('investments');
    expect(json.breakdown).toHaveProperty('crypto');
    expect(json.breakdown).toHaveProperty('real_estate');
    expect(json.breakdown).toHaveProperty('mortgage');
    expect(json.breakdown).toHaveProperty('credit_debt');

    // Expected calculations:
    // Assets: Plaid checking (5000) + Plaid investment (50000) + Crypto (6000) + House (500000) = 561000
    // Liabilities: Mortgage (300000) = 300000
    // Net Worth: 561000 - 300000 = 261000
    expect(json.total_assets).toBe(561000);
    expect(json.total_liabilities).toBe(300000);
    expect(json.net_worth).toBe(261000);
  });

  it('should handle empty data gracefully', async () => {
    const mockSupabase = createNetworthMock({
      plaid: [],
      crypto: [],
      manual: [],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.total_assets).toBe(0);
    expect(json.total_liabilities).toBe(0);
    expect(json.net_worth).toBe(0);
  });

  it('should handle database errors gracefully', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => {
        const methods: any = {
          select: jest.fn(),
          eq: jest.fn(),
        };

        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);

        methods.then = function(resolve: any) {
          return Promise.resolve({
            data: null,
            error: { message: 'Database error' },
          }).then(resolve);
        };

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    // Should still return valid response with zero values
    expect(response.status).toBe(200);
    expect(json.total_assets).toBe(0);
    expect(json.total_liabilities).toBe(0);
  });

  it('should categorize Plaid accounts correctly', async () => {
    const plaidAccountsTest = [
      {
        account_type: 'depository',
        account_subtype: 'checking',
        current_balance: 1000,
        is_active: true,
      },
      {
        account_type: 'investment',
        account_subtype: '401k',
        current_balance: 20000,
        is_active: true,
      },
      {
        account_type: 'credit',
        account_subtype: 'credit card',
        current_balance: 500,
        is_active: true,
      },
      {
        account_type: 'loan',
        account_subtype: 'student',
        current_balance: 10000,
        is_active: true,
      },
    ];

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const methods: any = {
          select: jest.fn(),
          eq: jest.fn(),
        };

        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);

        methods.then = function(resolve: any) {
          let result = { data: [], error: null };
          if (table === 'plaid_accounts') {
            result.data = plaidAccountsTest;
          }
          return Promise.resolve(result).then(resolve);
        };

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.breakdown.cash).toBe(1000); // Depository account
    expect(json.breakdown.investments).toBe(20000); // Investment account
    expect(json.breakdown.credit_debt).toBe(500); // Credit card
    expect(json.breakdown.personal_loan).toBe(10000); // Student loan
  });

  it('should only include active Plaid accounts', async () => {
    const plaidAccountsWithInactive = [
      {
        account_type: 'depository',
        current_balance: 1000,
        is_active: true,
      },
      {
        account_type: 'depository',
        current_balance: 5000,
        is_active: false, // Should be excluded
      },
    ];

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const methods: any = {
          select: jest.fn(),
          eq: jest.fn(),
        };

        let eqCallCount = 0;

        methods.select.mockReturnValue(methods);
        methods.eq.mockImplementation((field: string, value: any) => {
          eqCallCount++;
          // Second .eq() call is for is_active filter
          if (eqCallCount === 2 && field === 'is_active' && value === true && table === 'plaid_accounts') {
            methods.then = function(resolve: any) {
              return Promise.resolve({
                data: plaidAccountsWithInactive.filter(a => a.is_active),
                error: null,
              }).then(resolve);
            };
          }
          return methods;
        });

        methods.then = function(resolve: any) {
          let result = { data: [], error: null };
          if (table === 'plaid_accounts') {
            result.data = plaidAccountsWithInactive.filter(a => a.is_active);
          }
          return Promise.resolve(result).then(resolve);
        };

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    // Should only count active account (1000), not inactive (5000)
    expect(json.breakdown.cash).toBe(1000);
  });

  // HIGH PRIORITY: Null/undefined balances
  it('should handle null or undefined balances gracefully', async () => {
    const accountsWithNullBalance = [
      {
        account_type: 'depository',
        current_balance: null,
        is_active: true,
      },
      {
        account_type: 'depository',
        current_balance: undefined,
        is_active: true,
      },
      {
        account_type: 'depository',
        current_balance: 1000,
        is_active: true,
      },
    ];

    const mockSupabase = createNetworthMock({
      plaid: accountsWithNullBalance,
      crypto: [],
      manual: [],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    // Should only count the valid balance (1000), ignore null/undefined
    expect(json.breakdown.cash).toBe(1000);
    expect(json.total_assets).toBe(1000);
  });

  // HIGH PRIORITY: Negative net worth
  it('should calculate negative net worth correctly', async () => {
    const mockSupabase = createNetworthMock({
      plaid: [
        {
          account_type: 'depository',
          current_balance: 5000,
          is_active: true,
        },
        {
          account_type: 'credit',
          current_balance: 15000,
          is_active: true,
        },
        {
          account_type: 'loan',
          account_subtype: 'student',
          current_balance: 50000,
          is_active: true,
        },
      ],
      crypto: [],
      manual: [],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.total_assets).toBe(5000);
    expect(json.total_liabilities).toBe(65000);
    expect(json.net_worth).toBe(-60000);
  });

  // HIGH PRIORITY: Zero balances
  it('should include accounts with zero balance', async () => {
    const mockSupabase = createNetworthMock({
      plaid: [
        {
          account_type: 'depository',
          current_balance: 0,
          is_active: true,
        },
        {
          account_type: 'depository',
          current_balance: 1000,
          is_active: true,
        },
      ],
      crypto: [],
      manual: [],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.breakdown.cash).toBe(1000);
    expect(json.total_assets).toBe(1000);
  });

  // HIGH PRIORITY: Very large numbers
  it('should handle very large balances correctly', async () => {
    const mockSupabase = createNetworthMock({
      plaid: [
        {
          account_type: 'investment',
          current_balance: 10000000000, // 10 billion
          is_active: true,
        },
      ],
      crypto: [],
      manual: [],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.breakdown.investments).toBe(10000000000);
    expect(json.total_assets).toBe(10000000000);
    expect(json.net_worth).toBe(10000000000);
  });

  // HIGH PRIORITY: One data source fails
  it('should handle partial failure (Plaid fails, others succeed)', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const methods: any = {
          select: jest.fn(),
          eq: jest.fn(),
        };

        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);

        methods.then = function(resolve: any) {
          let result = { data: null, error: null };

          if (table === 'plaid_accounts') {
            result = {
              data: null,
              error: { message: 'Plaid database error' },
            };
          } else if (table === 'crypto_holdings') {
            result = {
              data: [{ usd_value: 5000 }],
              error: null,
            };
          } else if (table === 'manual_assets') {
            result = {
              data: [{ category: 'real_estate', entry_type: 'asset', current_value: 200000 }],
              error: null,
            };
          } else {
            result = { data: [], error: null };
          }

          return Promise.resolve(result).then(resolve);
        };

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    // Should still calculate from crypto + manual
    expect(json.breakdown.crypto).toBe(5000);
    expect(json.breakdown.real_estate).toBe(200000);
    expect(json.total_assets).toBe(205000);
  });

  // HIGH PRIORITY: All manual asset types
  it('should categorize all manual asset types correctly', async () => {
    const allManualAssets = [
      { category: 'cash', entry_type: 'asset', current_value: 1000 },
      { category: 'cash', entry_type: 'asset', current_value: 2000 },
      { category: 'cash', entry_type: 'asset', current_value: 3000 },
      { category: 'investment', entry_type: 'asset', current_value: 4000 },
      { category: 'investment', entry_type: 'asset', current_value: 5000 },
      { category: 'real_estate', entry_type: 'asset', current_value: 300000 },
      { category: 'vehicle', entry_type: 'asset', current_value: 20000 },
      { category: 'other', entry_type: 'asset', current_value: 1000 },
      { category: 'credit_debt', entry_type: 'liability', current_value: 2000 },
      { category: 'personal_loan', entry_type: 'liability', current_value: 5000 },
      { category: 'mortgage', entry_type: 'liability', current_value: 250000 },
      { category: 'other_debt', entry_type: 'liability', current_value: 3000 },
    ];

    const mockSupabase = createNetworthMock({
      plaid: [],
      crypto: [],
      manual: allManualAssets,
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.breakdown.cash).toBe(6000); // 3x cash entries
    expect(json.breakdown.investments).toBe(9000); // 2x investment entries
    expect(json.breakdown.real_estate).toBe(300000);
    expect(json.breakdown.other).toBe(21000); // vehicle (20000) + other (1000)
    expect(json.breakdown.credit_debt).toBe(2000);
    expect(json.breakdown.personal_loan).toBe(5000);
    expect(json.breakdown.mortgage).toBe(250000);
    expect(json.breakdown.other_debt).toBe(3000);
  });

  // HIGH PRIORITY: Aggregate same types
  it('should aggregate multiple accounts of the same type', async () => {
    const mockSupabase = createNetworthMock({
      plaid: [
        {
          account_type: 'depository',
          account_subtype: 'checking',
          current_balance: 1000,
          is_active: true,
        },
        {
          account_type: 'depository',
          account_subtype: 'checking',
          current_balance: 2000,
          is_active: true,
        },
        {
          account_type: 'depository',
          account_subtype: 'savings',
          current_balance: 5000,
          is_active: true,
        },
        {
          account_type: 'credit',
          current_balance: 500,
          is_active: true,
        },
        {
          account_type: 'credit',
          current_balance: 1500,
          is_active: true,
        },
      ],
      crypto: [],
      manual: [],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.breakdown.cash).toBe(8000); // 1000 + 2000 + 5000
    expect(json.breakdown.credit_debt).toBe(2000); // 500 + 1500
    expect(json.total_assets).toBe(8000);
    expect(json.total_liabilities).toBe(2000);
  });

  // HIGH PRIORITY: Liability-only portfolio
  it('should handle user with only liabilities', async () => {
    const mockSupabase = createNetworthMock({
      plaid: [
        {
          account_type: 'credit',
          current_balance: 5000,
          is_active: true,
        },
        {
          account_type: 'loan',
          account_subtype: 'student',
          current_balance: 30000,
          is_active: true,
        },
      ],
      crypto: [],
      manual: [],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.total_assets).toBe(0);
    expect(json.total_liabilities).toBe(35000);
    expect(json.net_worth).toBe(-35000);
  });

  // HIGH PRIORITY: Plaid-only user
  it('should calculate net worth for Plaid-only user', async () => {
    const mockSupabase = createNetworthMock({
      plaid: [
        {
          account_type: 'depository',
          current_balance: 10000,
          is_active: true,
        },
        {
          account_type: 'investment',
          current_balance: 50000,
          is_active: true,
        },
      ],
      crypto: [],
      manual: [],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.breakdown.cash).toBe(10000);
    expect(json.breakdown.investments).toBe(50000);
    expect(json.breakdown.crypto).toBe(0);
    expect(json.total_assets).toBe(60000);
  });

  // HIGH PRIORITY: Crypto-only user
  it('should calculate net worth for crypto-only user', async () => {
    const mockSupabase = createNetworthMock({
      plaid: [],
      crypto: [
        { usd_value: 15000 },
        { usd_value: 8000 },
      ],
      manual: [],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.breakdown.crypto).toBe(23000);
    expect(json.breakdown.cash).toBe(0);
    expect(json.breakdown.investments).toBe(0);
    expect(json.total_assets).toBe(23000);
  });

  // HIGH PRIORITY: Manual-only user
  it('should calculate net worth for manual-only user', async () => {
    const mockSupabase = createNetworthMock({
      plaid: [],
      crypto: [],
      manual: [
        { category: 'cash', entry_type: 'asset', current_value: 5000 },
        { category: 'real_estate', entry_type: 'asset', current_value: 400000 },
        { category: 'mortgage', entry_type: 'liability', current_value: 300000 },
      ],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.breakdown.cash).toBe(5000);
    expect(json.breakdown.real_estate).toBe(400000);
    expect(json.breakdown.mortgage).toBe(300000);
    expect(json.total_assets).toBe(405000);
    expect(json.total_liabilities).toBe(300000);
    expect(json.net_worth).toBe(105000);
  });

  // HIGH PRIORITY: Crypto edge cases
  it('should handle crypto holdings with zero USD value', async () => {
    const mockSupabase = createNetworthMock({
      plaid: [],
      crypto: [
        { usd_value: 0 }, // Worthless token
        { usd_value: 5000 },
        { usd_value: null }, // Missing price data
      ],
      manual: [],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.breakdown.crypto).toBe(5000); // Only count valid positive values
    expect(json.total_assets).toBe(5000);
  });

  // MEDIUM PRIORITY: Rounding/precision
  it('should handle decimal values correctly', async () => {
    const mockSupabase = createNetworthMock({
      plaid: [
        {
          account_type: 'depository',
          current_balance: 1000.55,
          is_active: true,
        },
        {
          account_type: 'depository',
          current_balance: 2000.45,
          is_active: true,
        },
      ],
      crypto: [],
      manual: [],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.breakdown.cash).toBe(3001); // Should round or handle decimals
    expect(json.total_assets).toBe(3001);
  });

  // MEDIUM PRIORITY: Empty breakdown categories
  it('should return zero for empty breakdown categories', async () => {
    const mockSupabase = createNetworthMock({
      plaid: [
        {
          account_type: 'depository',
          current_balance: 5000,
          is_active: true,
        },
      ],
      crypto: [],
      manual: [],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.breakdown.cash).toBe(5000);
    expect(json.breakdown.investments).toBe(0);
    expect(json.breakdown.crypto).toBe(0);
    expect(json.breakdown.real_estate).toBe(0);
    expect(json.breakdown.other).toBe(0); // vehicles and other assets go here
    expect(json.breakdown.mortgage).toBe(0);
    expect(json.breakdown.credit_debt).toBe(0);
  });

  // MEDIUM PRIORITY: Unknown account types
  it('should handle unknown/unrecognized account types gracefully', async () => {
    const mockSupabase = createNetworthMock({
      plaid: [
        {
          account_type: 'unknown_type',
          current_balance: 1000,
          is_active: true,
        },
        {
          account_type: 'depository',
          current_balance: 5000,
          is_active: true,
        },
      ],
      crypto: [],
      manual: [],
    });

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    // Should handle gracefully, might categorize as 'other' or skip unknown type
    expect(json.breakdown.cash).toBe(5000);
    expect(json.total_assets).toBeGreaterThanOrEqual(5000);
  });
});
