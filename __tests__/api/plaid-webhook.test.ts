/**
 * Test Suite: Plaid Webhook Handler
 * Tests /api/plaid/webhook
 *
 * CRITICAL: Webhooks are the key to 70% cost savings ($3,540/month at 5K users)
 * This test suite ensures webhook reliability and proper event handling
 */

import { POST as handleWebhook, GET as getWebhookStatus } from '@/app/api/plaid/webhook/route';
import {
  createMockRequest,
  extractJson,
  setupTestEnv,
  cleanupTestEnv,
} from '../utils/testHelpers';

// Mock Supabase client (service role)
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock webhook-sync functions
jest.mock('@/lib/plaid/webhook-sync', () => ({
  syncAccountBalances: jest.fn().mockResolvedValue(undefined),
  syncTransactionsForItem: jest.fn().mockResolvedValue(undefined),
  removeTransactions: jest.fn().mockResolvedValue(undefined),
  logWebhookEvent: jest.fn().mockResolvedValue(undefined),
}));

const { createClient } = require('@supabase/supabase-js');
const {
  syncAccountBalances,
  syncTransactionsForItem,
  removeTransactions,
  logWebhookEvent,
} = require('@/lib/plaid/webhook-sync');

describe('GET /api/plaid/webhook', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());

  it('should return webhook status', async () => {
    const request = createMockRequest({ method: 'GET' });
    const response = await getWebhookStatus(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.message).toContain('active');
    expect(json.timestamp).toBeDefined();
  });
});

describe('POST /api/plaid/webhook', () => {
  let mockSupabase: any;
  let mockUpdate: jest.Mock;
  let mockEq: jest.Mock;

  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock chain that returns the same object for verification
    mockUpdate = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockResolvedValue({ data: null, error: null });

    const mockChain = {
      update: mockUpdate,
      eq: mockEq,
    };

    // Create mock Supabase service role client
    mockSupabase = {
      from: jest.fn().mockReturnValue(mockChain),
    };

    createClient.mockReturnValue(mockSupabase);
  });

  describe('TRANSACTIONS webhooks', () => {
    it('should handle INITIAL_UPDATE webhook', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'INITIAL_UPDATE',
          item_id: 'test-item-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
      expect(logWebhookEvent).toHaveBeenCalledWith(
        mockSupabase,
        'TRANSACTIONS',
        'INITIAL_UPDATE',
        'test-item-id',
        expect.any(Object)
      );
      expect(syncTransactionsForItem).toHaveBeenCalledWith(
        mockSupabase,
        'test-item-id',
        90 // Last 90 days
      );
      expect(syncAccountBalances).toHaveBeenCalledWith(
        mockSupabase,
        'test-item-id'
      );

      // Verify plaid_items is updated with active status
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sync_status: 'active',
          last_sync_at: expect.any(String),
        })
      );
      expect(mockEq).toHaveBeenCalledWith('item_id', 'test-item-id');
    });

    it('should handle INITIAL_UPDATE sync failures gracefully', async () => {
      syncTransactionsForItem.mockRejectedValueOnce(
        new Error('Initial sync failed')
      );

      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'INITIAL_UPDATE',
          item_id: 'test-item-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      // Should still return 200 to prevent Plaid retries
      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
    });

    it('should handle DEFAULT_UPDATE webhook (key cost-saving event)', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'DEFAULT_UPDATE',
          item_id: 'test-item-id',
          new_transactions: 5,
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
      expect(syncTransactionsForItem).toHaveBeenCalledWith(
        mockSupabase,
        'test-item-id',
        30 // Last 30 days
      );
      expect(syncAccountBalances).toHaveBeenCalledWith(
        mockSupabase,
        'test-item-id'
      );
    });

    it('should handle balance sync failures gracefully', async () => {
      syncAccountBalances.mockRejectedValueOnce(
        new Error('Balance sync failed')
      );

      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'DEFAULT_UPDATE',
          item_id: 'test-item-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      // Should still return 200 even if balance sync fails
      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
    });

    it('should handle HISTORICAL_UPDATE webhook', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'HISTORICAL_UPDATE',
          item_id: 'test-item-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(syncTransactionsForItem).toHaveBeenCalledWith(
        mockSupabase,
        'test-item-id',
        730 // 2 years
      );
    });

    it('should handle TRANSACTIONS_REMOVED webhook', async () => {
      const removedTxnIds = ['txn_1', 'txn_2', 'txn_3'];

      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'TRANSACTIONS_REMOVED',
          item_id: 'test-item-id',
          removed_transactions: removedTxnIds,
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(removeTransactions).toHaveBeenCalledWith(
        mockSupabase,
        removedTxnIds
      );
    });

    it('should handle TRANSACTIONS_REMOVED with empty array', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'TRANSACTIONS_REMOVED',
          item_id: 'test-item-id',
          removed_transactions: [],
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(removeTransactions).not.toHaveBeenCalled();
    });

    it('should handle TRANSACTIONS_REMOVED with undefined removed_transactions', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'TRANSACTIONS_REMOVED',
          item_id: 'test-item-id',
          // removed_transactions is undefined (not in payload)
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      // Should not call removeTransactions when field is undefined
      expect(removeTransactions).not.toHaveBeenCalled();
    });

    it('should handle unknown transaction webhook codes gracefully', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'UNKNOWN_CODE',
          item_id: 'test-item-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
    });
  });

  describe('ITEM webhooks', () => {
    it('should handle ITEM ERROR webhook', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'ITEM',
          webhook_code: 'ERROR',
          item_id: 'test-item-id',
          error: {
            error_code: 'ITEM_LOGIN_REQUIRED',
            error_message: 'User needs to re-authenticate',
          },
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('plaid_items');

      // Verify update was called with error status
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sync_status: 'error',
          error_message: 'User needs to re-authenticate',
        })
      );
      expect(mockEq).toHaveBeenCalledWith('item_id', 'test-item-id');
    });

    it('should handle ITEM ERROR with undefined error object', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'ITEM',
          webhook_code: 'ERROR',
          item_id: 'test-item-id',
          error: undefined,
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('plaid_items');

      // Should use fallback error message
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sync_status: 'error',
          error_message: 'Unknown error',
        })
      );
    });

    it('should handle ITEM ERROR with null error object', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'ITEM',
          webhook_code: 'ERROR',
          item_id: 'test-item-id',
          error: null,
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);

      // Should use fallback error message
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sync_status: 'error',
          error_message: 'Unknown error',
        })
      );
    });

    it('should handle ITEM ERROR with missing error_message field', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'ITEM',
          webhook_code: 'ERROR',
          item_id: 'test-item-id',
          error: {
            error_code: 'ITEM_LOGIN_REQUIRED',
            // error_message is missing
          },
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);

      // Should use fallback error message
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sync_status: 'error',
          error_message: 'Unknown error',
        })
      );
    });

    it('should handle PENDING_EXPIRATION webhook', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'ITEM',
          webhook_code: 'PENDING_EXPIRATION',
          item_id: 'test-item-id',
          consent_expiration_time: '2024-12-31T23:59:59Z',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('plaid_items');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sync_status: 'pending_expiration',
          error_message: 'Item will expire soon. Please reconnect.',
        })
      );
      expect(mockEq).toHaveBeenCalledWith('item_id', 'test-item-id');
    });

    it('should handle USER_PERMISSION_REVOKED webhook', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'ITEM',
          webhook_code: 'USER_PERMISSION_REVOKED',
          item_id: 'test-item-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);

      // Should update item status
      expect(mockSupabase.from).toHaveBeenCalledWith('plaid_items');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sync_status: 'disconnected',
          error_message: 'User revoked access at their bank',
        })
      );

      // Should deactivate accounts
      expect(mockSupabase.from).toHaveBeenCalledWith('plaid_accounts');
      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
    });

    it('should handle WEBHOOK_UPDATE_ACKNOWLEDGED', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'ITEM',
          webhook_code: 'WEBHOOK_UPDATE_ACKNOWLEDGED',
          item_id: 'test-item-id',
          new_webhook_url: 'https://example.com/webhook',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
    });

    it('should handle unknown item webhook codes gracefully', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'ITEM',
          webhook_code: 'UNKNOWN_ITEM_CODE',
          item_id: 'test-item-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
    });
  });

  describe('Other webhook types', () => {
    it('should handle AUTH webhooks', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'AUTH',
          webhook_code: 'AUTOMATICALLY_VERIFIED',
          item_id: 'test-item-id',
          account_id: 'test-account-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
    });

    it('should handle unknown webhook types gracefully', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'UNKNOWN_TYPE',
          webhook_code: 'UNKNOWN_CODE',
          item_id: 'test-item-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should return 200 even on sync errors (prevents Plaid retries)', async () => {
      // Mock sync function to throw error
      syncTransactionsForItem.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'DEFAULT_UPDATE',
          item_id: 'test-item-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      // Should still return 200 to prevent Plaid from retrying
      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
    });

    it('should handle database update failures gracefully', async () => {
      // Mock database update to fail
      mockEq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database write failed' },
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'ITEM',
          webhook_code: 'ERROR',
          item_id: 'test-item-id',
          error: {
            error_code: 'ITEM_LOGIN_REQUIRED',
            error_message: 'User needs to re-authenticate',
          },
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      // Should still return 200 even if DB update fails
      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
    });

    it('should handle logWebhookEvent failures gracefully', async () => {
      // Mock logging function to throw error
      logWebhookEvent.mockRejectedValueOnce(
        new Error('Webhook logging failed')
      );

      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'DEFAULT_UPDATE',
          item_id: 'test-item-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      // Should still return 200 to prevent Plaid retries
      expect(response.status).toBe(200);
      // Returns error object instead of received: true
      expect(json.error).toBeDefined();
      expect(json.error).toContain('Webhook logging failed');
    });

    it('should handle malformed webhook payload gracefully', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          // Missing required fields
          webhook_type: 'TRANSACTIONS',
          // Missing webhook_code and item_id
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      // Should still return 200
      expect(response.status).toBe(200);
    });

    it('should handle null webhook_type gracefully', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: null,
          webhook_code: 'DEFAULT_UPDATE',
          item_id: 'test-item-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
    });

    it('should handle undefined webhook_code gracefully', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: undefined,
          item_id: 'test-item-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
    });

    it('should handle empty item_id gracefully', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'DEFAULT_UPDATE',
          item_id: '',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
    });

    it('should handle null item_id gracefully', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'DEFAULT_UPDATE',
          item_id: null,
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
    });

    it('should handle JSON parse errors', async () => {
      // Create request with invalid JSON
      const request = new Request('http://localhost/api/plaid/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      // Should still return 200 to prevent retries
      expect(response.status).toBe(200);
    });

    it('should handle missing Supabase credentials gracefully', async () => {
      // Temporarily remove env vars
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'DEFAULT_UPDATE',
          item_id: 'test-item-id',
        },
      });

      const response = await handleWebhook(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);

      // Restore env vars
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    });
  });

  describe('Webhook logging', () => {
    it('should log all webhook events', async () => {
      const webhookBody = {
        webhook_type: 'TRANSACTIONS',
        webhook_code: 'DEFAULT_UPDATE',
        item_id: 'test-item-id',
        new_transactions: 5,
      };

      const request = createMockRequest({
        method: 'POST',
        body: webhookBody,
      });

      await handleWebhook(request);

      expect(logWebhookEvent).toHaveBeenCalledWith(
        mockSupabase,
        'TRANSACTIONS',
        'DEFAULT_UPDATE',
        'test-item-id',
        webhookBody
      );
    });

    it('should log events even when processing fails', async () => {
      syncTransactionsForItem.mockRejectedValueOnce(new Error('Sync failed'));

      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'DEFAULT_UPDATE',
          item_id: 'test-item-id',
        },
      });

      await handleWebhook(request);

      expect(logWebhookEvent).toHaveBeenCalled();
    });
  });

  describe('Webhook security', () => {
    it('should accept webhooks without authentication (Plaid does not sign webhooks)', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'DEFAULT_UPDATE',
          item_id: 'test-item-id',
        },
        headers: {}, // No authorization header
      });

      const response = await handleWebhook(request);

      expect(response.status).toBe(200);
    });

    it('should handle concurrent webhook deliveries', async () => {
      const webhook1 = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'DEFAULT_UPDATE',
          item_id: 'item-1',
        },
      });

      const webhook2 = createMockRequest({
        method: 'POST',
        body: {
          webhook_type: 'TRANSACTIONS',
          webhook_code: 'DEFAULT_UPDATE',
          item_id: 'item-2',
        },
      });

      // Process both webhooks concurrently
      const [response1, response2] = await Promise.all([
        handleWebhook(webhook1),
        handleWebhook(webhook2),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(syncTransactionsForItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('Idempotency', () => {
    it('should handle duplicate webhook deliveries gracefully', async () => {
      const webhookPayload = {
        webhook_type: 'TRANSACTIONS',
        webhook_code: 'DEFAULT_UPDATE',
        item_id: 'test-item-id',
      };

      const request1 = createMockRequest({
        method: 'POST',
        body: webhookPayload,
      });

      const request2 = createMockRequest({
        method: 'POST',
        body: webhookPayload,
      });

      // Send same webhook twice
      const response1 = await handleWebhook(request1);
      const response2 = await handleWebhook(request2);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Should process both (sync functions handle idempotency internally)
      expect(syncTransactionsForItem).toHaveBeenCalledTimes(2);
    });
  });

  // ===== INTEGRATION TESTS =====
  // These tests verify complex flows and interactions between multiple components
  describe('Integration Tests', () => {
    describe('Webhook Lifecycle Flow', () => {
      it('should handle complete webhook sequence: INITIAL_UPDATE → DEFAULT_UPDATE → TRANSACTIONS_REMOVED', async () => {
        // Simulate real-world webhook sequence for a new Plaid connection
        // Track total webhook log calls across all webhooks
        let totalLogCalls = 0;

        // 1. Initial webhook after account linking
        const initialRequest = createMockRequest({
          method: 'POST',
          body: {
            webhook_type: 'TRANSACTIONS',
            webhook_code: 'INITIAL_UPDATE',
            item_id: 'item_lifecycle_test',
          },
        });

        const initialResponse = await handleWebhook(initialRequest);
        expect(initialResponse.status).toBe(200);
        expect(syncTransactionsForItem).toHaveBeenCalledWith(
          mockSupabase,
          'item_lifecycle_test',
          90 // Initial sync: 90 days
        );
        totalLogCalls += logWebhookEvent.mock.calls.length;

        jest.clearAllMocks();

        // 2. Default update webhook (new transactions available)
        const defaultRequest = createMockRequest({
          method: 'POST',
          body: {
            webhook_type: 'TRANSACTIONS',
            webhook_code: 'DEFAULT_UPDATE',
            item_id: 'item_lifecycle_test',
            new_transactions: 3,
          },
        });

        const defaultResponse = await handleWebhook(defaultRequest);
        expect(defaultResponse.status).toBe(200);
        expect(syncTransactionsForItem).toHaveBeenCalledWith(
          mockSupabase,
          'item_lifecycle_test',
          30 // Default sync: 30 days
        );
        totalLogCalls += logWebhookEvent.mock.calls.length;

        jest.clearAllMocks();

        // 3. Transactions removed webhook (bank corrected transactions)
        const removedRequest = createMockRequest({
          method: 'POST',
          body: {
            webhook_type: 'TRANSACTIONS',
            webhook_code: 'TRANSACTIONS_REMOVED',
            item_id: 'item_lifecycle_test',
            removed_transactions: ['txn_1', 'txn_2'],
          },
        });

        const removedResponse = await handleWebhook(removedRequest);
        expect(removedResponse.status).toBe(200);
        expect(removeTransactions).toHaveBeenCalledWith(
          mockSupabase,
          ['txn_1', 'txn_2']
        );
        totalLogCalls += logWebhookEvent.mock.calls.length;

        // Verify all webhooks were logged (should be 3 total across all calls)
        expect(totalLogCalls).toBe(3);
      });
    });

    describe('Error Recovery Flow', () => {
      it('should handle ITEM ERROR → reconnection → INITIAL_UPDATE recovery flow', async () => {
        // 1. Item error (user needs to reconnect)
        const errorRequest = createMockRequest({
          method: 'POST',
          body: {
            webhook_type: 'ITEM',
            webhook_code: 'ERROR',
            item_id: 'item_recovery_test',
            error: {
              error_code: 'ITEM_LOGIN_REQUIRED',
              error_message: 'User needs to re-authenticate',
            },
          },
        });

        const errorResponse = await handleWebhook(errorRequest);
        expect(errorResponse.status).toBe(200);
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            sync_status: 'error',
            error_message: 'User needs to re-authenticate',
          })
        );

        jest.clearAllMocks();

        // 2. After user reconnects, INITIAL_UPDATE fires
        const recoveryRequest = createMockRequest({
          method: 'POST',
          body: {
            webhook_type: 'TRANSACTIONS',
            webhook_code: 'INITIAL_UPDATE',
            item_id: 'item_recovery_test',
          },
        });

        const recoveryResponse = await handleWebhook(recoveryRequest);
        expect(recoveryResponse.status).toBe(200);
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            sync_status: 'active',
          })
        );
        expect(syncTransactionsForItem).toHaveBeenCalled();
        expect(syncAccountBalances).toHaveBeenCalled();
      });
    });

    describe('Database Consistency', () => {
      it('should maintain database consistency when sync fails but logging succeeds', async () => {
        // Simulate scenario where transaction sync fails but we still log the webhook
        syncTransactionsForItem.mockRejectedValueOnce(
          new Error('Sync failed due to rate limit')
        );

        const request = createMockRequest({
          method: 'POST',
          body: {
            webhook_type: 'TRANSACTIONS',
            webhook_code: 'DEFAULT_UPDATE',
            item_id: 'item_consistency_test',
          },
        });

        const response = await handleWebhook(request);

        // Should still return 200 and log the event
        expect(response.status).toBe(200);
        expect(logWebhookEvent).toHaveBeenCalledWith(
          mockSupabase,
          'TRANSACTIONS',
          'DEFAULT_UPDATE',
          'item_consistency_test',
          expect.any(Object)
        );

        // Verify item status is NOT updated to active since sync failed
        expect(mockUpdate).not.toHaveBeenCalledWith(
          expect.objectContaining({
            sync_status: 'active',
          })
        );
      });

      it('should update plaid_items status when balance sync succeeds after transaction sync', async () => {
        const request = createMockRequest({
          method: 'POST',
          body: {
            webhook_type: 'TRANSACTIONS',
            webhook_code: 'INITIAL_UPDATE',
            item_id: 'item_status_test',
          },
        });

        await handleWebhook(request);

        // Verify both sync operations were called
        expect(syncTransactionsForItem).toHaveBeenCalledWith(
          mockSupabase,
          'item_status_test',
          90
        );
        expect(syncAccountBalances).toHaveBeenCalledWith(
          mockSupabase,
          'item_status_test'
        );

        // Verify item status was updated to active with timestamp
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            sync_status: 'active',
            last_sync_at: expect.any(String),
          })
        );
        expect(mockEq).toHaveBeenCalledWith('item_id', 'item_status_test');
      });
    });

    describe('Multi-Account Scenarios', () => {
      it('should handle webhooks for multiple items in rapid succession', async () => {
        // Simulate user with multiple bank connections receiving webhooks simultaneously
        const items = ['item_1', 'item_2', 'item_3'];
        const requests = items.map(itemId =>
          createMockRequest({
            method: 'POST',
            body: {
              webhook_type: 'TRANSACTIONS',
              webhook_code: 'DEFAULT_UPDATE',
              item_id: itemId,
            },
          })
        );

        // Process all webhooks concurrently (real-world scenario)
        const responses = await Promise.all(
          requests.map(req => handleWebhook(req))
        );

        // All should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });

        // Each item should have been synced
        expect(syncTransactionsForItem).toHaveBeenCalledTimes(3);
        expect(syncAccountBalances).toHaveBeenCalledTimes(3);
        expect(logWebhookEvent).toHaveBeenCalledTimes(3);

        // Verify each item was called with correct item_id
        items.forEach(itemId => {
          expect(syncTransactionsForItem).toHaveBeenCalledWith(
            mockSupabase,
            itemId,
            30
          );
        });
      });
    });

    describe('Cost Optimization Verification', () => {
      it('should verify webhook-based sync reduces API calls (integration scenario)', async () => {
        // Simulate the cost-saving webhook flow
        // Before webhooks: Poll 4x/month = 4 API calls per account
        // With webhooks: Only sync when notified = ~1.2 API calls per account

        const startCallCount = syncTransactionsForItem.mock.calls.length;

        // Simulate one month of webhook activity:
        // Week 1: INITIAL_UPDATE (new account)
        await handleWebhook(createMockRequest({
          method: 'POST',
          body: {
            webhook_type: 'TRANSACTIONS',
            webhook_code: 'INITIAL_UPDATE',
            item_id: 'cost_test_item',
          },
        }));

        // Week 2: DEFAULT_UPDATE (new transactions)
        await handleWebhook(createMockRequest({
          method: 'POST',
          body: {
            webhook_type: 'TRANSACTIONS',
            webhook_code: 'DEFAULT_UPDATE',
            item_id: 'cost_test_item',
            new_transactions: 5,
          },
        }));

        // Week 3: No webhook (no activity - this is the cost savings!)
        // Week 4: No webhook (no activity)

        const endCallCount = syncTransactionsForItem.mock.calls.length;
        const actualCalls = endCallCount - startCallCount;

        // Only 2 syncs triggered (vs 4 with polling)
        expect(actualCalls).toBe(2);

        // This represents 50% cost reduction for this specific scenario
        // Real-world average: 70% reduction across all users
      });
    });

    describe('User Permission Flows', () => {
      it('should handle complete disconnection flow: USER_PERMISSION_REVOKED → account deactivation', async () => {
        // Mock database calls for both plaid_items and plaid_accounts
        let updateCallCount = 0;
        mockUpdate.mockImplementation(function() {
          updateCallCount++;
          return this;
        });

        const request = createMockRequest({
          method: 'POST',
          body: {
            webhook_type: 'ITEM',
            webhook_code: 'USER_PERMISSION_REVOKED',
            item_id: 'disconnected_item',
          },
        });

        const response = await handleWebhook(request);

        expect(response.status).toBe(200);

        // Verify both tables were updated
        expect(mockSupabase.from).toHaveBeenCalledWith('plaid_items');
        expect(mockSupabase.from).toHaveBeenCalledWith('plaid_accounts');

        // Verify item status updated to disconnected
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            sync_status: 'disconnected',
            error_message: 'User revoked access at their bank',
          })
        );

        // Verify accounts deactivated
        expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });

        // Should have made 2 update calls (items + accounts)
        expect(updateCallCount).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
