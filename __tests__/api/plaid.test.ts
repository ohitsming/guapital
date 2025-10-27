/**
 * Test Suite: Plaid API Routes
 * Tests /api/plaid/create-link-token, /api/plaid/exchange-token, /api/plaid/accounts
 */

import { POST as createLinkToken } from '@/app/api/plaid/create-link-token/route';
import { POST as exchangeToken } from '@/app/api/plaid/exchange-token/route';
import { GET as getAccounts } from '@/app/api/plaid/accounts/route';
import {
  createMockSupabaseClient,
  createMockRequest,
  extractJson,
  setupTestEnv,
  cleanupTestEnv,
  mockPremiumUser,
  mockFreeUser,
  mockPlaidAccounts,
  mockPlaidAccountsDB,
  createMockPlaidClient,
} from '../utils/testHelpers';

// Mock Plaid SDK
jest.mock('plaid', () => ({
  Configuration: jest.fn(),
  PlaidApi: jest.fn(),
  PlaidEnvironments: {
    sandbox: 'https://sandbox.plaid.com',
    development: 'https://development.plaid.com',
    production: 'https://production.plaid.com',
  },
  Products: {
    Transactions: 'transactions',
    Auth: 'auth',
  },
  CountryCode: {
    Us: 'US',
  },
}));

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/plaid/client', () => ({
  getPlaidClient: jest.fn(),
}));

const { createClient } = require('@/utils/supabase/server');
const { getPlaidClient } = require('@/lib/plaid/client');

describe('POST /api/plaid/create-link-token', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({ method: 'POST' });
    const response = await createLinkToken(request);
    const json = await extractJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('User not authenticated');
  });

  it('should return 403 for free tier users in production', async () => {
    process.env.NODE_ENV = 'production';

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
        single: jest.fn().mockResolvedValue({
          data: mockFreeUser,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({ method: 'POST' });
    const response = await createLinkToken(request);
    const json = await extractJson(response);

    expect(response.status).toBe(403);
    expect(json.error).toBe('Premium feature');
    expect(json.message).toContain('Premium subscribers');

    process.env.NODE_ENV = 'test';
  });

  it('should allow premium users to create link token', async () => {
    const mockPlaid = createMockPlaidClient();
    getPlaidClient.mockReturnValue(mockPlaid);

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
        single: jest.fn().mockResolvedValue({
          data: mockPremiumUser,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({ method: 'POST' });
    const response = await createLinkToken(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json).toHaveProperty('link_token');
    expect(json).toHaveProperty('expiration');
    expect(json.link_token).toBe('link-sandbox-test-token');
  });

  it('should skip premium check in development mode', async () => {
    process.env.NODE_ENV = 'development';

    const mockPlaid = createMockPlaidClient();
    getPlaidClient.mockReturnValue(mockPlaid);

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({ method: 'POST' });
    const response = await createLinkToken(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json).toHaveProperty('link_token');

    process.env.NODE_ENV = 'test';
  });

  it('should return 500 if Plaid credentials are missing', async () => {
    delete process.env.PLAID_CLIENT_ID;

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
        single: jest.fn().mockResolvedValue({
          data: mockPremiumUser,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({ method: 'POST' });
    const response = await createLinkToken(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Plaid configuration error');

    setupTestEnv(); // Restore env vars
  });

  // Note: Plaid API error handling test removed due to mock complexity.
  // Error handling is covered by the implementation's try-catch blocks.
  // Real Plaid errors are rare and handled gracefully in production.

  it('should handle Plaid API errors gracefully', async () => {
    const mockPlaid = createMockPlaidClient({
      client: {
        linkTokenCreate: jest.fn().mockRejectedValue({
          message: 'Plaid API Error',
          response: {
            data: {
              error_code: 'INTERNAL_SERVER_ERROR',
              error_message: 'An internal error occurred',
            },
          },
        }),
      }
    });
    getPlaidClient.mockReturnValue(mockPlaid);

    const mockSupabase = createMockSupabaseClient({
      user: { id: 'test-user-id' },
      user_settings: {
        single: { data: mockPremiumUser, error: null }
      }
    });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({ method: 'POST' });
    const response = await createLinkToken(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed');
  });

  it('should handle network timeouts', async () => {
    const mockPlaid = createMockPlaidClient({
      client: {
        linkTokenCreate: jest.fn().mockRejectedValue({
          message: 'ETIMEDOUT',
          code: 'ETIMEDOUT',
        }),
      }
    });
    getPlaidClient.mockReturnValue(mockPlaid);

    const mockSupabase = createMockSupabaseClient({
      user: { id: 'test-user-id' },
      user_settings: {
        single: { data: mockPremiumUser, error: null }
      }
    });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({ method: 'POST' });
    const response = await createLinkToken(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
  });
});

describe('POST /api/plaid/exchange-token', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { public_token: 'public-sandbox-token' },
    });
    const response = await exchangeToken(request);
    const json = await extractJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('User not authenticated');
  });

  it('should validate public_token is provided', async () => {
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
        single: jest.fn().mockResolvedValue({
          data: mockPremiumUser,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: {}, // Missing public_token
    });

    const response = await exchangeToken(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toContain('public_token');
  });

  it('should exchange public token for access token', async () => {
    const mockPlaid = createMockPlaidClient();
    getPlaidClient.mockReturnValue(mockPlaid);

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'user_settings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockPremiumUser,
              error: null,
            }),
          };
        }
        if (table === 'plaid_items') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            single: jest.fn().mockResolvedValue({
              data: { id: 1, item_id: 'test-item-id', user_id: 'test-user-id' },
              error: null,
            }),
          };
        }
        if (table === 'plaid_accounts') {
          return {
            delete: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        // Default for any other table
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { public_token: 'public-sandbox-token' },
    });

    const response = await exchangeToken(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json).toHaveProperty('item_id');
    expect(mockPlaid.itemPublicTokenExchange).toHaveBeenCalled();
  });

  it('should handle Plaid exchange errors', async () => {
    const mockPlaid = createMockPlaidClient({
      itemPublicTokenExchange: jest.fn().mockRejectedValue({
        message: 'Invalid public token',
        response: {
          data: {
            error_message: 'INVALID_PUBLIC_TOKEN',
            error_code: 'INVALID_PUBLIC_TOKEN',
          },
        },
      }),
    });
    getPlaidClient.mockReturnValue(mockPlaid);

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { public_token: 'invalid-token' },
    });

    const response = await exchangeToken(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed');
  });

  it('should handle duplicate item_id gracefully', async () => {
    const mockPlaid = createMockPlaidClient({
      accountsGet: jest.fn().mockResolvedValue({
        data: {
          accounts: [
            {
              account_id: 'acc_1',
              balances: {
                current: 1000,
                available: 950,
                iso_currency_code: 'USD',
              },
              name: 'Checking',
              official_name: 'Checking Account',
              type: 'depository',
              subtype: 'checking',
            },
          ],
        },
      }),
    });
    getPlaidClient.mockReturnValue(mockPlaid);

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'user_settings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockPremiumUser,
              error: null,
            }),
          };
        }
        if (table === 'plaid_items') {
          const chainable: any = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 1, item_id: 'existing-item-id', user_id: 'test-user-id' }, // Already exists
              error: null,
            }),
            single: jest.fn().mockResolvedValue({
              data: { id: 1, item_id: 'existing-item-id', user_id: 'test-user-id' },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
          return chainable;
        }
        if (table === 'plaid_accounts') {
          return {
            delete: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { public_token: 'public-sandbox-token' },
    });

    const response = await exchangeToken(request);
    const json = await extractJson(response);

    // Should succeed and update existing item
    expect(response.status).toBe(200);
    expect(json).toHaveProperty('item_id');
  });

  it('should handle zero accounts returned from Plaid', async () => {
    const mockPlaid = createMockPlaidClient({
      accountsGet: jest.fn().mockResolvedValue({
        data: {
          accounts: [], // No accounts
          item: {
            item_id: 'test-item-id',
            institution_id: 'ins_1',
          },
        },
      }),
    });
    getPlaidClient.mockReturnValue(mockPlaid);

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'user_settings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockPremiumUser,
              error: null,
            }),
          };
        }
        if (table === 'plaid_items') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            single: jest.fn().mockResolvedValue({
              data: { id: 1, item_id: 'test-item-id', user_id: 'test-user-id' },
              error: null,
            }),
          };
        }
        if (table === 'plaid_accounts') {
          return {
            delete: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { public_token: 'public-sandbox-token' },
    });

    const response = await exchangeToken(request);
    const json = await extractJson(response);

    // Should still succeed but with zero accounts
    expect(response.status).toBe(200);
    expect(json).toHaveProperty('item_id');
  });

  it('should handle database insertion errors', async () => {
    const mockPlaid = createMockPlaidClient();
    getPlaidClient.mockReturnValue(mockPlaid);

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'user_settings') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockPremiumUser,
              error: null,
            }),
          };
        }
        if (table === 'plaid_items') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database constraint violation' },
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { public_token: 'public-sandbox-token' },
    });

    const response = await exchangeToken(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed');
  });
});

describe('GET /api/plaid/accounts', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('User not authenticated');
  });

  it('should fetch all Plaid accounts for user', async () => {
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
        order: jest.fn().mockResolvedValue({
          data: mockPlaidAccountsDB,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.accounts).toHaveLength(2);
    expect(json.accounts[0]).toHaveProperty('account_name');
    expect(json.accounts[0]).toHaveProperty('current_balance');
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
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed');
  });

  it('should return empty array when no accounts exist', async () => {
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
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.accounts).toEqual([]);
  });
});
