/**
 * Rate Limit Testing Script
 *
 * Tests rate limiting by making rapid requests to an API endpoint.
 * Verifies that 429 responses are returned after exceeding limits.
 *
 * Usage:
 *   npx tsx scripts/test-rate-limit.ts
 *
 * Requirements:
 *   - Local dev server running (npm run dev)
 *   - tsx installed (npm install -D tsx)
 */

const API_ENDPOINT = 'http://localhost:3000/api/networth';
const MAX_REQUESTS = 310; // API limit is 300/min

async function testRateLimit() {
  console.log('🧪 Testing Rate Limiting\n');
  console.log(`Endpoint: ${API_ENDPOINT}`);
  console.log(`Sending ${MAX_REQUESTS} rapid requests...\n`);

  let rateLimitHit = false;
  let firstRateLimitAt = 0;

  for (let i = 1; i <= MAX_REQUESTS; i++) {
    try {
      const response = await fetch(API_ENDPOINT);
      const status = response.status;
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const limit = response.headers.get('X-RateLimit-Limit');
      const reset = response.headers.get('X-RateLimit-Reset');
      const retryAfter = response.headers.get('Retry-After');

      // Log every 10th request or important events
      if (i % 10 === 0 || status === 429 || i === 1) {
        console.log(
          `Request ${i.toString().padStart(3)}: ${status} | ` +
            `Remaining: ${remaining || 'N/A'}/${limit || 'N/A'} | ` +
            `Reset: ${reset ? new Date(parseInt(reset)).toLocaleTimeString() : 'N/A'}`
        );
      }

      // Check if rate limit hit
      if (status === 429 && !rateLimitHit) {
        rateLimitHit = true;
        firstRateLimitAt = i;

        console.log('\n🚨 Rate Limit Hit!\n');
        console.log(`First 429 response at request #${i}`);
        console.log(`Retry-After: ${retryAfter} seconds\n`);

        // Parse response body
        const body = await response.json();
        console.log('Response body:', JSON.stringify(body, null, 2));

        break; // Stop after first rate limit
      }
    } catch (error) {
      console.error(`Request ${i} failed:`, error);
    }

    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Summary
  console.log('\n📊 Test Summary\n');

  if (rateLimitHit) {
    console.log(`✅ Rate limiting is WORKING`);
    console.log(`   - Blocked after ${firstRateLimitAt} requests`);
    console.log(`   - Expected limit: 100 requests/minute`);
    console.log(`   - Actual behavior: ${firstRateLimitAt <= 101 ? 'PASS' : 'FAIL'}`);
  } else {
    console.log(`❌ Rate limiting did NOT trigger`);
    console.log(`   - Sent ${MAX_REQUESTS} requests without being blocked`);
    console.log(`   - This may indicate rate limiting is not enabled`);
  }

  console.log('\n✨ Test Complete\n');
}

// Run the test
testRateLimit().catch(console.error);
