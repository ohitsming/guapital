/**
 * Test Utilities and Helpers
 * Provides common mocking and helper functions for API route tests
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock Supabase client for testing
 */
export const createMockSupabaseClient = (overrides?: any) => {
  const mockUser = {
    id: 'test-user-id-123',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
  };

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        // Fix: Use 'in' operator to properly handle { user: null }
        data: { user: overrides && 'user' in overrides ? overrides.user : mockUser },
        error: overrides?.authError ?? null,
      }),
    },
    from: jest.fn((table: string) => {
      // Create a chainable mock that resolves to a Promise at the end
      const createChainableMock = (): any => {
        const mockChain: any = {
          select: jest.fn(),
          insert: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          eq: jest.fn(),
          order: jest.fn(),
          limit: jest.fn(),
          // Terminal methods that return Promises
          single: jest.fn().mockResolvedValue(overrides?.[table]?.single ?? { data: null, error: null }),
          then: function(resolve: any) {
            // Make the chain thenable so it can be awaited
            const defaultResult = overrides?.[table] ?? { data: null, error: null };
            return Promise.resolve(defaultResult).then(resolve);
          },
        };

        // Set up return values after declaration to avoid circular reference
        mockChain.select.mockReturnValue(mockChain);
        mockChain.insert.mockReturnValue(mockChain);
        mockChain.update.mockReturnValue(mockChain);
        mockChain.delete.mockReturnValue(mockChain);
        mockChain.eq.mockReturnValue(mockChain);
        mockChain.order.mockReturnValue(mockChain);
        mockChain.limit.mockReturnValue(mockChain);

        return mockChain;
      };

      return createChainableMock();
    }),
    ...overrides?.client,
  };
};

/**
 * Mock NextRequest for testing
 */
export const createMockRequest = (options?: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  url?: string;
}): Request => {
  const { method = 'GET', body, headers = {}, url = 'http://localhost:3000/api/test' } = options || {};

  return {
    method,
    headers: new Headers(headers),
    url,
    json: async () => body,
    text: async () => JSON.stringify(body),
    clone: jest.fn(),
  } as unknown as Request;
};

/**
 * Extract JSON from NextResponse
 */
export const extractJson = async (response: NextResponse) => {
  const text = await response.text();
  return JSON.parse(text);
};

/**
 * Mock authenticated user data
 */
export const mockAuthenticatedUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
};

/**
 * Mock unauthenticated response
 */
export const mockUnauthenticatedSupabase = () => {
  return createMockSupabaseClient({
    user: null,
  });
};

/**
 * Mock premium user settings
 */
export const mockPremiumUser = {
  user_id: 'test-user-id-123',
  subscription_tier: 'premium',
  percentile_opt_in: true,
};

/**
 * Mock free user settings
 */
export const mockFreeUser = {
  user_id: 'test-user-id-123',
  subscription_tier: 'free',
  percentile_opt_in: false,
};

/**
 * Mock manual assets
 */
export const mockManualAssets = [
  {
    id: 1,
    user_id: 'test-user-id-123',
    asset_name: 'House',
    current_value: 500000,
    category: 'real_estate',
    entry_type: 'asset',
    notes: 'Primary residence',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    user_id: 'test-user-id-123',
    asset_name: 'Mortgage',
    current_value: 300000,
    category: 'mortgage',
    entry_type: 'liability',
    notes: 'Home loan',
    created_at: new Date().toISOString(),
  },
];

/**
 * Mock Plaid accounts (Plaid API format - used for accountsGet)
 */
export const mockPlaidAccounts = [
  {
    account_id: 'plaid-account-1',
    name: 'Checking Account',
    type: 'depository',
    subtype: 'checking',
    balances: {
      current: 5000,
      available: 4800,
      iso_currency_code: 'USD',
    },
  },
  {
    account_id: 'plaid-account-2',
    name: 'Investment Account',
    type: 'investment',
    subtype: '401k',
    balances: {
      current: 50000,
      available: null,
      iso_currency_code: 'USD',
    },
  },
];

/**
 * Mock Plaid accounts (Database format - used for GET /api/plaid/accounts)
 */
export const mockPlaidAccountsDB = [
  {
    id: 1,
    user_id: 'test-user-id-123',
    account_id: 'plaid-account-1',
    account_name: 'Checking Account',
    account_type: 'depository',
    account_subtype: 'checking',
    current_balance: 5000,
    available_balance: 4800,
    currency: 'USD',
    is_active: true,
    plaid_items: {
      institution_name: 'Test Bank',
      sync_status: 'active',
      last_sync_at: new Date().toISOString(),
    },
  },
  {
    id: 2,
    user_id: 'test-user-id-123',
    account_id: 'plaid-account-2',
    account_name: 'Investment Account',
    account_type: 'investment',
    account_subtype: '401k',
    current_balance: 50000,
    available_balance: null,
    currency: 'USD',
    is_active: true,
    plaid_items: {
      institution_name: 'Test Investment Firm',
      sync_status: 'active',
      last_sync_at: new Date().toISOString(),
    },
  },
];

/**
 * Mock crypto holdings
 */
export const mockCryptoHoldings = [
  {
    id: 1,
    user_id: 'test-user-id-123',
    wallet_address: '0x1234567890abcdef',
    token_symbol: 'ETH',
    token_name: 'Ethereum',
    balance: 2.5,
    usd_value: 5000,
    chain: 'ethereum',
  },
  {
    id: 2,
    user_id: 'test-user-id-123',
    wallet_address: '0x1234567890abcdef',
    token_symbol: 'USDC',
    token_name: 'USD Coin',
    balance: 1000,
    usd_value: 1000,
    chain: 'polygon',
  },
];

/**
 * Mock crypto wallets
 */
export const mockCryptoWallets = [
  {
    id: 1,
    user_id: 'test-user-id-123',
    wallet_address: '0x1234567890abcdef',
    wallet_name: 'Main Wallet',
    chain: 'ethereum',
    last_synced_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

/**
 * Mock transactions
 */
export const mockTransactions = [
  {
    id: 1,
    user_id: 'test-user-id-123',
    transaction_id: 'txn-1',
    account_id: 'plaid-account-1',
    amount: -50.00,
    date: new Date().toISOString(),
    name: 'Grocery Store',
    merchant_name: 'Whole Foods',
    category: ['Shops', 'Food and Drink'],
    pending: false,
  },
  {
    id: 2,
    user_id: 'test-user-id-123',
    transaction_id: 'txn-2',
    account_id: 'plaid-account-1',
    amount: 3000.00,
    date: new Date().toISOString(),
    name: 'Paycheck',
    category: ['Income', 'Payroll'],
    pending: false,
  },
];

/**
 * Mock percentile data
 */
export const mockPercentileData = {
  percentile_rank: 75.5,
  age: 28,
  net_worth: 150000,
  total_users_in_age_group: 1000,
  percentile_label: 'Top 25%',
};

/**
 * Setup environment variables for tests
 */
export const setupTestEnv = () => {
  // Use type assertion to bypass read-only restriction in test environment
  (process.env as any).NODE_ENV = 'test';
  process.env.PLAID_CLIENT_ID = 'test-plaid-client-id';
  process.env.PLAID_SECRET = 'test-plaid-secret';
  process.env.PLAID_ENV = 'sandbox';
  process.env.ALCHEMY_API_KEY = 'test-alchemy-key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_1234567890';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_1234567890';
  process.env.NEXT_PUBLIC_ENV_URL = 'http://localhost:3000';
};

/**
 * Clean up environment after tests
 */
export const cleanupTestEnv = () => {
  delete process.env.PLAID_CLIENT_ID;
  delete process.env.PLAID_SECRET;
  delete process.env.PLAID_ENV;
  delete process.env.ALCHEMY_API_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
};

/**
 * Assert response status and structure
 */
export const assertResponse = async (
  response: NextResponse,
  expectedStatus: number,
  expectedKeys?: string[]
) => {
  expect(response.status).toBe(expectedStatus);

  if (expectedKeys) {
    const json = await extractJson(response);
    expectedKeys.forEach(key => {
      expect(json).toHaveProperty(key);
    });
  }
};

/**
 * Mock Plaid client
 */
export const createMockPlaidClient = (overrides?: any) => {
  return {
    linkTokenCreate: jest.fn().mockResolvedValue({
      data: {
        link_token: 'link-sandbox-test-token',
        expiration: new Date(Date.now() + 3600000).toISOString(),
        ...overrides?.linkTokenCreate,
      },
    }),
    itemPublicTokenExchange: jest.fn().mockResolvedValue({
      data: {
        access_token: 'access-sandbox-test-token',
        item_id: 'test-item-id',
        ...overrides?.itemPublicTokenExchange,
      },
    }),
    itemGet: jest.fn().mockResolvedValue({
      data: {
        item: {
          institution_id: 'ins_test_123',
          ...overrides?.itemGet?.item,
        },
        ...overrides?.itemGet,
      },
    }),
    institutionsGetById: jest.fn().mockResolvedValue({
      data: {
        institution: {
          name: 'Test Bank',
          institution_id: 'ins_test_123',
          ...overrides?.institutionsGetById?.institution,
        },
        ...overrides?.institutionsGetById,
      },
    }),
    accountsGet: jest.fn().mockResolvedValue({
      data: {
        accounts: mockPlaidAccounts,
        ...overrides?.accountsGet,
      },
    }),
    transactionsGet: jest.fn().mockResolvedValue({
      data: {
        transactions: mockTransactions,
        total_transactions: mockTransactions.length,
        ...overrides?.transactionsGet,
      },
    }),
    transactionsSync: jest.fn().mockResolvedValue({
      data: {
        added: mockTransactions,
        modified: [],
        removed: [],
        has_more: false,
        next_cursor: null,
        ...overrides?.transactionsSync,
      },
    }),
    itemRemove: jest.fn().mockResolvedValue({
      data: {
        request_id: 'test-request-id',
        ...overrides?.itemRemove,
      },
    }),
    ...overrides?.client,
  };
};

/**
 * Mock Stripe
 */
export const createMockStripe = (overrides?: any) => {
  return {
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123',
          ...overrides?.checkoutSessionCreate,
        }),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          url: 'https://billing.stripe.com/session/test_123',
          ...overrides?.billingPortalCreate,
        }),
      },
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
            metadata: { userId: 'test-user-id-123' },
          },
        },
        ...overrides?.webhookEvent,
      }),
    },
    ...overrides?.client,
  };
};
