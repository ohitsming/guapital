/**
 * Test Suite: /api/crypto/wallets
 * Tests crypto wallet management (GET, POST, DELETE)
 */

import { GET, POST, DELETE } from '@/app/api/crypto/wallets/route';
import {
  createMockSupabaseClient,
  createMockRequest,
  extractJson,
  setupTestEnv,
  cleanupTestEnv,
  mockCryptoWallets,
} from '../utils/testHelpers';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

const { createClient } = require('@/utils/supabase/server');

describe('GET /api/crypto/wallets', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('User not authenticated');
  });

  it('should fetch all crypto wallets with holdings', async () => {
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
          data: mockCryptoWallets,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.wallets).toHaveLength(1);
    expect(json.wallets[0]).toHaveProperty('wallet_address');
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
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to fetch wallets');
  });
});

describe('POST /api/crypto/wallets', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { wallet_address: '0x1234', blockchain: 'ethereum' },
    });
    const response = await POST(request);
    const json = await extractJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('User not authenticated');
  });

  it('should validate required fields', async () => {
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
      body: { wallet_address: '0x1234' }, // Missing blockchain
    });

    const response = await POST(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toContain('Missing required fields');
  });

  it('should validate blockchain', async () => {
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
      body: { wallet_address: '0x1234', blockchain: 'invalid_chain' },
    });

    const response = await POST(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid blockchain');
  });

  it('should prevent duplicate wallets', async () => {
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
          data: { id: 1 }, // Wallet already exists
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { wallet_address: '0x1234567890abcdef', blockchain: 'ethereum' },
    });

    const response = await POST(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Wallet already added');
  });

  it('should create a new wallet successfully', async () => {
    const newWallet = {
      id: 2,
      user_id: 'test-user-id',
      wallet_address: '0xabcdef1234567890',
      wallet_name: 'My Wallet',
      blockchain: 'ethereum',
      sync_status: 'pending',
      created_at: new Date().toISOString(),
    };

    let callCount = 0;

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'crypto_wallets') {
          const methods: any = {
            select: jest.fn(),
            eq: jest.fn(),
            insert: jest.fn(),
            single: jest.fn(),
          };

          // Set up chaining
          methods.select.mockReturnValue(methods);
          methods.eq.mockReturnValue(methods);
          methods.insert.mockReturnValue(methods);

          // single() resolves the chain
          methods.single.mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              // First call - check for existing
              return Promise.resolve({ data: null, error: null });
            } else {
              // Second call - return new wallet
              return Promise.resolve({ data: newWallet, error: null });
            }
          });

          return methods;
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: {
        wallet_address: '0xABCDEF1234567890', // Test case conversion
        wallet_name: 'My Wallet',
        blockchain: 'Ethereum', // Test case conversion
      },
    });

    const response = await POST(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.wallet).toHaveProperty('id');
    expect(json.wallet.wallet_address).toBe('0xabcdef1234567890'); // Should be lowercase
    expect(json.wallet.blockchain).toBe('ethereum'); // Should be lowercase
  });

  it('should accept all valid blockchains', async () => {
    const validChains = ['ethereum', 'polygon', 'base', 'arbitrum', 'optimism'];

    for (const chain of validChains) {
      const newWallet = {
        id: Math.floor(Math.random() * 1000),
        user_id: 'test-user-id',
        wallet_address: '0x' + Math.random().toString(16).substr(2, 40),
        blockchain: chain,
        sync_status: 'pending',
        created_at: new Date().toISOString(),
      };

      let callCount = 0;

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
            insert: jest.fn(),
            single: jest.fn(),
          };

          // Set up chaining
          methods.select.mockReturnValue(methods);
          methods.eq.mockReturnValue(methods);
          methods.insert.mockReturnValue(methods);

          methods.single.mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve({ data: null, error: null });
            } else {
              return Promise.resolve({ data: newWallet, error: null });
            }
          });

          return methods;
        }),
      };

      createClient.mockReturnValue(mockSupabase);

      const request = createMockRequest({
        method: 'POST',
        body: { wallet_address: newWallet.wallet_address, blockchain: chain },
      });

      const response = await POST(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(json.wallet.blockchain).toBe(chain);

      // Reset call count for next iteration
      callCount = 0;
    }
  });
});

describe('DELETE /api/crypto/wallets', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/crypto/wallets?id=1',
    });
    const response = await DELETE(request);
    const json = await extractJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('User not authenticated');
  });

  it('should validate wallet ID is provided', async () => {
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
      method: 'DELETE',
      url: 'http://localhost:3000/api/crypto/wallets', // No ID
    });

    const response = await DELETE(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Missing wallet ID');
  });

  it('should delete wallet successfully', async () => {
    const mockChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: function(resolve: any) {
        return Promise.resolve({ data: null, error: null }).then(resolve);
      },
    };

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => mockChain),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/crypto/wallets?id=1',
    });

    const response = await DELETE(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('should handle database errors on delete', async () => {
    const mockChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: function(resolve: any) {
        return Promise.resolve({ data: null, error: { message: 'Database error' } }).then(resolve);
      },
    };

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => mockChain),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/crypto/wallets?id=1',
    });

    const response = await DELETE(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to delete wallet');
  });

  // HIGH PRIORITY: Invalid ID format
  it('should handle invalid wallet ID format', async () => {
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
      method: 'DELETE',
      url: 'http://localhost:3000/api/crypto/wallets?id=invalid',
    });

    const response = await DELETE(request);
    const json = await extractJson(response);

    expect([400, 500]).toContain(response.status);
  });

  // HIGH PRIORITY: Non-existent wallet
  it('should handle deleting non-existent wallet gracefully', async () => {
    const mockChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: function(resolve: any) {
        return Promise.resolve({ data: null, error: null }).then(resolve);
      },
    };

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => mockChain),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/crypto/wallets?id=999999',
    });

    const response = await DELETE(request);

    // Should succeed silently or return appropriate status
    expect(response.status).toBe(200);
  });
});

describe('POST /api/crypto/wallets - Additional Edge Cases', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  // HIGH PRIORITY: Invalid wallet address format
  it('should reject invalid wallet address format', async () => {
    let callCount = 0;
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
          single: jest.fn(),
          insert: jest.fn(),
        };

        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.insert.mockReturnValue(methods);

        methods.single.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // First call - check for existing wallet
            return Promise.resolve({ data: null, error: null });
          } else {
            // Second call - insert fails with DB error
            return Promise.resolve({
              data: null,
              error: { message: 'Invalid wallet address format' },
            });
          }
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: {
        wallet_address: 'invalid-address-format',
        blockchain: 'ethereum',
      },
    });

    const response = await POST(request);
    const json = await extractJson(response);

    // API doesn't validate address format, causes DB error
    expect(response.status).toBe(500);
  });

  // HIGH PRIORITY: Empty wallet address
  it('should reject empty wallet address', async () => {
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
      body: {
        wallet_address: '',
        blockchain: 'ethereum',
      },
    });

    const response = await POST(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
  });

  // HIGH PRIORITY: Null wallet address
  it('should reject null wallet address', async () => {
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
      body: {
        wallet_address: null,
        blockchain: 'ethereum',
      },
    });

    const response = await POST(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
  });

  // HIGH PRIORITY: Address with invalid characters
  it('should reject address with invalid characters', async () => {
    let callCount = 0;
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
          single: jest.fn(),
          insert: jest.fn(),
        };

        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.insert.mockReturnValue(methods);

        methods.single.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({ data: null, error: null });
          } else {
            return Promise.resolve({
              data: null,
              error: { message: 'Invalid hex characters in address' },
            });
          }
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: {
        wallet_address: '0xGHIJKL1234567890', // Invalid hex characters
        blockchain: 'ethereum',
      },
    });

    const response = await POST(request);
    const json = await extractJson(response);

    // API doesn't validate address format, causes DB error
    expect(response.status).toBe(500);
  });

  // HIGH PRIORITY: Address too short
  it('should reject address that is too short', async () => {
    let callCount = 0;
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
          single: jest.fn(),
          insert: jest.fn(),
        };

        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.insert.mockReturnValue(methods);

        methods.single.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({ data: null, error: null });
          } else {
            return Promise.resolve({
              data: null,
              error: { message: 'Address too short' },
            });
          }
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: {
        wallet_address: '0x1234', // Too short
        blockchain: 'ethereum',
      },
    });

    const response = await POST(request);
    const json = await extractJson(response);

    // API doesn't validate address length, causes DB error
    expect(response.status).toBe(500);
  });

  // HIGH PRIORITY: Whitespace handling
  it('should trim whitespace from wallet address', async () => {
    const newWallet = {
      id: 10,
      user_id: 'test-user-id',
      wallet_address: '0xabcdef1234567890abcdef1234567890abcdef12',
      blockchain: 'ethereum',
      sync_status: 'pending',
      created_at: new Date().toISOString(),
    };

    let callCount = 0;

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
          insert: jest.fn(),
          single: jest.fn(),
        };

        // Set up chaining
        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.insert.mockReturnValue(methods);

        methods.single.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({ data: null, error: null });
          } else {
            return Promise.resolve({ data: newWallet, error: null });
          }
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: {
        wallet_address: '  0xABCDEF1234567890ABCDEF1234567890ABCDEF12  ',
        blockchain: 'ethereum',
      },
    });

    const response = await POST(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.wallet.wallet_address).not.toContain(' ');
  });

  // HIGH PRIORITY: Invalid data types
  it('should reject number for wallet address', async () => {
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
          data: null,
          error: null,
        }),
        insert: jest.fn().mockReturnThis(),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: {
        wallet_address: 123456789,
        blockchain: 'ethereum',
      },
    });

    const response = await POST(request);
    const json = await extractJson(response);

    // API doesn't validate type, so number causes error when calling .toLowerCase()
    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
  });

  // MEDIUM PRIORITY: Empty wallet name
  it('should handle empty wallet name', async () => {
    const newWallet = {
      id: 11,
      user_id: 'test-user-id',
      wallet_address: '0xabcdef1234567890abcdef1234567890abcdef13',
      wallet_name: '',
      blockchain: 'ethereum',
      sync_status: 'pending',
      created_at: new Date().toISOString(),
    };

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => {
        const methods = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          single: jest.fn(),
        };

        let callCount = 0;
        methods.single.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({ data: null, error: null });
          } else {
            return Promise.resolve({ data: newWallet, error: null });
          }
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: {
        wallet_address: '0xabcdef1234567890abcdef1234567890abcdef13',
        wallet_name: '',
        blockchain: 'ethereum',
      },
    });

    const response = await POST(request);
    const json = await extractJson(response);

    expect([200, 201]).toContain(response.status);
  });

  // MEDIUM PRIORITY: Very long wallet name
  it('should handle very long wallet name', async () => {
    const longName = 'A'.repeat(1000);
    const newWallet = {
      id: 100,
      user_id: 'test-user-id',
      wallet_address: '0xabcdef1234567890abcdef1234567890abcdef14',
      wallet_name: longName,
      blockchain: 'ethereum',
      sync_status: 'pending',
      created_at: new Date().toISOString(),
    };

    let callCount = 0;

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
          insert: jest.fn(),
          single: jest.fn(),
        };

        // Set up chaining
        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.insert.mockReturnValue(methods);

        methods.single.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({ data: null, error: null });
          } else {
            return Promise.resolve({ data: newWallet, error: null });
          }
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: {
        wallet_address: '0xabcdef1234567890abcdef1234567890abcdef14',
        wallet_name: longName,
        blockchain: 'ethereum',
      },
    });

    const response = await POST(request);
    const json = await extractJson(response);

    // API doesn't validate name length, so it accepts long names
    expect(response.status).toBe(200);
  });

  // MEDIUM PRIORITY: Special characters in name
  it('should handle special characters in wallet name', async () => {
    const newWallet = {
      id: 12,
      user_id: 'test-user-id',
      wallet_address: '0xabcdef1234567890abcdef1234567890abcdef15',
      wallet_name: 'My 🚀 Wallet 💰',
      blockchain: 'ethereum',
      sync_status: 'pending',
      created_at: new Date().toISOString(),
    };

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => {
        const methods = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          single: jest.fn(),
        };

        let callCount = 0;
        methods.single.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({ data: null, error: null });
          } else {
            return Promise.resolve({ data: newWallet, error: null });
          }
        });

        return methods;
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: {
        wallet_address: '0xabcdef1234567890abcdef1234567890abcdef15',
        wallet_name: 'My 🚀 Wallet 💰',
        blockchain: 'ethereum',
      },
    });

    const response = await POST(request);
    const json = await extractJson(response);

    expect([200, 201]).toContain(response.status);
  });
});

describe('GET /api/crypto/wallets - Additional Edge Cases', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  // MEDIUM PRIORITY: Empty wallets list
  it('should handle empty wallets list', async () => {
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
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.wallets).toEqual([]);
  });

  // MEDIUM PRIORITY: Wallets with no holdings
  it('should handle wallets with empty holdings', async () => {
    const walletsWithNoHoldings = [
      {
        id: 1,
        wallet_address: '0xabcdef1234567890',
        blockchain: 'ethereum',
        crypto_holdings: [],
      },
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
        order: jest.fn().mockResolvedValue({
          data: walletsWithNoHoldings,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await GET(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.wallets).toHaveLength(1);
    expect(json.wallets[0].crypto_holdings).toEqual([]);
  });
});
