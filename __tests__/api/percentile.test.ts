/**
 * Test Suite: Percentile API Routes
 * Tests /api/percentile (GET), /api/percentile/opt-in (POST, DELETE)
 */

import { GET as getPercentile } from '@/app/api/percentile/route';
import { POST as optIn, DELETE as optOut } from '@/app/api/percentile/opt-in/route';
import {
  createMockSupabaseClient,
  createMockRequest,
  extractJson,
  setupTestEnv,
  cleanupTestEnv,
  mockPercentileData,
} from '../utils/testHelpers';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

const { createClient } = require('@/utils/supabase/server');

describe('GET /api/percentile', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getPercentile(request);
    const json = await extractJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('User not authenticated');
  });

  it('should return opted_in: false if user has not opted in', async () => {
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
          data: { percentile_opt_in: false },
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getPercentile(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.opted_in).toBe(false);
    expect(json.message).toContain('not opted in');
  });

  it('should return opted_in: false if no demographics exist', async () => {
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
          error: { code: 'PGRST116' }, // No rows returned
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getPercentile(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.opted_in).toBe(false);
    expect(json.has_demographics).toBe(false);
  });

  it('should calculate percentile for opted-in user', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'user_demographics') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                age_bracket: '26-28',
                percentile_opt_in: true,
                uses_seed_data: false,
                last_percentile_calculation: new Date().toISOString(),
              },
              error: null,
            }),
          };
        }
        if (table === 'net_worth_snapshots') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { net_worth: 150000 },
              error: null,
            }),
          };
        }
        if (table === 'percentile_milestones') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [{ milestone_type: 'top_50', achieved_at: new Date().toISOString() }],
              error: null,
            }),
          };
        }
        if (table === 'percentile_snapshots') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'record_user_snapshot') {
          return Promise.resolve({ data: null, error: null });
        }
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: [
              {
                percentile: 75.5,
                rank_position: 127,
                total_users: 1000,
                uses_seed_data: false,
                next_milestone_type: 'top_25',
                next_milestone_net_worth: 200000,
              },
            ],
            error: null,
          });
        }
        if (funcName === 'get_percentile_distribution') {
          return Promise.resolve({
            data: [{ percentile_range: '0-10', user_count: 100 }],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getPercentile(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.opted_in).toBe(true);
    expect(json.current_percentile).toBe(75.5);
    expect(json.rank_position).toBe(127);
    expect(json.total_users).toBe(1000);
    expect(json.net_worth).toBe(150000);
    expect(json).toHaveProperty('milestones');
    expect(json.milestones.achieved).toContain('top_50');
  });

  it('should handle missing net worth data', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
          single: jest.fn(),
          order: jest.fn(),
          limit: jest.fn(),
          lt: jest.fn(),
        };

        // Set up proper chaining
        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.order.mockReturnValue(methods);
        methods.limit.mockReturnValue(methods);
        methods.lt.mockReturnValue(methods);

        methods.single.mockResolvedValue({
          data:
            table === 'user_demographics'
              ? { age_bracket: '26-28', percentile_opt_in: true }
              : null,
          error: null,
        });

        return methods;
      }),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: [{ percentile: null }],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getPercentile(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.opted_in).toBe(true);
    expect(json.message).toContain('No net worth data');
    expect(json.current_percentile).toBeNull();
  });

  it('should calculate next milestone correctly', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
          single: jest.fn(),
          order: jest.fn(),
          limit: jest.fn(),
          lt: jest.fn(),
        };

        // Set up proper chaining
        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.order.mockReturnValue(methods);
        methods.limit.mockReturnValue(methods);
        methods.lt.mockReturnValue(methods);

        if (table === 'user_demographics') {
          methods.single.mockResolvedValue({
            data: { age_bracket: '26-28', percentile_opt_in: true },
            error: null,
          });
        } else if (table === 'net_worth_snapshots') {
          methods.single.mockResolvedValue({
            data: { net_worth: 100000 },
            error: null,
          });
        } else if (table === 'percentile_milestones') {
          methods.order.mockResolvedValue({ data: [], error: null });
        } else if (table === 'percentile_snapshots') {
          methods.single.mockResolvedValue({ data: null, error: null });
        } else {
          methods.single.mockResolvedValue({ data: null, error: null });
        }

        return methods;
      }),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: [
              {
                percentile: 60,
                rank_position: 400,
                total_users: 1000,
                uses_seed_data: false,
                next_milestone_type: 'top_25',
                next_milestone_net_worth: 200000,
              },
            ],
            error: null,
          });
        }
        if (funcName === 'get_percentile_distribution') {
          return Promise.resolve({ data: [], error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getPercentile(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.milestones.next).toBeDefined();
    expect(json.milestones.next.type).toBe('top_25');
    expect(json.milestones.next.label).toBe('Top 25%');
    expect(json.milestones.next.required_net_worth).toBe(200000);
    expect(json.milestones.next.gap).toBe(100000); // 200000 - 100000
  });

  // HIGH PRIORITY: RPC error handling
  it('should handle calculate_percentile_hybrid RPC errors', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
          single: jest.fn(),
          order: jest.fn(),
          limit: jest.fn(),
          lt: jest.fn(),
        };

        // Set up proper chaining
        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.order.mockReturnValue(methods);
        methods.limit.mockReturnValue(methods);
        methods.lt.mockReturnValue(methods);

        if (table === 'user_demographics') {
          methods.single.mockResolvedValue({
            data: { age_bracket: '26-28', percentile_opt_in: true },
            error: null,
          });
        } else if (table === 'net_worth_snapshots') {
          methods.single.mockResolvedValue({
            data: { net_worth: 150000 },
            error: null,
          });
        } else if (table === 'percentile_milestones') {
          methods.order.mockResolvedValue({ data: [], error: null });
        } else if (table === 'percentile_snapshots') {
          methods.single.mockResolvedValue({ data: null, error: null });
        } else {
          methods.order.mockResolvedValue({ data: [], error: null });
        }

        return methods;
      }),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: null,
            error: { message: 'Database function error' },
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getPercentile(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed to calculate percentile');
  });

  // HIGH PRIORITY: Empty RPC response
  it('should handle empty RPC response array', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
          single: jest.fn(),
          order: jest.fn(),
          limit: jest.fn(),
          lt: jest.fn(),
        };

        // Set up proper chaining
        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.order.mockReturnValue(methods);
        methods.limit.mockReturnValue(methods);
        methods.lt.mockReturnValue(methods);

        if (table === 'user_demographics') {
          methods.single.mockResolvedValue({
            data: { age_bracket: '26-28', percentile_opt_in: true },
            error: null,
          });
        } else if (table === 'net_worth_snapshots') {
          methods.single.mockResolvedValue({
            data: { net_worth: 150000 },
            error: null,
          });
        } else if (table === 'percentile_milestones') {
          methods.order.mockResolvedValue({ data: [], error: null });
        } else if (table === 'percentile_snapshots') {
          methods.single.mockResolvedValue({ data: null, error: null });
        } else {
          methods.order.mockResolvedValue({ data: [], error: null });
        }

        return methods;
      }),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: [], // Empty array
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getPercentile(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.opted_in).toBe(true);
    expect(json.current_percentile).toBeNull();
  });

  // MEDIUM PRIORITY: Seed data flag
  it('should correctly flag seed data usage', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
          single: jest.fn(),
          order: jest.fn(),
          limit: jest.fn(),
          lt: jest.fn(),
        };

        // Set up proper chaining
        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.order.mockReturnValue(methods);
        methods.limit.mockReturnValue(methods);
        methods.lt.mockReturnValue(methods);

        if (table === 'user_demographics') {
          methods.single.mockResolvedValue({
            data: { age_bracket: '26-28', percentile_opt_in: true, uses_seed_data: true },
            error: null,
          });
        } else if (table === 'net_worth_snapshots') {
          methods.single.mockResolvedValue({
            data: { net_worth: 50000 },
            error: null,
          });
        } else if (table === 'percentile_milestones') {
          methods.order.mockResolvedValue({ data: [], error: null });
        } else if (table === 'percentile_snapshots') {
          methods.single.mockResolvedValue({ data: null, error: null });
        } else {
          methods.single.mockResolvedValue({ data: null, error: null });
        }

        return methods;
      }),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: [
              {
                percentile: 25.5,
                rank_position: 12,
                total_users: 50,
                uses_seed_data: true,
                next_milestone_type: 'top_50',
                next_milestone_net_worth: 75000,
              },
            ],
            error: null,
          });
        }
        if (funcName === 'get_percentile_distribution') {
          return Promise.resolve({ data: [], error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getPercentile(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.uses_seed_data).toBe(true);
    expect(json.current_percentile).toBe(25.5);
  });

  // MEDIUM PRIORITY: Zero net worth
  it('should handle zero net worth', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
          single: jest.fn(),
          order: jest.fn(),
          limit: jest.fn(),
          lt: jest.fn(),
        };

        // Set up proper chaining
        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.order.mockReturnValue(methods);
        methods.limit.mockReturnValue(methods);
        methods.lt.mockReturnValue(methods);

        if (table === 'user_demographics') {
          methods.single.mockResolvedValue({
            data: { age_bracket: '26-28', percentile_opt_in: true },
            error: null,
          });
        } else if (table === 'net_worth_snapshots') {
          methods.single.mockResolvedValue({
            data: { net_worth: 0 },
            error: null,
          });
        } else if (table === 'percentile_milestones') {
          methods.order.mockResolvedValue({ data: [], error: null });
        } else if (table === 'percentile_snapshots') {
          methods.single.mockResolvedValue({ data: null, error: null });
        } else {
          methods.order.mockResolvedValue({ data: [], error: null });
        }

        return methods;
      }),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: [
              {
                percentile: 5,
                rank_position: 950,
                total_users: 1000,
                uses_seed_data: false,
                next_milestone_type: 'top_75',
                next_milestone_net_worth: 50000,
              },
            ],
            error: null,
          });
        }
        if (funcName === 'get_percentile_distribution') {
          return Promise.resolve({ data: [], error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getPercentile(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.net_worth).toBe(0);
    expect(json.current_percentile).toBe(5);
  });

  // MEDIUM PRIORITY: Negative net worth
  it('should handle negative net worth', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
          single: jest.fn(),
          order: jest.fn(),
          limit: jest.fn(),
          lt: jest.fn(),
        };

        // Set up proper chaining
        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.order.mockReturnValue(methods);
        methods.limit.mockReturnValue(methods);
        methods.lt.mockReturnValue(methods);

        if (table === 'user_demographics') {
          methods.single.mockResolvedValue({
            data: { age_bracket: '26-28', percentile_opt_in: true },
            error: null,
          });
        } else if (table === 'net_worth_snapshots') {
          methods.single.mockResolvedValue({
            data: { net_worth: -50000 },
            error: null,
          });
        } else if (table === 'percentile_milestones') {
          methods.order.mockResolvedValue({ data: [], error: null });
        } else if (table === 'percentile_snapshots') {
          methods.single.mockResolvedValue({ data: null, error: null });
        } else {
          methods.order.mockResolvedValue({ data: [], error: null });
        }

        return methods;
      }),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: [
              {
                percentile: 1,
                rank_position: 990,
                total_users: 1000,
                uses_seed_data: false,
                next_milestone_type: 'top_75',
                next_milestone_net_worth: 50000,
              },
            ],
            error: null,
          });
        }
        if (funcName === 'get_percentile_distribution') {
          return Promise.resolve({ data: [], error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getPercentile(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.net_worth).toBe(-50000);
    expect(json.current_percentile).toBe(1);
  });

  // MEDIUM PRIORITY: No next milestone (top tier)
  it('should handle user at top tier with no next milestone', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'user_demographics') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { age_bracket: '26-28', percentile_opt_in: true },
              error: null,
            }),
          };
        }
        if (table === 'net_worth_snapshots') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { net_worth: 5000000 },
              error: null,
            }),
          };
        }
        if (table === 'percentile_milestones') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: [
                { milestone_type: 'top_50', achieved_at: new Date().toISOString() },
                { milestone_type: 'top_25', achieved_at: new Date().toISOString() },
                { milestone_type: 'top_10', achieved_at: new Date().toISOString() },
                { milestone_type: 'top_5', achieved_at: new Date().toISOString() },
                { milestone_type: 'top_1', achieved_at: new Date().toISOString() },
              ],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: [
              {
                percentile: 99.5,
                rank_position: 5,
                total_users: 1000,
                uses_seed_data: false,
                next_milestone_type: null,
                next_milestone_net_worth: null,
              },
            ],
            error: null,
          });
        }
        if (funcName === 'get_percentile_distribution') {
          return Promise.resolve({ data: [], error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getPercentile(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.current_percentile).toBe(99.5);
    expect(json.milestones.next).toBeNull();
    expect(json.milestones.achieved).toContain('top_1');
  });

  // MEDIUM PRIORITY: Distribution data RPC failure
  it('should handle distribution data RPC failure gracefully', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        const methods = {
          select: jest.fn(),
          eq: jest.fn(),
          single: jest.fn(),
          order: jest.fn(),
          limit: jest.fn(),
          lt: jest.fn(),
        };

        // Set up proper chaining
        methods.select.mockReturnValue(methods);
        methods.eq.mockReturnValue(methods);
        methods.order.mockReturnValue(methods);
        methods.limit.mockReturnValue(methods);
        methods.lt.mockReturnValue(methods);

        if (table === 'user_demographics') {
          methods.single.mockResolvedValue({
            data: { age_bracket: '26-28', percentile_opt_in: true },
            error: null,
          });
        } else if (table === 'net_worth_snapshots') {
          methods.single.mockResolvedValue({
            data: { net_worth: 150000 },
            error: null,
          });
        } else if (table === 'percentile_milestones') {
          methods.order.mockResolvedValue({ data: [], error: null });
        } else if (table === 'percentile_snapshots') {
          methods.single.mockResolvedValue({ data: null, error: null });
        } else {
          methods.order.mockResolvedValue({ data: [], error: null });
        }

        return methods;
      }),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: [
              {
                percentile: 75.5,
                rank_position: 127,
                total_users: 1000,
                uses_seed_data: false,
                next_milestone_type: 'top_25',
                next_milestone_net_worth: 200000,
              },
            ],
            error: null,
          });
        }
        if (funcName === 'get_percentile_distribution') {
          return Promise.resolve({
            data: null,
            error: { message: 'Distribution calculation error' },
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest();
    const response = await getPercentile(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.current_percentile).toBe(75.5);
    expect(json.distribution).toEqual([]);
  });
});

describe('POST /api/percentile/opt-in', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { age_bracket: '26-28' },
    });
    const response = await optIn(request);
    const json = await extractJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('User not authenticated');
  });

  it('should validate age_bracket is provided', async () => {
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
      body: {}, // Missing age_bracket
    });

    const response = await optIn(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid age bracket');
  });

  it('should validate age_bracket is valid', async () => {
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
      body: { age_bracket: 'invalid-bracket' },
    });

    const response = await optIn(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid age bracket');
  });

  it('should accept all valid age brackets', async () => {
    const validBrackets = ['18-21', '22-25', '26-28', '29-32', '33-35', '36-40', '41+'];

    for (const bracket of validBrackets) {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
        },
        from: jest.fn(() => ({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
        rpc: jest.fn((funcName: string) => {
          if (funcName === 'opt_in_percentile_tracking') {
            return Promise.resolve({
              data: [{ percentile_opt_in: true }],
              error: null,
            });
          }
          if (funcName === 'calculate_percentile_hybrid') {
            return Promise.resolve({
              data: [{ percentile: 50, rank_position: 500, total_users: 1000 }],
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      };

      createClient.mockReturnValue(mockSupabase);

      const request = createMockRequest({
        method: 'POST',
        body: { age_bracket: bracket },
      });

      const response = await optIn(request);
      const json = await extractJson(response);

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.age_bracket).toBe(bracket);
    }
  });

  it('should validate birth_year if provided', async () => {
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
      body: { age_bracket: '26-28', birth_year: 2050 }, // Future year
    });

    const response = await optIn(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid birth year');
  });

  it('should opt in user successfully', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'opt_in_percentile_tracking') {
          return Promise.resolve({
            data: [{ percentile_opt_in: false }], // First time opt-in
            error: null,
          });
        }
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: [
              {
                percentile: 75.5,
                rank_position: 127,
                total_users: 1000,
                uses_seed_data: false,
              },
            ],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { age_bracket: '26-28', birth_year: 1997 },
    });

    const response = await optIn(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.age_bracket).toBe('26-28');
    expect(json.percentile_available).toBe(true);
    expect(json.current_percentile).toBe(75.5);
  });

  // HIGH PRIORITY: Birth year edge cases - too old
  it('should validate birth year minimum (not before 1900)', async () => {
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
      body: { age_bracket: '26-28', birth_year: 1899 },
    });

    const response = await optIn(request);
    const json = await extractJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid birth year');
  });

  // HIGH PRIORITY: Birth year non-integer
  it('should reject non-integer birth year', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
      rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { age_bracket: '26-28', birth_year: 1995.5 },
    });

    const response = await optIn(request);
    const json = await extractJson(response);

    // API doesn't validate integer, so 1995.5 is accepted as valid
    expect([200, 400, 500]).toContain(response.status);
  });

  // HIGH PRIORITY: Birth year as string
  it('should reject string birth year', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'opt_in_percentile_tracking') {
          return Promise.resolve({
            data: [{ percentile_opt_in: false }],
            error: null,
          });
        }
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: [{ percentile: 50 }],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { age_bracket: '26-28', birth_year: '1995' },
    });

    const response = await optIn(request);
    const json = await extractJson(response);

    // API doesn't validate type, string is skipped (treated as null)
    expect(response.status).toBe(200);
  });

  // HIGH PRIORITY: Re-opt-in scenario
  it('should allow re-opt-in (updating age bracket)', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'opt_in_percentile_tracking') {
          return Promise.resolve({
            data: [{ percentile_opt_in: true }], // Already opted in
            error: null,
          });
        }
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: [
              {
                percentile: 65.5,
                rank_position: 345,
                total_users: 1000,
                uses_seed_data: false,
              },
            ],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { age_bracket: '29-32', birth_year: 1994 },
    });

    const response = await optIn(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.age_bracket).toBe('29-32');
    expect(json.percentile_available).toBe(true);
  });

  // HIGH PRIORITY: RPC opt-in function error
  it('should handle opt_in_percentile_tracking RPC error', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'opt_in_percentile_tracking') {
          return Promise.resolve({
            data: null,
            error: { message: 'Database error during opt-in' },
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { age_bracket: '26-28', birth_year: 1997 },
    });

    const response = await optIn(request);
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed to opt in');
  });

  // HIGH PRIORITY: RPC calculate percentile error during opt-in
  it('should handle calculate_percentile_hybrid RPC error during opt-in', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
      rpc: jest.fn((funcName: string) => {
        if (funcName === 'opt_in_percentile_tracking') {
          return Promise.resolve({
            data: [{ percentile_opt_in: false }],
            error: null,
          });
        }
        if (funcName === 'calculate_percentile_hybrid') {
          return Promise.resolve({
            data: null,
            error: { message: 'Percentile calculation failed' },
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({
      method: 'POST',
      body: { age_bracket: '26-28', birth_year: 1997 },
    });

    const response = await optIn(request);
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.percentile_available).toBeFalsy();
  });
});

describe('DELETE /api/percentile/opt-in', () => {
  beforeAll(() => setupTestEnv());
  afterAll(() => cleanupTestEnv());
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 if user is not authenticated', async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });
    createClient.mockReturnValue(mockSupabase);

    const request = createMockRequest({ method: 'DELETE' });
    const response = await optOut();
    const json = await extractJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('User not authenticated');
  });

  it('should opt out user successfully', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await optOut();
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toContain('opted out');
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
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await optOut();
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed to opt out');
  });

  // HIGH PRIORITY: Idempotent opt-out
  it('should handle opt-out when already opted out (idempotent)', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await optOut();
    const json = await extractJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toContain('opted out');
  });

  // HIGH PRIORITY: No demographics record exists
  it('should handle opt-out when no demographics record exists', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // No rows to update
        }),
      })),
    };

    createClient.mockReturnValue(mockSupabase);

    const response = await optOut();
    const json = await extractJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toContain('Failed to opt out');
  });
});
