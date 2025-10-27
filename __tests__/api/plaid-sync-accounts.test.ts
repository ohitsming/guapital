/**
 * Test Suite: Plaid Sync Accounts API Route
 * Tests /api/plaid/sync-accounts
 */

import { POST as syncAccounts } from '@/app/api/plaid/sync-accounts/route';
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

describe('POST /api/plaid/sync-accounts', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { item_id: 1 },
    });
    const response = await syncAccounts(request);
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

    const request = createMockRequest({
      method: 'POST',
      body: { item_id: 1 },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(403);
    expect(json.error).toBe('Premium feature');
    expect(json.message).toContain('Premium subscribers');

    process.env.NODE_ENV = 'test';
  });

  it('should return 404 if plaid item not found', async () => {
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
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
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
      body: { item_id: 999 },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('Plaid item not found');
  });

  it('should return cached data when sync is not needed (24-hour cache)', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const createChainableMock = (resolvedValue: any) => {
          const mockChain: any = {};
          mockChain.select = jest.fn().mockReturnValue(mockChain);
          mockChain.eq = jest.fn().mockReturnValue(mockChain);
          mockChain.single = jest.fn().mockResolvedValue(resolvedValue);
          mockChain.then = function(resolve: any) {
            return Promise.resolve(resolvedValue).then(resolve);
          };
          return mockChain;
        };

        if (table === 'user_settings') {
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: {
              id: 1,
              item_id: 'test-item-id',
              access_token: 'access-token',
              last_successful_sync_at: new Date().toISOString(),
            },
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({
            data: [
              { id: 1, account_name: 'Checking' },
              { id: 2, account_name: 'Savings' },
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
      body: { item_id: 1, force: false },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.cached).toBe(true);
    expect(json.accounts_synced).toBe(2);
    expect(json.message).toContain('cached');
  });

  it('should bypass cache when force=true', async () => {
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
        const createChainableMock = (resolvedValue: any) => {
          const mockChain: any = {};
          mockChain.select = jest.fn().mockReturnValue(mockChain);
          mockChain.update = jest.fn().mockReturnValue(mockChain);
          mockChain.eq = jest.fn().mockReturnValue(mockChain);
          mockChain.single = jest.fn().mockResolvedValue(resolvedValue);
          mockChain.then = function(resolve: any) {
            return Promise.resolve(resolvedValue).then(resolve);
          };
          return mockChain;
        };

        if (table === 'user_settings') {
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: {
              id: 1,
              item_id: 'test-item-id',
              access_token: 'access-token',
            },
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({ data: null, error: null });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'check_sync_quota') {
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
      body: { item_id: 1, force: true },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.cached).toBe(false);
    expect(mockPlaid.accountsGet).toHaveBeenCalled();
  });

  it('should return 429 when sync quota is exceeded', async () => {
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
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 1,
                item_id: 'test-item-id',
                access_token: 'access-token',
              },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null }); // Needs sync
        }
        if (fnName === 'check_sync_quota') {
          return Promise.resolve({ data: false, error: null }); // No quota
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { item_id: 1, force: false },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(429);
    expect(json.error).toBe('Daily sync quota exceeded');
    expect(json.message).toContain('limit');
  });

  it('should successfully sync accounts from Plaid', async () => {
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
        const createChainableMock = (resolvedValue: any) => {
          const mockChain: any = {};
          mockChain.select = jest.fn().mockReturnValue(mockChain);
          mockChain.update = jest.fn().mockReturnValue(mockChain);
          mockChain.eq = jest.fn().mockReturnValue(mockChain);
          mockChain.single = jest.fn().mockResolvedValue(resolvedValue);
          mockChain.then = function(resolve: any) {
            return Promise.resolve(resolvedValue).then(resolve);
          };
          return mockChain;
        };

        if (table === 'user_settings') {
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: {
              id: 1,
              item_id: 'test-item-id',
              access_token: 'access-token',
            },
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({ data: null, error: null });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'check_sync_quota') {
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
      body: { item_id: 1 },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.cached).toBe(false);
    expect(json.accounts_synced).toBe(2);
    expect(mockPlaid.accountsGet).toHaveBeenCalled();
  });

  it('should handle Plaid API errors and update item status', async () => {
    const mockPlaid = createMockPlaidClient({
      client: {
        accountsGet: jest.fn().mockRejectedValue({
          message: 'INVALID_ACCESS_TOKEN',
          response: {
            data: {
              error_code: 'INVALID_ACCESS_TOKEN',
              error_message: 'Access token is invalid',
            },
          },
        }),
      },
    });
    getPlaidClient.mockReturnValue(mockPlaid);

    const updateMock = jest.fn();
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const createChainableMock = (resolvedValue: any) => {
          const mockChain: any = {};
          mockChain.select = jest.fn().mockReturnValue(mockChain);
          mockChain.update = table === 'plaid_items' ? updateMock : jest.fn().mockReturnValue(mockChain);
          mockChain.eq = jest.fn().mockReturnValue(mockChain);
          mockChain.single = jest.fn().mockResolvedValue(resolvedValue);
          mockChain.then = function(resolve: any) {
            return Promise.resolve(resolvedValue).then(resolve);
          };
          return mockChain;
        };

        if (table === 'user_settings') {
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          const chain = createChainableMock({
            data: {
              id: 1,
              item_id: 'test-item-id',
              access_token: 'invalid-token',
            },
            error: null,
          });
          updateMock.mockReturnValue(chain);
          return chain;
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'check_sync_quota') {
          return Promise.resolve({ data: true, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { item_id: 1 },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed');

    // Verify item status was updated to error
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sync_status: 'error',
      })
    );
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
      from: jest.fn((table: string) => {
        const createChainableMock = (resolvedValue: any) => {
          const mockChain: any = {};
          mockChain.select = jest.fn().mockReturnValue(mockChain);
          mockChain.update = jest.fn().mockReturnValue(mockChain);
          mockChain.eq = jest.fn().mockReturnValue(mockChain);
          mockChain.single = jest.fn().mockResolvedValue(resolvedValue);
          mockChain.then = function(resolve: any) {
            return Promise.resolve(resolvedValue).then(resolve);
          };
          return mockChain;
        };

        if (table === 'plaid_items') {
          return createChainableMock({
            data: {
              id: 1,
              item_id: 'test-item-id',
              access_token: 'access-token',
            },
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({ data: null, error: null });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'check_sync_quota') {
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
      body: { item_id: 1 },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);

    process.env.NODE_ENV = 'test';
  });

  // HIGH PRIORITY EDGE CASES

  it('should handle invalid item_id (null)', async () => {
    const mockSupabase = createMockSupabaseClient({
      user: { id: 'test-user-id' },
      userSettings: mockPremiumUser,
    });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { item_id: null },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toContain('item_id');
  });

  it('should handle invalid item_id (string)', async () => {
    const mockSupabase = createMockSupabaseClient({
      user: { id: 'test-user-id' },
      userSettings: mockPremiumUser,
    });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { item_id: 'not-a-number' },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toContain('item_id');
  });

  it('should handle invalid item_id (negative)', async () => {
    const mockSupabase = createMockSupabaseClient({
      user: { id: 'test-user-id' },
      userSettings: mockPremiumUser,
    });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { item_id: -1 },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toContain('item_id');
  });

  it('should handle empty accounts array from Plaid', async () => {
    const mockPlaid = createMockPlaidClient({
      client: {
        accountsGet: jest.fn().mockResolvedValue({
          data: {
            accounts: [],
            item: { item_id: 'test-item' },
          },
        }),
      },
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
        const createChainableMock = (resolvedValue: any) => {
          const mockChain: any = {};
          mockChain.select = jest.fn().mockReturnValue(mockChain);
          mockChain.update = jest.fn().mockReturnValue(mockChain);
          mockChain.eq = jest.fn().mockReturnValue(mockChain);
          mockChain.single = jest.fn().mockResolvedValue(resolvedValue);
          mockChain.then = function(resolve: any) {
            return Promise.resolve(resolvedValue).then(resolve);
          };
          return mockChain;
        };

        if (table === 'user_settings') {
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: {
              id: 1,
              item_id: 'test-item-id',
              access_token: 'access-token',
            },
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({ data: null, error: null });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'check_sync_quota') {
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
      body: { item_id: 1 },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.accounts_synced).toBe(0);
  });

  it('should handle ITEM_LOGIN_REQUIRED error', async () => {
    const mockPlaid = createMockPlaidClient({
      client: {
        accountsGet: jest.fn().mockRejectedValue({
          message: 'ITEM_LOGIN_REQUIRED',
          response: {
            data: {
              error_code: 'ITEM_LOGIN_REQUIRED',
              error_message: 'User needs to re-authenticate',
            },
          },
        }),
      },
    });
    getPlaidClient.mockReturnValue(mockPlaid);

    const updateMock = jest.fn();
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const createChainableMock = (resolvedValue: any) => {
          const mockChain: any = {};
          mockChain.select = jest.fn().mockReturnValue(mockChain);
          mockChain.update = table === 'plaid_items' ? updateMock : jest.fn().mockReturnValue(mockChain);
          mockChain.eq = jest.fn().mockReturnValue(mockChain);
          mockChain.single = jest.fn().mockResolvedValue(resolvedValue);
          mockChain.then = function(resolve: any) {
            return Promise.resolve(resolvedValue).then(resolve);
          };
          return mockChain;
        };

        if (table === 'user_settings') {
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          const chain = createChainableMock({
            data: {
              id: 1,
              item_id: 'test-item-id',
              access_token: 'access-token',
            },
            error: null,
          });
          updateMock.mockReturnValue(chain);
          return chain;
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'check_sync_quota') {
          return Promise.resolve({ data: true, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { item_id: 1 },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sync_status: 'error',
      })
    );
  });

  it('should handle database query failure on plaid_items fetch', async () => {
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
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockRejectedValue(new Error('Database connection failed')),
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
      body: { item_id: 1 },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed');
  });

  it('should handle null balance values from Plaid', async () => {
    const mockPlaid = createMockPlaidClient({
      client: {
        accountsGet: jest.fn().mockResolvedValue({
          data: {
            accounts: [
              {
                account_id: 'acc_1',
                name: 'Account with null balance',
                type: 'depository',
                subtype: 'checking',
                balances: {
                  current: null,
                  available: null,
                  limit: null,
                },
              },
            ],
            item: { item_id: 'test-item' },
          },
        }),
      },
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
        const createChainableMock = (resolvedValue: any) => {
          const mockChain: any = {};
          mockChain.select = jest.fn().mockReturnValue(mockChain);
          mockChain.update = jest.fn().mockReturnValue(mockChain);
          mockChain.eq = jest.fn().mockReturnValue(mockChain);
          mockChain.single = jest.fn().mockResolvedValue(resolvedValue);
          mockChain.then = function(resolve: any) {
            return Promise.resolve(resolvedValue).then(resolve);
          };
          return mockChain;
        };

        if (table === 'user_settings') {
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: {
              id: 1,
              item_id: 'test-item-id',
              access_token: 'access-token',
            },
            error: null,
          });
        }
        if (table === 'plaid_accounts') {
          return createChainableMock({ data: null, error: null });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'check_sync_quota') {
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
      body: { item_id: 1 },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.accounts_synced).toBe(1);
  });

  // MEDIUM PRIORITY EDGE CASES

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
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 1,
                item_id: 'test-item-id',
                access_token: 'access-token',
              },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
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
      body: { item_id: 1 },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed');
  });

  it('should handle network timeout from Plaid', async () => {
    const mockPlaid = createMockPlaidClient({
      client: {
        accountsGet: jest.fn().mockRejectedValue({
          message: 'ETIMEDOUT',
          code: 'ETIMEDOUT',
        }),
      },
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
        const createChainableMock = (resolvedValue: any) => {
          const mockChain: any = {};
          mockChain.select = jest.fn().mockReturnValue(mockChain);
          mockChain.update = jest.fn().mockReturnValue(mockChain);
          mockChain.eq = jest.fn().mockReturnValue(mockChain);
          mockChain.single = jest.fn().mockResolvedValue(resolvedValue);
          mockChain.then = function(resolve: any) {
            return Promise.resolve(resolvedValue).then(resolve);
          };
          return mockChain;
        };

        if (table === 'user_settings') {
          return createChainableMock({
            data: mockPremiumUser,
            error: null,
          });
        }
        if (table === 'plaid_items') {
          return createChainableMock({
            data: {
              id: 1,
              item_id: 'test-item-id',
              access_token: 'access-token',
            },
            error: null,
          });
        }
        return createChainableMock({ data: null, error: null });
      }),
      rpc: jest.fn((fnName: string) => {
        if (fnName === 'should_sync_plaid_item') {
          return Promise.resolve({ data: true, error: null });
        }
        if (fnName === 'check_sync_quota') {
          return Promise.resolve({ data: true, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { item_id: 1 },
    });
    const response = await syncAccounts(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed');
  });
});
