/**
 * Rate Limiting Utility (Supabase-based)
 *
 * Prevents API abuse by limiting requests per identifier (IP or user ID)
 * Uses Supabase database for tracking (no external dependencies)
 *
 * Categories:
 * - auth: Strict rate limit for login/signup (5 req / 15 min)
 * - api: Moderate limit for general APIs (100 req / 1 min)
 * - expensive: Very strict for Plaid/crypto sync (10 req / 1 hour)
 */

import { createClient } from '@supabase/supabase-js';

// Rate limit category type
export type RateLimitCategory = 'auth' | 'api' | 'expensive';

// Rate limit configuration
interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  windowDisplay: string; // Human-readable (e.g., "15 minutes")
}

// Rate limit configurations
export const RATE_LIMIT_CONFIGS: Record<RateLimitCategory, RateLimitConfig> = {
  auth: {
    maxRequests: 5,
    windowSeconds: 900, // 15 minutes
    windowDisplay: '15 minutes',
  },
  api: {
    maxRequests: 300,
    windowSeconds: 60, // 1 minute
    windowDisplay: '1 minute',
  },
  expensive: {
    maxRequests: 10,
    windowSeconds: 3600, // 1 hour
    windowDisplay: '1 hour',
  },
};

// Rate limit result
export interface RateLimitResult {
  success: boolean;        // Is the request allowed?
  limit: number;           // Max requests allowed
  remaining: number;       // Requests remaining in window
  reset: number;           // Timestamp when limit resets (Unix ms)
  resetSeconds: number;    // Seconds until reset
}

/**
 * Check rate limit for an identifier and category
 *
 * @param identifier - IP address or authenticated user ID
 * @param category - Rate limit category (auth, api, expensive)
 * @returns Rate limit result with success/limit/remaining/reset info
 */
export async function checkRateLimit(
  identifier: string,
  category: RateLimitCategory
): Promise<RateLimitResult> {
  try {
    const config = RATE_LIMIT_CONFIGS[category];

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role for rate limiting
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Call database function to check and increment rate limit
    const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
      p_identifier: identifier,
      p_category: category,
      p_window_seconds: config.windowSeconds,
      p_max_requests: config.maxRequests,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open (allow request) if database is down
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: Date.now() + config.windowSeconds * 1000,
        resetSeconds: config.windowSeconds,
      };
    }

    // Parse result from database function
    const result = data as {
      allowed: boolean;
      current_count: number;
      window_start: string;
      reset_at: string;
    };

    const resetAt = new Date(result.reset_at).getTime();
    const now = Date.now();
    const resetSeconds = Math.ceil((resetAt - now) / 1000);

    return {
      success: result.allowed,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - result.current_count),
      reset: resetAt,
      resetSeconds: Math.max(0, resetSeconds),
    };
  } catch (error) {
    console.error('Rate limit exception:', error);
    // Fail open (allow request) on unexpected errors
    const config = RATE_LIMIT_CONFIGS[category];
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Date.now() + config.windowSeconds * 1000,
      resetSeconds: config.windowSeconds,
    };
  }
}

/**
 * Determine rate limit category based on request path
 *
 * @param pathname - Request pathname
 * @returns Rate limit category
 */
export function getRateLimitCategory(pathname: string): RateLimitCategory {
  // Auth endpoints (strict)
  if (
    pathname.includes('/api/auth/') ||
    pathname.includes('/login') ||
    pathname.includes('/signup')
  ) {
    return 'auth';
  }

  // Expensive operations (very strict)
  if (
    pathname.includes('/api/plaid/sync') ||
    pathname.includes('/api/crypto/sync')
  ) {
    return 'expensive';
  }

  // Default: general API
  return 'api';
}

/**
 * Get identifier for rate limiting
 * Prefers authenticated user ID, falls back to IP address
 *
 * @param request - Next.js request object
 * @param userId - Authenticated user ID (if available)
 * @returns Identifier string for rate limiting
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer authenticated user ID
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address
  const headers = new Headers(request.headers);
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown';

  return `ip:${ip}`;
}
