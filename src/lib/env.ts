/**
 * Environment Configuration Utilities
 *
 * Centralized environment detection and URL configuration for dev/production.
 */

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get the base URL for the application
 *
 * Priority:
 * 1. NEXT_PUBLIC_ENV_URL environment variable (explicitly set)
 * 2. Request origin (from headers in API routes/server components)
 * 3. Fallback based on NODE_ENV:
 *    - Development: http://localhost:3000
 *    - Production: https://guapital.com
 *
 * @param requestOrigin - Optional origin from request (e.g., from `new URL(request.url).origin`)
 * @returns The base URL without trailing slash
 */
export function getBaseUrl(requestOrigin?: string): string {
  // 1. Check explicit environment variable
  if (process.env.NEXT_PUBLIC_ENV_URL) {
    return process.env.NEXT_PUBLIC_ENV_URL.replace(/\/$/, ''); // Remove trailing slash
  }

  // 2. Use request origin if provided (works in API routes)
  if (requestOrigin) {
    return requestOrigin.replace(/\/$/, '');
  }

  // 3. Fallback based on environment
  if (isDevelopment()) {
    return 'http://localhost:3000';
  }

  // Production fallback
  return 'https://guapital.com';
}

/**
 * Get site URL for client-side usage
 *
 * This works in both browser and server contexts.
 * Uses window.location.origin if available, otherwise falls back to env detection.
 */
export function getClientBaseUrl(): string {
  // Browser context
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server context - use environment variable or default
  return getBaseUrl();
}

/**
 * Build a full URL from a path
 *
 * @param path - Path to append to base URL (e.g., '/dashboard', '/api/auth/callback')
 * @param requestOrigin - Optional origin from request
 * @returns Full URL
 *
 * @example
 * buildUrl('/dashboard') // => 'http://localhost:3000/dashboard' (dev)
 * buildUrl('/dashboard') // => 'https://guapital.com/dashboard' (prod)
 */
export function buildUrl(path: string, requestOrigin?: string): string {
  const baseUrl = getBaseUrl(requestOrigin);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Get environment-specific configuration
 */
export const ENV = {
  isDev: isDevelopment(),
  isProd: isProduction(),
  baseUrl: getBaseUrl(),

  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',

  // Plaid
  plaidEnv: process.env.PLAID_ENV || 'sandbox',

  // Alchemy
  alchemyApiKey: process.env.ALCHEMY_API_KEY || '',

  // Stripe
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
} as const;
