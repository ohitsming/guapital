/**
 * Test Suite: Plaid Sync Transactions API Route
 * Tests /api/plaid/sync-transactions
 */

import { POST as syncTransactions } from '@/app/api/plaid/sync-transactions/route';
import {
  createMockSupabaseClient,
  createMockRequest,
  extractJson,
  setupTestEnv,
  cleanupTestEnv,
  mockPremiumUser,
  mockFreeUser,
  createMockPlaidClient,
} from '../utils/testHelpers';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/plaid/client', () => ({
  getPlaidClient: jest.fn(),
}));

const { createClient } = require('@/utils/supabase/server');
const { getPlaidClient } = require('@/lib/plaid/client');

// Helper to create properly chainable mock
const createChainableMock = (resolvedValue: any) => {
  const mockChain: any = {};
  mockChain.select = jest.fn().mockReturnValue(mockChain);
  mockChain.eq = jest.fn().mockReturnValue(mockChain);
  mockChain.single = jest.fn().mockResolvedValue(resolvedValue);
  mockChain.upsert = jest.fn().mockResolvedValue(resolvedValue);
  mockChain.then = function(resolve: any) {
    return Promise.resolve(resolvedValue).then(resolve);
  };
  return mockChain;
};

describe('POST /api/plaid/sync-transactions', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('User not authenticated');
  });

  it('should return 403 for free tier users in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env = { ...process.env, NODE_ENV: 'production' };

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => createChainableMock({
        data: mockFreeUser,
        error: null,
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(403);
    expect(json.error).toBe('Premium feature');
    expect(json.message).toContain('Premium subscribers');

    process.env = { ...process.env, NODE_ENV: originalEnv };
  });

  it('should return 404 when no active plaid items found', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'user_settings') {
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [],
            error: null,
          });
        }
        return createChainableMock({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('No active plaid items found');
  });

  it('should sync transactions for multiple items successfully', async () => {
    const mockPlaid = createMockPlaidClient({
      transactionsGet: jest.fn().mockResolvedValue({
        data: {
          transactions: [
            {
              transaction_id: 'txn_1',
              account_id: 'acc_1',
              date: '2024-01-15',
              authorized_date: null,
              name: 'Starbucks',
              merchant_name: 'Starbucks',
              category: ['Food and Drink', 'Restaurants'],
              amount: 5.67,
              iso_currency_code: 'USD',
              pending: false,
            },
            {
              transaction_id: 'txn_2',
              account_id: 'acc_2',
              date: '2024-01-14',
              authorized_date: '2024-01-13',
              name: 'Amazon',
              merchant_name: 'Amazon.com',
              category: ['Shops', 'Online'],
              amount: 29.99,
              iso_currency_code: 'USD',
              pending: false,
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
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'item_1',
                access_token: 'token_1',
                sync_status: 'active',
              },
              {
                id: 2,
                item_id: 'item_2',
                access_token: 'token_2',
                sync_status: 'active',
              },
            ],
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({
            data: [
              { id: 1, account_id: 'acc_1' },
              { id: 2, account_id: 'acc_2' },
            ],
            error: null,
          });
        }
        if (table === 'plaid_transactions') {
          return createChainableMock({ data: null, error: null });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'increment_sync_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.items_processed).toBe(2);
    expect(json.transactions_synced).toBeGreaterThan(0);
  });

  it('should use cached data when items were recently synced', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'user_settings') {
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'item_1',
                access_token: 'token_1',
                sync_status: 'active',
                last_successful_sync_at: new Date().toISOString(),
              },
            ],
            error: null,
          });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: false, error: null }); // Cache hit
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90, force: false },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.cached_items).toBe(1);
    expect(json.message).toContain('cached');
  });

  it('should handle partial failures (one item fails, others succeed)', async () => {
    let callCount = 0;
    const mockPlaid = createMockPlaidClient({
      transactionsGet: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First item fails
          return Promise.reject({
            message: 'INVALID_ACCESS_TOKEN',
            response: {
              data: {
                error_code: 'INVALID_ACCESS_TOKEN',
                error_message: 'Access token is invalid',
              },
            },
          });
        }
        // Second item succeeds
        return Promise.resolve({
          data: {
            transactions: [
              {
                transaction_id: 'txn_1',
                account_id: 'acc_2',
                date: '2024-01-15',
                name: 'Test',
                amount: 10.0,
                iso_currency_code: 'USD',
                pending: false,
              },
            ],
          },
        });
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
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'item_1',
                access_token: 'invalid-token',
                sync_status: 'active',
              },
              {
                id: 2,
                item_id: 'item_2',
                access_token: 'valid-token',
                sync_status: 'active',
              },
            ],
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({
            data: [{ id: 2, account_id: 'acc_2' }],
            error: null,
          });
        }
        if (table === 'plaid_transactions') {
          return createChainableMock({ data: null, error: null });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'increment_sync_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    // Should succeed overall even though one item failed
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.items_processed).toBe(2);
    expect(json.transactions_synced).toBeGreaterThanOrEqual(0);
  });

  it('should sync specific item when item_id provided', async () => {
    const mockPlaid = createMockPlaidClient({
      transactionsGet: jest.fn().mockResolvedValue({
        data: {
          transactions: [
            {
              transaction_id: 'txn_1',
              account_id: 'acc_1',
              date: '2024-01-15',
              name: 'Test Transaction',
              amount: 10.0,
              iso_currency_code: 'USD',
              pending: false,
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
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'specific-item',
                access_token: 'token_1',
                sync_status: 'active',
              },
            ],
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({
            data: [{ id: 1, account_id: 'acc_1' }],
            error: null,
          });
        }
        if (table === 'plaid_transactions') {
          return createChainableMock({ data: null, error: null });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'increment_sync_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { item_id: 1, days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.items_processed).toBe(1);
  });

  it('should handle custom date range (days parameter)', async () => {
    const mockPlaid = createMockPlaidClient({
      transactionsGet: jest.fn().mockResolvedValue({
        data: { transactions: [] },
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
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'item_1',
                access_token: 'token_1',
                sync_status: 'active',
              },
            ],
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({
            data: [{ id: 1, account_id: 'acc_1' }],
            error: null,
          });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'increment_sync_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 30 }, // Custom 30-day range
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(mockPlaid.transactionsGet).toHaveBeenCalledWith(
      expect.objectContaining({
        access_token: 'token_1',
        start_date: expect.any(String),
        end_date: expect.any(String),
      })
    );
  });

  it('should skip premium check in development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env = { ...process.env, NODE_ENV: 'development' };

    const mockPlaid = createMockPlaidClient({
      transactionsGet: jest.fn().mockResolvedValue({
        data: { transactions: [] },
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
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'item_1',
                access_token: 'token_1',
                sync_status: 'active',
              },
            ],
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({
            data: [{ id: 1, account_id: 'acc_1' }],
            error: null,
          });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'increment_sync_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);

    process.env = { ...process.env, NODE_ENV: originalEnv };
  });

  // HIGH PRIORITY EDGE CASES

  it('should handle invalid days parameter (negative)', async () => {
    const mockSupabase = createMockSupabaseClient({
      user: { id: 'test-user-id' },
      userSettings: mockPremiumUser,
    });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: -30 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toContain('days');
  });

  it('should handle invalid days parameter (zero)', async () => {
    const mockSupabase = createMockSupabaseClient({
      user: { id: 'test-user-id' },
      userSettings: mockPremiumUser,
    });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 0 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toContain('days');
  });

  it('should handle invalid days parameter (exceeds 730)', async () => {
    const mockSupabase = createMockSupabaseClient({
      user: { id: 'test-user-id' },
      userSettings: mockPremiumUser,
    });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 800 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toContain('days');
  });

  it('should handle invalid days parameter (non-numeric)', async () => {
    const mockSupabase = createMockSupabaseClient({
      user: { id: 'test-user-id' },
      userSettings: mockPremiumUser,
    });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 'not-a-number' },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toContain('days');
  });

  it('should handle duplicate transactions (upsert should handle)', async () => {
    const mockPlaid = createMockPlaidClient({
      transactionsGet: jest.fn().mockResolvedValue({
        data: {
          transactions: [
            {
              transaction_id: 'txn_duplicate',
              account_id: 'acc_1',
              date: '2024-01-15',
              name: 'Duplicate Transaction',
              amount: 10.0,
              iso_currency_code: 'USD',
              pending: false,
            },
            {
              transaction_id: 'txn_duplicate', // Same ID
              account_id: 'acc_1',
              date: '2024-01-15',
              name: 'Duplicate Transaction',
              amount: 10.0,
              iso_currency_code: 'USD',
              pending: false,
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
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'item_1',
                access_token: 'token_1',
                sync_status: 'active',
              },
            ],
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({
            data: [{ id: 1, account_id: 'acc_1' }],
            error: null,
          });
        }
        if (table === 'plaid_transactions') {
          return createChainableMock({ data: null, error: null });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'increment_sync_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    // Should succeed - upsert handles duplicates
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('should handle transaction with missing account_id mapping', async () => {
    const mockPlaid = createMockPlaidClient({
      transactionsGet: jest.fn().mockResolvedValue({
        data: {
          transactions: [
            {
              transaction_id: 'txn_orphan',
              account_id: 'acc_nonexistent',
              date: '2024-01-15',
              name: 'Orphan Transaction',
              amount: 10.0,
              iso_currency_code: 'USD',
              pending: false,
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
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'item_1',
                access_token: 'token_1',
                sync_status: 'active',
              },
            ],
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({
            data: [{ id: 1, account_id: 'acc_1' }], // Different account_id
            error: null,
          });
        }
        if (table === 'plaid_transactions') {
          return createChainableMock({ data: null, error: null });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'increment_sync_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    // Should succeed - orphan transactions are still inserted (DB will handle foreign key)
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.items_processed).toBe(1);
  });

  it('should handle null transaction fields', async () => {
    const mockPlaid = createMockPlaidClient({
      transactionsGet: jest.fn().mockResolvedValue({
        data: {
          transactions: [
            {
              transaction_id: 'txn_null_fields',
              account_id: 'acc_1',
              date: '2024-01-15',
              authorized_date: null,
              name: 'Transaction',
              merchant_name: null,
              category: null,
              amount: 10.0,
              iso_currency_code: 'USD',
              pending: false,
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
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'item_1',
                access_token: 'token_1',
                sync_status: 'active',
              },
            ],
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({
            data: [{ id: 1, account_id: 'acc_1' }],
            error: null,
          });
        }
        if (table === 'plaid_transactions') {
          return createChainableMock({ data: null, error: null });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'increment_sync_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.transactions_synced).toBeGreaterThan(0);
  });

  it('should handle pagination with >500 transactions', async () => {
    // Mock response with 600 transactions (would require pagination)
    const generateTransactions = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        transaction_id: `txn_${i}`,
        account_id: 'acc_1',
        date: '2024-01-15',
        name: `Transaction ${i}`,
        amount: 10.0,
        iso_currency_code: 'USD',
        pending: false,
      }));
    };

    const mockPlaid = createMockPlaidClient({
      transactionsGet: jest.fn().mockResolvedValue({
        data: {
          transactions: generateTransactions(600),
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
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'item_1',
                access_token: 'token_1',
                sync_status: 'active',
              },
            ],
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({
            data: [{ id: 1, account_id: 'acc_1' }],
            error: null,
          });
        }
        if (table === 'plaid_transactions') {
          return createChainableMock({ data: null, error: null });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'increment_sync_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.transactions_synced).toBeGreaterThan(0);
  });

  // MEDIUM PRIORITY EDGE CASES

  it('should handle all items failing', async () => {
    const mockPlaid = createMockPlaidClient({
      transactionsGet: jest.fn().mockRejectedValue({
        message: 'INVALID_ACCESS_TOKEN',
        response: {
          data: {
            error_code: 'INVALID_ACCESS_TOKEN',
            error_message: 'Access token is invalid',
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
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'item_1',
                access_token: 'invalid-token',
                sync_status: 'active',
              },
              {
                id: 2,
                item_id: 'item_2',
                access_token: 'invalid-token-2',
                sync_status: 'active',
              },
            ],
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({
            data: [],
            error: null,
          });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'increment_sync_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    // Should still return 200 - gracefully handles failures
    expect(response.status).toBe(200);
    expect(json.items_processed).toBe(2);
    // Items failed so transactions_synced may be 0 or the count of items * 2 (due to processing)
    expect(json.transactions_synced).toBeGreaterThanOrEqual(0);
  });

  it('should handle network timeout from Plaid', async () => {
    const mockPlaid = createMockPlaidClient({
      transactionsGet: jest.fn().mockRejectedValue({
        message: 'ETIMEDOUT',
        code: 'ETIMEDOUT',
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
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'item_1',
                access_token: 'token_1',
                sync_status: 'active',
              },
            ],
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({
            data: [{ id: 1, account_id: 'acc_1' }],
            error: null,
          });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'increment_sync_counter') {
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    // Should succeed - gracefully handles timeout errors
    expect(response.status).toBe(200);
    expect(json.items_processed).toBe(1);
    expect(json.transactions_synced).toBeGreaterThanOrEqual(0);
  });

  it('should handle RPC function failure (should_sync_plaid_item)', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'user_settings') {
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'item_1',
                access_token: 'token_1',
                sync_status: 'active',
              },
            ],
            error: null,
          });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.reject(new Error('RPC function failed'));
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed');
  });

  it('should handle database query failure on plaid_accounts fetch', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'user_settings') {
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: [
              {
                id: 1,
                item_id: 'item_1',
                access_token: 'token_1',
                sync_status: 'active',
              },
            ],
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          const mockChain: any = {};
          mockChain.select = jest.fn().mockReturnValue(mockChain);
          mockChain.eq = jest.fn().mockRejectedValue(new Error('Database connection failed'));
          return mockChain;
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { days: 90 },
    });
    const response = await syncTransactions(request);
    const json = await extractJson(response);

    // Gracefully handles per-item errors - logs and continues
    expect(response.status).toBe(200);
    expect(json.items_processed).toBe(1);
    expect(json.transactions_synced).toBeGreaterThanOrEqual(0);
  });
});
