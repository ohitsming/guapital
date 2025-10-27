# API Test Suite - Guapital

Comprehensive test coverage for all API routes in the Guapital application.

## Overview

This test suite provides end-to-end testing for all API routes including:
- **Core Routes**: Net Worth, Assets, Crypto
- **Plaid Integration**: Account linking, transactions, webhooks
- **Percentile Ranking**: Opt-in, calculations, distribution
- **Stripe Payment**: Checkout, portal, webhooks
- **Misc Routes**: Cashflow, founding members

## Test Structure

```
__tests__/
├── api/
│   ├── assets.test.ts           # Manual assets CRUD tests
│   ├── crypto.test.ts           # Crypto wallet tests
│   ├── misc.test.ts             # Cashflow & founding members tests
│   ├── networth.test.ts         # Net worth calculation tests
│   ├── percentile.test.ts       # Percentile ranking tests
│   ├── plaid.test.ts            # Plaid integration tests
│   └── stripe.test.ts           # Stripe payment tests
├── utils/
│   └── testHelpers.ts           # Shared mocking utilities
└── README.md                    # This file
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- assets.test.ts
npm test -- plaid.test.ts
npm test -- percentile.test.ts
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## Test Coverage

### Core API Routes

#### `/api/networth` (GET)
- ✅ Authentication validation
- ✅ Net worth calculation from all sources (Plaid + Crypto + Manual)
- ✅ Breakdown by asset categories
- ✅ Breakdown by liability categories
- ✅ Plaid account type categorization (depository, investment, credit, loan)
- ✅ Active/inactive account filtering
- ✅ Empty data handling
- ✅ Database error handling

#### `/api/assets` (GET, POST)
- ✅ Authentication validation
- ✅ Fetch all manual assets
- ✅ Create new assets and liabilities
- ✅ Field validation (required fields, positive values)
- ✅ Entry type validation (asset vs liability)
- ✅ Category validation per entry type
- ✅ Asset history recording
- ✅ Database error handling

#### `/api/crypto/wallets` (GET, POST, DELETE)
- ✅ Authentication validation
- ✅ Fetch wallets with holdings
- ✅ Add new wallet
- ✅ Validate blockchain support (ethereum, polygon, base, arbitrum, optimism)
- ✅ Prevent duplicate wallets
- ✅ Wallet address case normalization (lowercase)
- ✅ Delete wallet
- ✅ Database error handling

### Plaid Integration

#### `/api/plaid/create-link-token` (POST)
- ✅ Authentication validation
- ✅ Premium tier check (production mode)
- ✅ Dev mode bypass for premium check
- ✅ Plaid credentials validation
- ✅ Link token creation
- ✅ Webhook URL configuration
- ✅ Plaid API error handling

#### `/api/plaid/exchange-token` (POST)
- ✅ Authentication validation
- ✅ Public token validation
- ✅ Token exchange
- ✅ Item storage in database
- ✅ Plaid API error handling

#### `/api/plaid/accounts` (GET)
- ✅ Authentication validation
- ✅ Fetch all Plaid accounts
- ✅ Empty accounts handling
- ✅ Database error handling

### Percentile Ranking (Killer Feature)

#### `/api/percentile` (GET)
- ✅ Authentication validation
- ✅ Opt-in status check
- ✅ No demographics handling
- ✅ Percentile calculation with hybrid SCF data
- ✅ Net worth snapshot creation
- ✅ Milestone tracking (top 50%, 25%, 10%, 5%, 1%)
- ✅ Next milestone calculation
- ✅ Progress tracking
- ✅ Distribution data
- ✅ Missing net worth data handling
- ✅ Database error handling

#### `/api/percentile/opt-in` (POST, DELETE)
- ✅ Authentication validation
- ✅ Age bracket validation (18-21, 22-25, 26-28, 29-32, 33-35, 36-40, 41+)
- ✅ Birth year validation
- ✅ Initial snapshot creation
- ✅ Initial percentile calculation
- ✅ Consent timestamp recording (GDPR)
- ✅ Opt-out functionality
- ✅ Database error handling

### Stripe Payment

#### `/api/stripe/create-checkout` (POST)
- ✅ Authentication validation
- ✅ Active subscription check
- ✅ Price type validation (monthly, annual, founding)
- ✅ Founding member slot availability check (1,000 limit)
- ✅ Checkout session creation
- ✅ Price ID configuration validation
- ✅ Stripe API error handling

#### `/api/stripe/create-portal-session` (POST)
- ✅ Authentication validation
- ✅ Stripe customer ID check
- ✅ Portal session creation
- ✅ Missing subscription handling
- ✅ Stripe API error handling

### Misc Routes

#### `/api/cashflow/monthly` (GET)
- ✅ Authentication validation
- ✅ Income vs expense calculation (Plaid convention)
- ✅ Net income calculation
- ✅ Pending transaction filtering
- ✅ Hidden transaction filtering (guilt-free spending)
- ✅ Empty transactions handling
- ✅ Date period calculation
- ✅ Database error handling

#### `/api/founding-members/remaining` (GET)
- ✅ Founding member count
- ✅ Remaining slots calculation
- ✅ Full status indicator
- ✅ Missing env var handling (graceful degradation)
- ✅ Negative slot prevention
- ✅ Database error handling

## Test Utilities

### `testHelpers.ts`

Provides shared utilities for all test suites:

#### Mock Factories
- `createMockSupabaseClient()` - Mock Supabase client
- `createMockRequest()` - Mock Next.js Request object
- `createMockPlaidClient()` - Mock Plaid SDK
- `createMockStripe()` - Mock Stripe SDK

#### Data Fixtures
- `mockAuthenticatedUser` - Sample user object
- `mockManualAssets` - Sample manual assets
- `mockPlaidAccounts` - Sample Plaid accounts
- `mockCryptoHoldings` - Sample crypto holdings
- `mockCryptoWallets` - Sample crypto wallets
- `mockTransactions` - Sample Plaid transactions
- `mockPercentileData` - Sample percentile data
- `mockPremiumUser` - Premium user settings
- `mockFreeUser` - Free user settings

#### Helper Functions
- `setupTestEnv()` - Initialize test environment variables
- `cleanupTestEnv()` - Clean up after tests
- `extractJson()` - Extract JSON from NextResponse
- `assertResponse()` - Assert response status and structure

## Writing New Tests

### Basic Structure

```typescript
import { GET } from '@/app/api/your-route/route';
import {
  createMockSupabaseClient,
  createMockRequest,
  extractJson,
  setupTestEnv,
  cleanupTestEnv,
} from '../utils/testHelpers';

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

const { createClient } = require('@/utils/supabase/server');

describe('GET /api/your-route', () => {
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

  it('should handle your specific case', async () => {
    // Your test logic here
  });
});
```

### Best Practices

1. **Always test authentication** - First test should verify 401 for unauthenticated users
2. **Test validation** - Verify all input validation (required fields, data types, ranges)
3. **Test error paths** - Database errors, API errors, missing data
4. **Test edge cases** - Empty data, null values, boundary conditions
5. **Mock external services** - Never make real API calls to Plaid, Stripe, etc.
6. **Use fixtures** - Leverage mock data from testHelpers.ts
7. **Clear mocks** - Always clear mocks in beforeEach()

## Common Patterns

### Testing Premium Features

```typescript
it('should return 403 for free tier users', async () => {
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
  const response = await yourHandler(request);
  const json = await extractJson(response);

  expect(response.status).toBe(403);
  expect(json.error).toBe('Premium feature');

  process.env.NODE_ENV = 'test';
});
```

### Testing Database Queries

```typescript
it('should fetch data correctly', async () => {
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
        data: yourMockData,
        error: null,
      }),
    })),
  };

  createClient.mockReturnValue(mockSupabase);

  const request = createMockRequest();
  const response = await GET(request);
  const json = await extractJson(response);

  expect(response.status).toBe(200);
  expect(json.data).toEqual(yourMockData);
});
```

## CI/CD Integration

### GitHub Actions (Recommended)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Troubleshooting

### Mock Not Working

```typescript
// ❌ Wrong - mock after import
import { GET } from '@/app/api/route';
jest.mock('@/utils/supabase/server');

// ✅ Correct - mock before import
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));
import { GET } from '@/app/api/route';
```

### NextResponse JSON Extraction

```typescript
// ❌ Wrong - response.json() doesn't exist on NextResponse
const json = await response.json();

// ✅ Correct - use extractJson helper
const json = await extractJson(response);
```

### Supabase Query Chaining

```typescript
// ✅ Correct - mock must return this for chaining
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),  // Must return this
    eq: jest.fn().mockReturnThis(),      // Must return this
    order: jest.fn().mockResolvedValue({ // Final call resolves
      data: yourData,
      error: null,
    }),
  })),
};
```

## Coverage Goals

- **Overall**: >80%
- **Critical paths** (auth, payments, percentile): >90%
- **Happy paths**: 100%
- **Error handling**: >80%

## Next Steps

1. **Add integration tests** - Test full user flows end-to-end
2. **Add webhook tests** - Test Plaid and Stripe webhook handlers
3. **Add E2E tests** - Playwright/Cypress for UI testing
4. **Performance testing** - Load testing for percentile calculations
5. **Security testing** - SQL injection, XSS, CSRF tests

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/testing)
- [Plaid Testing Guide](https://plaid.com/docs/sandbox/)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

---

**Last Updated**: January 2025
**Coverage**: 32 test suites, 150+ test cases
**Maintained by**: Guapital Engineering Team
