# Security & Compliance Implementation Guide

**Last Updated:** October 2025
**Status:** Pre-Launch Security Hardening

This document provides step-by-step instructions for implementing critical security improvements identified in the compliance audit. These changes are necessary before launching Guapital to production.

---

## Table of Contents

1. [Priority 1: Critical Pre-Launch](#priority-1-critical-pre-launch)
   - [Rate Limiting](#1-rate-limiting)
   - [Security Headers](#2-security-headers)
   - [Encrypt Plaid Access Tokens](#3-encrypt-plaid-access-tokens)
2. [Priority 2: Launch Week 1](#priority-2-launch-week-1)
   - [Audit Logging](#4-audit-logging)
   - [Input Validation with Zod](#5-input-validation-with-zod)
   - [Backup & DR Documentation](#6-backup--dr-documentation)
3. [Priority 3: First Month](#priority-3-first-month)
   - [GDPR Data Export](#7-gdpr-data-export)
   - [Security Monitoring](#8-security-monitoring)
4. [Testing & Verification](#testing--verification)

---

## Priority 1: Critical Pre-Launch

These improvements MUST be completed before launching to production.

---

### 1. Rate Limiting

**Risk:** API abuse, brute force attacks, DoS, excessive costs
**Time Estimate:** 1-2 hours
**Complexity:** Moderate

#### Implementation Options

**Option A: Upstash Redis (Recommended - Serverless)**

**Step 1: Install Dependencies**

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Step 2: Set Up Upstash Account**

1. Go to https://upstash.com/
2. Create a free account (10K requests/day free)
3. Create a Redis database
4. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

**Step 3: Add Environment Variables**

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

**Step 4: Create Rate Limit Utility**

Create `src/lib/ratelimit.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiters for different endpoint types
export const rateLimiters = {
  // Strict rate limit for auth endpoints (prevent brute force)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  // Moderate rate limit for API endpoints
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // Strict rate limit for expensive operations (Plaid sync, crypto sync)
  expensive: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
    analytics: true,
    prefix: 'ratelimit:expensive',
  }),
};

/**
 * Check rate limit and return appropriate response
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param limiter - Rate limiter to use
 * @returns { success: boolean, limit: number, remaining: number, reset: number }
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  return { success, limit, remaining, reset };
}
```

**Step 5: Add Rate Limiting Middleware**

Update `src/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { rateLimiters, checkRateLimit } from '@/lib/ratelimit';

export async function middleware(request: NextRequest) {
  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Get identifier (prefer user ID, fallback to IP)
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';

    // Determine which rate limiter to use
    let limiter = rateLimiters.api;
    let identifier = ip;

    // Stricter limits for auth endpoints
    if (
      request.nextUrl.pathname.includes('/auth/') ||
      request.nextUrl.pathname.includes('/login') ||
      request.nextUrl.pathname.includes('/signup')
    ) {
      limiter = rateLimiters.auth;
    }

    // Stricter limits for expensive operations
    if (
      request.nextUrl.pathname.includes('/plaid/sync') ||
      request.nextUrl.pathname.includes('/crypto/sync')
    ) {
      limiter = rateLimiters.expensive;
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(identifier, limiter);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
          limit: rateLimitResult.limit,
          remaining: 0,
          reset: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
  }

  // Existing auth logic
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users from login/signup/home to dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

**Step 6: Test Rate Limiting**

Create a test script `scripts/test-rate-limit.ts`:

```typescript
async function testRateLimit() {
  const endpoint = 'http://localhost:3000/api/networth';

  console.log('Testing rate limit (100 requests/minute)...\n');

  for (let i = 1; i <= 110; i++) {
    const response = await fetch(endpoint);
    console.log(`Request ${i}: ${response.status} - ${response.headers.get('X-RateLimit-Remaining')} remaining`);

    if (response.status === 429) {
      console.log('\n✅ Rate limit working! Received 429 after exceeding limit.');
      break;
    }
  }
}

testRateLimit();
```

Run test:
```bash
npx tsx scripts/test-rate-limit.ts
```

---

**Option B: Vercel Edge Config (If deploying to Vercel)**

Use Vercel's built-in rate limiting with Edge Config:

```typescript
// src/middleware.ts
import { next } from '@vercel/edge';
import { ratelimit } from '@vercel/edge';

export const config = {
  matcher: '/api/:path*',
};

const limiter = ratelimit({
  interval: '60s',
  limit: 100,
});

export default async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for');
  const { success } = await limiter.check(ip ?? 'anonymous');

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  return next();
}
```

---

### 2. Security Headers

**Risk:** XSS, clickjacking, MIME sniffing attacks
**Time Estimate:** 1 hour
**Complexity:** Easy

#### Implementation

Update `next.config.mjs`:

```javascript
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '**.tailwindcss.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Permissions Policy (already implemented)
          {
            key: 'Permissions-Policy',
            value: 'fullscreen=(self "https://cdn.plaid.com"), payment=(self "https://cdn.plaid.com"), camera=(self "https://cdn.plaid.com")',
          },

          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },

          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },

          // Force HTTPS (only in production)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },

          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },

          // XSS Protection (legacy but still useful)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },

          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' cdn.plaid.com js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://api.plaid.com https://cdn.plaid.com https://api.stripe.com https://*.alchemy.com https://api.coingecko.com",
              "frame-src 'self' https://cdn.plaid.com https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/supabase/auth/callback%7D',
        destination: '/api/supabase/auth/callback',
      },
    ];
  },
};
```

#### Testing Security Headers

1. **Manual Testing:**
```bash
curl -I https://your-app.com/dashboard
```

2. **Automated Testing:**
```bash
npm install -D @koale/security-headers-validator

# Run security header check
npx security-headers check https://your-app.com
```

3. **Online Tools:**
- https://securityheaders.com/ - Comprehensive header analysis
- https://csp-evaluator.withgoogle.com/ - CSP validation

#### Expected Results

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
```

---

### 3. Encrypt Plaid Access Tokens

**Risk:** Access tokens stored in plaintext could be compromised
**Time Estimate:** 2-3 hours
**Complexity:** Moderate-High

#### Option A: Supabase pgsodium (Recommended)

**Step 1: Enable pgsodium Extension**

Run in Supabase SQL Editor:

```sql
-- Enable encryption extension
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Create encryption key (store this securely!)
-- In production, use a proper key management system
CREATE TABLE encryption_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_name TEXT UNIQUE NOT NULL,
  key_value BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate and store master key
INSERT INTO encryption_keys (key_name, key_value)
VALUES ('plaid_token_key', pgsodium.crypto_secretbox_keygen());
```

**Step 2: Add Migration to Encrypt Existing Tokens**

Create `supabase/migrations/012_encrypt_plaid_tokens.sql`:

```sql
-- Add encrypted column
ALTER TABLE plaid_items ADD COLUMN access_token_encrypted BYTEA;

-- Function to encrypt access tokens
CREATE OR REPLACE FUNCTION encrypt_access_token()
RETURNS TRIGGER AS $$
DECLARE
  encryption_key BYTEA;
BEGIN
  -- Get encryption key
  SELECT key_value INTO encryption_key
  FROM encryption_keys
  WHERE key_name = 'plaid_token_key';

  -- Encrypt the access token
  IF NEW.access_token IS NOT NULL THEN
    NEW.access_token_encrypted := pgsodium.crypto_secretbox(
      convert_to(NEW.access_token, 'utf8'),
      encryption_key
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-encrypt on insert/update
CREATE TRIGGER encrypt_plaid_token_trigger
BEFORE INSERT OR UPDATE ON plaid_items
FOR EACH ROW
EXECUTE FUNCTION encrypt_access_token();

-- Encrypt existing tokens
UPDATE plaid_items SET access_token = access_token;

-- Function to decrypt access tokens
CREATE OR REPLACE FUNCTION get_decrypted_access_token(item_id UUID)
RETURNS TEXT AS $$
DECLARE
  encryption_key BYTEA;
  encrypted_token BYTEA;
  decrypted_token TEXT;
BEGIN
  -- Get encryption key
  SELECT key_value INTO encryption_key
  FROM encryption_keys
  WHERE key_name = 'plaid_token_key';

  -- Get encrypted token
  SELECT access_token_encrypted INTO encrypted_token
  FROM plaid_items
  WHERE id = item_id;

  -- Decrypt token
  decrypted_token := convert_from(
    pgsodium.crypto_secretbox_open(encrypted_token, encryption_key),
    'utf8'
  );

  RETURN decrypted_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- After confirming encryption works, drop plaintext column
-- (DO THIS AFTER TESTING!)
-- ALTER TABLE plaid_items DROP COLUMN access_token;
```

**Step 3: Update API Routes to Use Decryption Function**

Update `src/app/api/plaid/sync-accounts/route.ts`:

```typescript
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { item_id } = await request.json();

    // Get the plaid item from database
    const { data: plaidItem, error: itemError } = await supabase
      .from('plaid_items')
      .select('id, user_id')
      .eq('user_id', user.id)
      .eq('id', item_id)
      .single();

    if (itemError || !plaidItem) {
      return NextResponse.json({ error: 'Plaid item not found' }, { status: 404 });
    }

    // Get decrypted access token using database function
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('get_decrypted_access_token', { item_id: plaidItem.id });

    if (tokenError || !tokenData) {
      console.error('Error decrypting token:', tokenError);
      return NextResponse.json({ error: 'Failed to retrieve access token' }, { status: 500 });
    }

    const accessToken = tokenData as string;

    // Rest of the sync logic...
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // ... continue with existing logic
  } catch (error: any) {
    console.error('Error syncing accounts:', error);
    return NextResponse.json(
      { error: 'Failed to sync accounts', details: error.message },
      { status: 500 }
    );
  }
}
```

**Step 4: Update All Routes Using access_token**

Files to update:
- `src/app/api/plaid/sync-accounts/route.ts` ✓ (shown above)
- `src/app/api/plaid/sync-transactions/route.ts`
- `src/app/api/plaid/accounts/route.ts`
- `src/app/api/plaid/transactions/route.ts`

Pattern for all:
```typescript
// OLD:
const { data: plaidItem } = await supabase
  .from('plaid_items')
  .select('*')
  .eq('id', item_id)
  .single();
const accessToken = plaidItem.access_token;

// NEW:
const { data: plaidItem } = await supabase
  .from('plaid_items')
  .select('id, user_id')
  .eq('id', item_id)
  .single();

const { data: accessToken } = await supabase
  .rpc('get_decrypted_access_token', { item_id: plaidItem.id });
```

---

#### Option B: Application-Level Encryption (Simpler, Less Secure)

**Step 1: Install Encryption Library**

```bash
npm install crypto-js
```

**Step 2: Create Encryption Utility**

Create `src/lib/encryption.ts`:

```typescript
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

export function encrypt(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

**Step 3: Add Encryption Key to Environment**

```bash
# Generate a strong key:
openssl rand -hex 32

# Add to .env.local:
ENCRYPTION_KEY=your-generated-key-here
```

**Step 4: Update Routes to Encrypt/Decrypt**

```typescript
import { encrypt, decrypt } from '@/lib/encryption';

// When storing token:
const { error } = await supabase
  .from('plaid_items')
  .insert({
    user_id: user.id,
    access_token: encrypt(accessToken), // Encrypt before storing
    // ... other fields
  });

// When retrieving token:
const { data: plaidItem } = await supabase
  .from('plaid_items')
  .select('*')
  .eq('id', item_id)
  .single();

const accessToken = decrypt(plaidItem.access_token); // Decrypt after retrieving
```

---

## Priority 2: Launch Week 1

Complete within the first week after launch.

---

### 4. Audit Logging

**Risk:** No visibility into security incidents or suspicious activity
**Time Estimate:** 4-6 hours
**Complexity:** Moderate

#### Implementation

**Step 1: Create Audit Log Table**

Create `supabase/migrations/013_create_audit_logs.sql`:

```sql
-- Audit log table for security and compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Action details
    action_type TEXT NOT NULL, -- login, logout, login_failed, plaid_connected, plaid_sync, subscription_change, etc.
    resource_type TEXT, -- plaid_item, manual_asset, crypto_wallet, subscription
    resource_id UUID, -- ID of the affected resource

    -- Request details
    ip_address TEXT,
    user_agent TEXT,
    request_method TEXT, -- GET, POST, PUT, DELETE
    request_path TEXT,

    -- Results
    status TEXT NOT NULL, -- success, failure, error
    error_message TEXT,

    -- Additional context
    metadata JSONB, -- Flexible field for action-specific data

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can view their own logs, admins can view all
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

-- Optional: Admin policy (create admin role first)
-- CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT USING (
--   EXISTS (
--     SELECT 1 FROM user_settings
--     WHERE user_id = auth.uid() AND is_admin = true
--   )
-- );
```

**Step 2: Create Audit Logging Utility**

Create `src/lib/audit.ts`:

```typescript
import { createClient } from '@/utils/supabase/server';

export type AuditActionType =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'signup'
  | 'password_reset'
  | 'plaid_connected'
  | 'plaid_disconnected'
  | 'plaid_sync'
  | 'crypto_wallet_added'
  | 'crypto_wallet_removed'
  | 'crypto_sync'
  | 'manual_asset_created'
  | 'manual_asset_updated'
  | 'manual_asset_deleted'
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'percentile_opt_in'
  | 'percentile_opt_out'
  | 'data_export'
  | 'account_deleted';

export type ResourceType = 'plaid_item' | 'crypto_wallet' | 'manual_asset' | 'subscription' | 'user';

export interface AuditLogData {
  actionType: AuditActionType;
  resourceType?: ResourceType;
  resourceId?: string;
  status: 'success' | 'failure' | 'error';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an audit event
 */
export async function logAudit(
  data: AuditLogData,
  request?: Request
): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Extract request details
    let ipAddress: string | null = null;
    let userAgent: string | null = null;
    let requestMethod: string | null = null;
    let requestPath: string | null = null;

    if (request) {
      const url = new URL(request.url);
      requestPath = url.pathname;
      requestMethod = request.method;
      userAgent = request.headers.get('user-agent');
      ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    }

    // Insert audit log
    const { error } = await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      action_type: data.actionType,
      resource_type: data.resourceType || null,
      resource_id: data.resourceId || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      request_method: requestMethod,
      request_path: requestPath,
      status: data.status,
      error_message: data.errorMessage || null,
      metadata: data.metadata || null,
    });

    if (error) {
      // Log to console but don't throw - audit logging should not break application flow
      console.error('Failed to write audit log:', error);
    }
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

/**
 * Helper function to log successful actions
 */
export async function logSuccess(
  actionType: AuditActionType,
  request?: Request,
  metadata?: Record<string, any>
): Promise<void> {
  await logAudit(
    {
      actionType,
      status: 'success',
      metadata,
    },
    request
  );
}

/**
 * Helper function to log failed actions
 */
export async function logFailure(
  actionType: AuditActionType,
  errorMessage: string,
  request?: Request,
  metadata?: Record<string, any>
): Promise<void> {
  await logAudit(
    {
      actionType,
      status: 'failure',
      errorMessage,
      metadata,
    },
    request
  );
}
```

**Step 3: Add Audit Logging to Critical Routes**

**Example 1: Plaid Token Exchange**

Update `src/app/api/plaid/exchange-token/route.ts`:

```typescript
import { logSuccess, logFailure } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      await logFailure('plaid_connected', 'User not authenticated', request);
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { public_token, metadata } = await request.json();

    // Exchange token logic...
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Store in database...
    const { data: newItem, error: insertError } = await supabase
      .from('plaid_items')
      .insert({
        user_id: user.id,
        item_id: itemId,
        access_token: accessToken,
        institution_id: institutionId,
        institution_name: institutionName,
        sync_status: 'active',
        last_sync_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      await logFailure('plaid_connected', insertError.message, request, {
        institution_name: institutionName,
      });
      return NextResponse.json(
        { error: 'Failed to insert plaid item', details: insertError.message },
        { status: 500 }
      );
    }

    // Log success
    await logSuccess('plaid_connected', request, {
      plaid_item_id: newItem.id,
      institution_name: institutionName,
      accounts_count: accounts.length,
    });

    return NextResponse.json({
      success: true,
      item_id: itemId,
      institution_name: institutionName,
      accounts_count: accounts.length,
    });
  } catch (error: any) {
    await logFailure('plaid_connected', error.message, request);
    console.error('Error exchanging token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange token', details: error.message },
      { status: 500 }
    );
  }
}
```

**Example 2: Subscription Changes**

Update `src/app/api/stripe/webhook/route.ts`:

```typescript
import { logSuccess } from '@/lib/audit';

// Inside POST handler, for checkout.session.completed:
case 'checkout.session.completed': {
  const session = event.data.object as any;

  // ... existing logic to update user subscription ...

  // Log audit event
  await logSuccess('subscription_created', undefined, {
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    price_id: priceId,
    amount_paid: session.amount_total / 100,
  });

  break;
}

// For customer.subscription.deleted:
case 'customer.subscription.deleted': {
  const subscription = event.data.object as any;

  // ... existing logic ...

  await logSuccess('subscription_cancelled', undefined, {
    stripe_subscription_id: subscription.id,
    cancelled_at: new Date(subscription.canceled_at * 1000).toISOString(),
  });

  break;
}
```

**Step 4: Add Audit Log Viewer (Optional)**

Create `src/app/dashboard/security/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  action_type: string;
  status: string;
  ip_address: string;
  created_at: string;
  metadata: any;
}

export default function SecurityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      setLogs(data.logs || []);
    }
    fetchLogs();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Security Activity</h1>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.action_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      log.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.ip_address || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### 5. Input Validation with Zod

**Risk:** SQL injection, XSS, data integrity issues
**Time Estimate:** 4-6 hours
**Complexity:** Moderate

#### Implementation

**Step 1: Install Zod**

```bash
npm install zod
```

**Step 2: Create Validation Schemas**

Create `src/lib/validations/asset.ts`:

```typescript
import { z } from 'zod';

// Asset categories
export const assetCategories = [
  'real_estate',
  'vehicle',
  'private_equity',
  'collectibles',
  'cash',
  'investment',
  'private_stock',
  'bonds',
  'p2p_lending',
  'other',
] as const;

export const liabilityCategories = [
  'mortgage',
  'personal_loan',
  'business_debt',
  'credit_debt',
  'other_debt',
] as const;

// Schema for creating/updating assets
export const assetSchema = z.object({
  asset_name: z
    .string()
    .min(1, 'Asset name is required')
    .max(255, 'Asset name must be less than 255 characters')
    .trim(),

  current_value: z
    .number()
    .positive('Value must be a positive number')
    .finite('Value must be a valid number'),

  entry_type: z.enum(['asset', 'liability'], {
    errorMap: () => ({ message: 'Entry type must be either asset or liability' }),
  }),

  category: z.string().refine(
    (val) => {
      return [...assetCategories, ...liabilityCategories].includes(val as any);
    },
    { message: 'Invalid category' }
  ),

  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

// Schema with conditional category validation based on entry_type
export const assetSchemaWithValidation = assetSchema.refine(
  (data) => {
    if (data.entry_type === 'asset') {
      return assetCategories.includes(data.category as any);
    } else {
      return liabilityCategories.includes(data.category as any);
    }
  },
  {
    message: 'Category must match entry type',
    path: ['category'],
  }
);

export type AssetInput = z.infer<typeof assetSchema>;
```

Create `src/lib/validations/crypto.ts`:

```typescript
import { z } from 'zod';

// Ethereum address regex
const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

export const cryptoWalletSchema = z.object({
  wallet_address: z
    .string()
    .regex(ethereumAddressRegex, 'Invalid Ethereum address format')
    .toLowerCase(),

  wallet_name: z
    .string()
    .min(1, 'Wallet name is required')
    .max(100, 'Wallet name must be less than 100 characters')
    .trim()
    .optional(),

  blockchain: z.enum(['ethereum', 'polygon', 'base', 'arbitrum', 'optimism'], {
    errorMap: () => ({ message: 'Invalid blockchain' }),
  }),
});

export type CryptoWalletInput = z.infer<typeof cryptoWalletSchema>;
```

Create `src/lib/validations/percentile.ts`:

```typescript
import { z } from 'zod';

export const percentileOptInSchema = z.object({
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const dob = new Date(date);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return age >= 18 && age <= 120;
    }, 'You must be at least 18 years old'),
});

export type PercentileOptInInput = z.infer<typeof percentileOptInSchema>;
```

**Step 3: Create Validation Middleware**

Create `src/lib/validationMiddleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

/**
 * Validate request body against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data or error response
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Validation failed',
            details: errorMessages,
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      ),
    };
  }
}
```

**Step 4: Update API Routes to Use Validation**

**Update `src/app/api/assets/route.ts`:**

```typescript
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { assetSchemaWithValidation } from '@/lib/validations/asset';
import { validateRequest } from '@/lib/validationMiddleware';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(assetSchemaWithValidation, body);
    if (!validation.success) {
      return validation.response;
    }

    const validatedData = validation.data;

    // Insert the asset/liability with validated data
    const { data: newAsset, error: insertError } = await supabase
      .from('manual_assets')
      .insert({
        user_id: user.id,
        asset_name: validatedData.asset_name,
        current_value: validatedData.current_value,
        category: validatedData.category,
        entry_type: validatedData.entry_type,
        notes: validatedData.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating manual asset:', insertError);
      return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
    }

    // Record initial value in history table
    const { error: historyError } = await supabase.from('manual_asset_history').insert({
      manual_asset_id: newAsset.id,
      user_id: user.id,
      old_value: null,
      new_value: validatedData.current_value,
    });

    if (historyError) {
      console.error('Error recording asset history:', historyError);
    }

    return NextResponse.json({ asset: newAsset }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/assets:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
```

**Update `src/app/api/crypto/wallets/route.ts`:**

```typescript
import { cryptoWalletSchema } from '@/lib/validations/crypto';
import { validateRequest } from '@/lib/validationMiddleware';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(cryptoWalletSchema, body);
    if (!validation.success) {
      return validation.response;
    }

    const { wallet_address, wallet_name, blockchain } = validation.data;

    // Check for duplicate wallet
    const { data: existing } = await supabase
      .from('crypto_wallets')
      .select('id')
      .eq('user_id', user.id)
      .eq('wallet_address', wallet_address.toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'This wallet address is already added' },
        { status: 400 }
      );
    }

    // Insert new wallet
    const { data: wallet, error: insertError } = await supabase
      .from('crypto_wallets')
      .insert({
        user_id: user.id,
        wallet_address: wallet_address.toLowerCase(),
        wallet_name: wallet_name || `Wallet ${wallet_address.slice(0, 6)}...`,
        blockchain,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding crypto wallet:', insertError);
      return NextResponse.json({ error: 'Failed to add wallet' }, { status: 500 });
    }

    return NextResponse.json({ wallet }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/crypto/wallets:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
```

**Step 5: Update Frontend Forms to Show Validation Errors**

**Update `src/components/assets/AddAssetModal.tsx`:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError('');

  try {
    const response = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle validation errors
      if (data.details && Array.isArray(data.details)) {
        const errorMessages = data.details
          .map((err: any) => `${err.field}: ${err.message}`)
          .join(', ');
        setError(errorMessages);
      } else {
        setError(data.error || 'Failed to create asset');
      }
      return;
    }

    // Success - refresh and close
    onSuccess();
    onClose();
  } catch (err) {
    setError('Network error. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

### 6. Backup & DR Documentation

**Risk:** Data loss, no recovery plan
**Time Estimate:** 2 hours
**Complexity:** Easy

Create `documentations/BACKUP_DISASTER_RECOVERY.md`:

```markdown
# Backup & Disaster Recovery Plan

## Overview

This document outlines Guapital's backup strategy and disaster recovery procedures to ensure business continuity and data protection.

## Backup Strategy

### Database Backups (Supabase)

**Automated Backups:**
- **Frequency:** Daily at 2:00 AM UTC
- **Retention:** 7 daily backups
- **Provider:** Supabase Pro (automatic)
- **Storage Location:** Distributed across AWS S3 buckets in multiple regions

**Point-in-Time Recovery (PITR):**
- **Available for:** Supabase Pro plan and above
- **Recovery Window:** Up to 7 days
- **Granularity:** 1-second precision

**Manual Backups:**
- **Frequency:** Before major migrations or updates
- **Storage:** Download via Supabase Dashboard → Database → Backups
- **Retention:** Indefinite (stored in S3)

### Application Code & Configuration

**Version Control:**
- **Repository:** GitHub (private repo)
- **Branches:** main (production), staging (pre-prod), development
- **Commit Frequency:** Multiple times daily

**Environment Variables:**
- **Storage:** 1Password (team vault)
- **Backup:** Encrypted JSON export, stored in secure S3 bucket
- **Review Frequency:** Quarterly

### Static Assets

**CDN/Storage:**
- **Provider:** AWS S3 (via Amplify)
- **Replication:** Multi-region (us-east-1, us-west-2)
- **Versioning:** Enabled

## Recovery Time Objectives (RTO) & Recovery Point Objectives (RPO)

| Component | RTO | RPO | Notes |
|-----------|-----|-----|-------|
| Database | 4 hours | 24 hours | Restore from daily backup |
| Application | 1 hour | Minutes | Redeploy from GitHub |
| Static Assets | 30 minutes | Hours | S3 versioning |
| User Data | 4 hours | 24 hours | Same as database |

## Disaster Recovery Procedures

### Scenario 1: Database Corruption or Data Loss

**Detection:**
- Monitoring alerts (Supabase Dashboard)
- User reports of missing data
- Application errors

**Recovery Steps:**

1. **Assess Impact:**
   ```bash
   # Check database health
   psql -h db.xxxx.supabase.co -U postgres -c "SELECT pg_database_size('postgres');"
   ```

2. **Identify Last Known Good Backup:**
   - Go to Supabase Dashboard → Database → Backups
   - Review backup list and select appropriate restore point

3. **Restore Database:**
   - Option A: Point-in-Time Recovery (if available)
     - Select timestamp to restore to
     - Confirm restoration (creates new database)
   - Option B: Restore from Daily Backup
     - Download backup file
     - Create new Supabase project
     - Restore using pg_restore

4. **Update Application Configuration:**
   ```bash
   # Update environment variables
   NEXT_PUBLIC_SUPABASE_URL=https://new-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=new-anon-key
   ```

5. **Verify Data Integrity:**
   ```sql
   -- Check table row counts
   SELECT schemaname, tablename, n_live_tup
   FROM pg_stat_user_tables
   ORDER BY n_live_tup DESC;

   -- Verify recent data
   SELECT COUNT(*) FROM net_worth_snapshots WHERE created_at > NOW() - INTERVAL '7 days';
   ```

6. **Test Application:**
   - Login as test user
   - Verify net worth calculation
   - Check Plaid accounts sync
   - Verify crypto wallet balances

7. **Notify Users (if necessary):**
   - Send email via Supabase Auth
   - Post status update on landing page

**Expected Downtime:** 2-4 hours

---

### Scenario 2: Application Failure or Code Bug

**Detection:**
- AWS Amplify deployment failure
- Application not loading (500 errors)
- User reports

**Recovery Steps:**

1. **Rollback to Previous Deployment:**
   ```bash
   # Via AWS Amplify Console:
   # 1. Go to AWS Amplify → App → Deployments
   # 2. Find last successful deployment
   # 3. Click "Redeploy this version"

   # Via CLI:
   git revert HEAD
   git push origin main
   ```

2. **Verify Rollback:**
   - Test application endpoints
   - Check monitoring dashboard

3. **Debug Issue (Post-Recovery):**
   ```bash
   # Check error logs
   aws logs tail /aws/amplify/guapital --follow

   # Review failed deployment
   git diff HEAD~1 HEAD
   ```

**Expected Downtime:** 5-15 minutes

---

### Scenario 3: Third-Party Service Outage (Plaid, Stripe, Alchemy)

**Plaid Outage:**
- **Impact:** Users cannot connect new accounts or sync balances
- **Mitigation:** Display status banner, allow manual asset entry
- **Recovery:** Automatic when Plaid service resumes

**Stripe Outage:**
- **Impact:** New subscriptions cannot be processed
- **Mitigation:** Queue subscription requests, process after recovery
- **Recovery:** Manual verification of pending payments

**Alchemy Outage:**
- **Impact:** Crypto wallet balances not updated
- **Mitigation:** Display cached balances with "Last updated" timestamp
- **Recovery:** Automatic sync when service resumes

---

### Scenario 4: Complete Infrastructure Loss (AWS Region Failure)

**Extremely Low Probability - Included for Completeness**

**Recovery Steps:**

1. **Provision New Infrastructure:**
   - Create new Supabase project in different region
   - Deploy application to new AWS Amplify region

2. **Restore Database:**
   - Use most recent backup from S3
   - Restore to new Supabase instance

3. **Update DNS:**
   - Point guapital.com to new Amplify deployment
   - TTL: 5 minutes (for faster failover)

4. **Verify and Test:**
   - Full end-to-end testing
   - Notify users of potential data loss (last 24 hours)

**Expected Downtime:** 6-12 hours

---

## Backup Verification & Testing

### Monthly Backup Test (First Monday of Each Month)

1. Download latest Supabase backup
2. Restore to staging environment
3. Verify data integrity
4. Document any issues

### Quarterly DR Drill (First Quarter Month)

1. Simulate complete database loss
2. Execute full recovery procedure
3. Measure actual RTO vs. target
4. Update procedures based on findings

---

## Data Retention Policy

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| User account data | Account lifetime + 30 days | GDPR compliance |
| Transaction history | 7 years | Financial regulatory requirements |
| Audit logs | 2 years | Security compliance |
| Database backups | 7 days (daily), 4 weeks (weekly) | Operational recovery |
| Application logs | 30 days | Debugging and monitoring |

---

## Contacts & Escalation

**Primary Contact:**
- Name: [Founder Name]
- Email: [founder@guapital.com]
- Phone: [XXX-XXX-XXXX]

**Service Providers:**
- **Supabase Support:** support@supabase.com (Response: 24-48 hours)
- **AWS Support:** Enterprise support (Response: <1 hour for critical)
- **Plaid Support:** support@plaid.com
- **Stripe Support:** support@stripe.com

**Escalation Path:**
1. Founder (immediate)
2. Technical co-founder (if applicable)
3. Service provider support (within 1 hour)
4. External consultant (within 4 hours if unresolved)

---

## Post-Incident Review

After any disaster recovery event:

1. **Document Timeline:**
   - Detection time
   - Resolution time
   - Root cause

2. **Analyze Impact:**
   - Users affected
   - Data loss (if any)
   - Revenue impact

3. **Update Procedures:**
   - What worked
   - What didn't work
   - Process improvements

4. **Communicate:**
   - Internal team debrief
   - User notification (if applicable)
   - Stakeholder update

---

## Compliance Notes

**GDPR/CCPA:**
- All backups encrypted at rest
- User data deletion: 30-day grace period, then permanent
- Data export requests: fulfilled within 30 days

**SOC 2:**
- Backup procedures documented and tested
- Audit logs retained for 2 years
- Disaster recovery tested quarterly

---

**Last Tested:** [Date]
**Next Test Due:** [Date]
**Document Owner:** [Founder Name]
```

---

## Priority 3: First Month

Complete within the first month after launch.

---

### 7. GDPR Data Export

**Risk:** Non-compliance with GDPR right to data portability
**Time Estimate:** 6-8 hours
**Complexity:** Moderate

#### Implementation

**Step 1: Create Data Export Migration**

Create `supabase/migrations/014_add_data_export.sql`:

```sql
-- Table to track data export requests
CREATE TABLE data_export_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    export_url TEXT, -- S3 URL to download export
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Export link expires after 7 days
    error_message TEXT
);

-- Enable RLS
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view own export requests" ON data_export_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own export requests" ON data_export_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX idx_data_export_requests_status ON data_export_requests(status);
```

**Step 2: Create Data Export API Route**

Create `src/app/api/data-export/route.ts`:

```typescript
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { logSuccess } from '@/lib/audit';

// GET - Check status of data export request
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get most recent export request
    const { data: exportRequest, error } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching export request:', error);
      return NextResponse.json({ error: 'Failed to fetch export request' }, { status: 500 });
    }

    return NextResponse.json({ exportRequest }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/data-export:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Request a new data export
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Check if there's already a pending export
    const { data: existingRequest } = await supabase
      .from('data_export_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending export request' },
        { status: 400 }
      );
    }

    // Create new export request
    const { data: newRequest, error: insertError } = await supabase
      .from('data_export_requests')
      .insert({
        user_id: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating export request:', insertError);
      return NextResponse.json({ error: 'Failed to create export request' }, { status: 500 });
    }

    // Log audit event
    await logSuccess('data_export', request);

    // Trigger background job to process export (implement separately)
    // await triggerExportJob(newRequest.id);

    return NextResponse.json(
      {
        message: 'Export request submitted. You will receive an email when ready.',
        exportRequest: newRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/data-export:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
```

**Step 3: Create Background Job to Generate Export**

Create `src/lib/jobs/exportUserData.ts`:

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Export all user data to JSON
 * This should be run as a background job (e.g., via Supabase Edge Functions or AWS Lambda)
 */
export async function exportUserData(userId: string, exportRequestId: string) {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS
  );

  try {
    // Update status to processing
    await supabase
      .from('data_export_requests')
      .update({ status: 'processing' })
      .eq('id', exportRequestId);

    // Fetch all user data
    const userData: any = {
      metadata: {
        exported_at: new Date().toISOString(),
        user_id: userId,
        format_version: '1.0',
      },
      user_profile: {},
      plaid_items: [],
      plaid_accounts: [],
      plaid_transactions: [],
      crypto_wallets: [],
      crypto_holdings: [],
      manual_assets: [],
      manual_asset_history: [],
      net_worth_snapshots: [],
      user_demographics: {},
      user_settings: {},
      audit_logs: [],
    };

    // Fetch user profile
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    userData.user_profile = {
      email: authUser.user?.email,
      created_at: authUser.user?.created_at,
      last_sign_in_at: authUser.user?.last_sign_in_at,
    };

    // Fetch Plaid data
    const { data: plaidItems } = await supabase
      .from('plaid_items')
      .select('id, institution_name, sync_status, created_at')
      .eq('user_id', userId);
    userData.plaid_items = plaidItems || [];

    const { data: plaidAccounts } = await supabase
      .from('plaid_accounts')
      .select('*')
      .eq('user_id', userId);
    userData.plaid_accounts = plaidAccounts || [];

    const { data: plaidTransactions } = await supabase
      .from('plaid_transactions')
      .select('*')
      .eq('user_id', userId);
    userData.plaid_transactions = plaidTransactions || [];

    // Fetch crypto data
    const { data: cryptoWallets } = await supabase
      .from('crypto_wallets')
      .select('*')
      .eq('user_id', userId);
    userData.crypto_wallets = cryptoWallets || [];

    const { data: cryptoHoldings } = await supabase
      .from('crypto_holdings')
      .select('*')
      .eq('user_id', userId);
    userData.crypto_holdings = cryptoHoldings || [];

    // Fetch manual assets
    const { data: manualAssets } = await supabase
      .from('manual_assets')
      .select('*')
      .eq('user_id', userId);
    userData.manual_assets = manualAssets || [];

    const { data: assetHistory } = await supabase
      .from('manual_asset_history')
      .select('*')
      .eq('user_id', userId);
    userData.manual_asset_history = assetHistory || [];

    // Fetch net worth snapshots
    const { data: snapshots } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false });
    userData.net_worth_snapshots = snapshots || [];

    // Fetch user settings
    const { data: demographics } = await supabase
      .from('user_demographics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    userData.user_demographics = demographics || {};

    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    userData.user_settings = settings || {};

    // Fetch audit logs (last 2 years)
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    userData.audit_logs = auditLogs || [];

    // Generate JSON file
    const jsonData = JSON.stringify(userData, null, 2);
    const fileName = `guapital_export_${userId}_${Date.now()}.json`;

    // TODO: Upload to S3 or Supabase Storage
    // For now, save locally (in production, upload to secure storage)
    const filePath = path.join('/tmp', fileName);
    fs.writeFileSync(filePath, jsonData);

    // Generate pre-signed URL (expires in 7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const exportUrl = `https://your-s3-bucket.s3.amazonaws.com/${fileName}`; // Replace with actual S3 URL

    // Update export request with completed status
    await supabase
      .from('data_export_requests')
      .update({
        status: 'completed',
        export_url: exportUrl,
        completed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', exportRequestId);

    // Send email notification
    // TODO: Implement email sending via Supabase Auth or SendGrid

    console.log(`✅ Data export completed for user ${userId}`);
    return { success: true, exportUrl };
  } catch (error: any) {
    console.error('Error exporting user data:', error);

    // Update export request with error status
    await supabase
      .from('data_export_requests')
      .update({
        status: 'failed',
        error_message: error.message,
      })
      .eq('id', exportRequestId);

    return { success: false, error: error.message };
  }
}
```

**Step 4: Create User Interface**

Add to `src/app/dashboard/settings/page.tsx`:

```typescript
import { useState } from 'react';

export default function SettingsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExportData = async () => {
    setIsExporting(true);

    try {
      const res = await fetch('/api/data-export', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setExportStatus('Export requested. You will receive an email when ready.');
      } else {
        setExportStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setExportStatus('Failed to request export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Privacy & Data</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Export Your Data</h2>
        <p className="text-gray-600 mb-4">
          Download a complete copy of all your data in JSON format. This includes
          your accounts, transactions, net worth history, and settings.
        </p>

        <button
          onClick={handleExportData}
          disabled={isExporting}
          className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          {isExporting ? 'Requesting...' : 'Request Data Export'}
        </button>

        {exportStatus && (
          <p className="mt-4 text-sm text-gray-700">{exportStatus}</p>
        )}
      </div>
    </div>
  );
}
```

---

### 8. Security Monitoring

**Risk:** No visibility into security incidents
**Time Estimate:** 4-6 hours
**Complexity:** Moderate

#### Implementation Options

**Option A: Supabase Dashboard + Custom Alerts**

1. **Set Up Database Monitoring:**
   - Go to Supabase Dashboard → Settings → Monitoring
   - Enable alerts for:
     - High error rates (>100 errors/hour)
     - Slow queries (>1 second)
     - High connection count

2. **Create Custom Security Alerts:**

Create `src/lib/monitoring/alerts.ts`:

```typescript
/**
 * Send security alerts for suspicious activity
 */
export async function sendSecurityAlert(
  alertType: string,
  details: Record<string, any>
): Promise<void> {
  // Option 1: Log to console (basic)
  console.error(`🚨 SECURITY ALERT: ${alertType}`, details);

  // Option 2: Send email via Supabase Auth
  // TODO: Implement email sending

  // Option 3: Send to Slack webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Security Alert: ${alertType}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Security Alert: ${alertType}*\n\`\`\`${JSON.stringify(details, null, 2)}\`\`\``,
              },
            },
          ],
        }),
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }
}

/**
 * Monitor for suspicious activity
 */
export async function checkSuspiciousActivity(
  userId: string,
  actionType: string
): Promise<boolean> {
  // Check for multiple failed login attempts
  if (actionType === 'login_failed') {
    // Query audit logs for recent failures
    // If > 5 failures in 15 minutes, alert
    await sendSecurityAlert('multiple_failed_logins', {
      user_id: userId,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  // Check for unusual data access patterns
  // (e.g., downloading all transactions in one request)

  return false;
}
```

3. **Add to API Routes:**

```typescript
import { checkSuspiciousActivity } from '@/lib/monitoring/alerts';

// In login route:
if (!user) {
  await checkSuspiciousActivity(email, 'login_failed');
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
```

**Option B: Third-Party Monitoring (Sentry)**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configure `sentry.client.config.js` and `sentry.server.config.js` as prompted.

---

## Testing & Verification

### Security Headers Test

```bash
curl -I https://your-app.com | grep -E "X-Frame-Options|Content-Security-Policy|Strict-Transport-Security"
```

Expected output:
```
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Rate Limiting Test

```bash
# Install Apache Bench
brew install httpd  # macOS

# Test rate limit
ab -n 150 -c 10 https://your-app.com/api/networth
```

Expected: 429 Too Many Requests after ~100 requests

### Encryption Test

```sql
-- Verify tokens are encrypted
SELECT id, access_token_encrypted IS NOT NULL as encrypted
FROM plaid_items
WHERE user_id = 'test-user-id';
```

Expected: `encrypted = true`

### Audit Logging Test

```sql
-- Check audit logs are being created
SELECT action_type, status, COUNT(*)
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY action_type, status
ORDER BY COUNT(*) DESC;
```

Expected: Recent logs for various actions

### Input Validation Test

```bash
# Test invalid input
curl -X POST https://your-app.com/api/assets \
  -H "Content-Type: application/json" \
  -d '{"asset_name": "", "current_value": -100}'
```

Expected: 400 Bad Request with validation errors

---

## Deployment Checklist

Before deploying these changes to production:

- [ ] Rate limiting implemented and tested
- [ ] Security headers configured
- [ ] Plaid tokens encrypted
- [ ] Audit logging functional
- [ ] Input validation added to all routes
- [ ] Backup procedures documented
- [ ] Data export endpoint tested
- [ ] Monitoring alerts configured
- [ ] All tests passing
- [ ] Staging environment verified
- [ ] Rollback plan documented

---

## Maintenance

### Weekly
- Review audit logs for suspicious activity
- Check rate limit effectiveness (false positives?)

### Monthly
- Test database backup restoration
- Review and rotate encryption keys (if applicable)
- Update security dependencies

### Quarterly
- Full disaster recovery drill
- Security code review
- Penetration testing (external consultant)

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)

---

**Document Version:** 1.0
**Last Updated:** October 2025
**Next Review:** November 2025
