# Stripe API Setup Guide

Complete step-by-step guide for integrating Stripe subscriptions into Guapital.

**Last Updated:** October 2025
**Status:** Pre-launch setup guide
**Owner:** Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Step 1: Create Stripe Account](#step-1-create-stripe-account)
3. [Step 2: Get API Keys](#step-2-get-api-keys)
4. [Step 3: Create Products & Prices](#step-3-create-products--prices)
5. [Step 4: Set Up Webhooks](#step-4-set-up-webhooks)
6. [Step 5: Create Webhook Endpoint](#step-5-create-webhook-endpoint)
7. [Step 6: Test Integration](#step-6-test-the-integration)
8. [Step 7: Production Setup](#step-7-production-setup)
9. [Step 8: Founding Member Tracking](#step-8-founding-member-tracking)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Guapital uses Stripe for subscription billing with the following pricing structure:

| Plan | Price | Billing | Details |
|------|-------|---------|---------|
| **Free** | $0 | - | Unlimited manual entry, 2 crypto wallets, 30-day history |
| **Premium (Monthly)** | $9.99/mo | Monthly | All features unlocked |
| **Premium (Annual)** | $99/year | Yearly | 17% savings vs monthly |
| **Founding Member** | $79/year | Yearly | First 1,000 users only, locked in forever |

**Key Requirements:**
- Test mode setup for development
- Live mode setup for production
- Webhook handling for subscription events
- Founding member slot tracking (first 1,000 users)

---

## Step 1: Create Stripe Account

### 1.1 Sign Up

1. Go to [stripe.com](https://stripe.com)
2. Click "Start now" and create an account
3. Use your business email (e.g., founder@guapital.com)

### 1.2 Complete Business Profile

Fill in basic information:
- **Business name:** Guapital
- **Business type:** Software/SaaS
- **Industry:** Financial Services
- **Country:** United States (or your country)

### 1.3 Stay in Test Mode

**IMPORTANT:** Keep the toggle in **Test Mode** (top-right corner of dashboard) until you're ready to launch. This lets you develop without processing real payments.

---

## Step 2: Get API Keys

### 2.1 Navigate to API Keys

1. Go to **Developers** → **API keys** in Stripe Dashboard
2. Ensure you're in **Test Mode** (check toggle in top-right)

### 2.2 Copy Test Keys

You'll see two keys:

**Publishable Key** (starts with `pk_test_...`)
- Used in client-side code
- Safe to expose in frontend

**Secret Key** (starts with `sk_test_...`)
- Click "Reveal test key" to see it
- Used in server-side code
- NEVER expose in frontend or commit to git

### 2.3 Add to Environment Variables

Create or update `/Users/mzou/Documents/GitHub/guapital/.env.local`:

```bash
# Stripe Test Keys (Development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

**Security Note:** `.env.local` should already be in `.gitignore`. Never commit API keys to version control.

---

## Step 3: Create Products & Prices

### 3.1 Create Premium Product

1. Go to **Products** → **Add Product**
2. Fill in product details:

```
Name: Guapital Premium
Description: Unlimited accounts, full transaction history, percentile ranking, FIRE calculator, and advanced reports

Image: [Upload your logo or product screenshot - optional]
```

3. Click **Save product**

### 3.2 Add Monthly Price

After creating the product, add pricing options:

1. In the product page, click **Add another price**
2. Fill in:

```
Price: $9.99
Billing period: Monthly
Currency: USD
```

3. Click **Save**
4. **IMPORTANT:** Copy the **Price ID** (starts with `price_...`)

### 3.3 Add Annual Price

1. Click **Add another price** again
2. Fill in:

```
Price: $99
Billing period: Yearly
Currency: USD
Description: Save 17% with annual billing
```

3. Click **Save**
4. Copy the **Price ID**

### 3.4 Add Founding Member Price

1. Click **Add another price**
2. Fill in:

```
Price: $79
Billing period: Yearly
Currency: USD
Description: Founding Member - Locked in forever (First 1,000 users only)
```

3. Click **Save**
4. Copy the **Price ID**

### 3.5 Save Price IDs to Environment

Add all three Price IDs to `.env.local`:

```bash
# Stripe Price IDs (Test Mode)
STRIPE_PRICE_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ANNUAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_FOUNDING=price_xxxxxxxxxxxxx
```

---

## Step 4: Set Up Webhooks

Webhooks allow Stripe to notify your app when subscription events occur (payment success, cancellation, etc.).

### 4.1 Install Stripe CLI (for local development)

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
Download from [Stripe CLI releases](https://github.com/stripe/stripe-cli/releases)

**Linux:**
```bash
# Download and install manually from GitHub releases
```

Verify installation:
```bash
stripe --version
```

### 4.2 Login to Stripe CLI

```bash
stripe login
```

This will:
1. Open your browser to authenticate
2. Ask you to confirm the login
3. Store credentials locally

### 4.3 Forward Webhooks to Local Development

**Terminal 1:** Start your Next.js app
```bash
npm run dev
```

**Terminal 2:** Start Stripe webhook forwarding
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### 4.4 Add Webhook Secret to Environment

Copy the webhook signing secret and add to `.env.local`:

```bash
# Stripe Webhook Secret (Development)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**IMPORTANT:** Keep the `stripe listen` terminal running while developing. If you restart it, the webhook secret changes and you'll need to update `.env.local`.

---

## Step 5: Create Webhook Endpoint

Create the file `/src/app/api/stripe/webhook/route.ts`:

```typescript
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Update user to premium tier
        const { error } = await supabase
          .from('user_settings')
          .update({
            subscription_tier: 'premium',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('user_id', session.metadata?.user_id);

        if (error) {
          console.error('Error updating user subscription:', error);
        } else {
          console.log(`User ${session.metadata?.user_id} upgraded to premium`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const tier = subscription.status === 'active' ? 'premium' : 'free';

        const { error } = await supabase
          .from('user_settings')
          .update({ subscription_tier: tier })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription status:', error);
        } else {
          console.log(`Subscription ${subscription.id} updated to ${tier}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const { error } = await supabase
          .from('user_settings')
          .update({ subscription_tier: 'free' })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error handling subscription cancellation:', error);
        } else {
          console.log(`Subscription ${subscription.id} cancelled`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;

        // Optionally notify user of failed payment
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;
        console.warn(
          `Payment failed for subscription ${subscriptionId}`
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

---

## Step 6: Test the Integration

### 6.1 Stripe Test Cards

Use these test card numbers in checkout:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

**For all test cards:**
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### 6.2 Test Checkout Flow

1. **Start your dev environment:**
   ```bash
   # Terminal 1
   npm run dev

   # Terminal 2
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. **Navigate to pricing page:**
   ```
   http://localhost:3000/pricing
   ```

3. **Click "Get Started" on a paid tier**

4. **Complete checkout with test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`

5. **Verify webhook events in Terminal 2:**
   ```
   checkout.session.completed [evt_xxxxx]
   ```

6. **Check Supabase:**
   - User's `subscription_tier` should be `'premium'`
   - `stripe_customer_id` should be populated
   - `stripe_subscription_id` should be populated

### 6.3 Test Subscription Management

**Test cancellation:**
1. Go to Stripe Dashboard → **Customers**
2. Find the test customer
3. Click on their subscription
4. Click **Cancel subscription**
5. Verify webhook fires: `customer.subscription.deleted`
6. Check Supabase: `subscription_tier` should revert to `'free'`

### 6.4 Common Test Scenarios

| Scenario | How to Test |
|----------|-------------|
| Successful payment | Use `4242 4242 4242 4242` |
| Failed payment | Use `4000 0000 0000 0002` |
| Subscription cancellation | Cancel in Stripe Dashboard |
| Subscription reactivation | Reactivate in Stripe Dashboard |
| Payment method update | Update card in Stripe Dashboard |

---

## Step 7: Production Setup

**⚠️ DO NOT DO THIS UNTIL YOU'RE READY TO LAUNCH**

### 7.1 Complete Stripe Activation

1. Go to **Settings** → **Account details**
2. Complete business verification:
   - Business address
   - Tax ID (EIN or SSN)
   - Business description: "Personal finance management software"
   - Representative information

3. Add bank account for payouts:
   - Go to **Settings** → **Bank accounts and scheduling**
   - Add your business bank account
   - Verify micro-deposits (takes 1-2 business days)

4. Set up payout schedule:
   - Recommended: Daily automatic payouts
   - Or: Weekly/monthly if you prefer

### 7.2 Switch to Live Mode

1. Click the **Test mode** toggle in top-right corner
2. Switch to **Live mode**

### 7.3 Get Live API Keys

1. Go to **Developers** → **API keys** (in Live Mode)
2. Copy **Publishable key** (starts with `pk_live_...`)
3. Reveal and copy **Secret key** (starts with `sk_live_...`)

4. Add to production environment variables:
   ```bash
   # Stripe Live Keys (Production)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   ```

### 7.4 Recreate Products in Live Mode

**IMPORTANT:** Products created in Test Mode don't transfer to Live Mode. You must recreate them.

Repeat Step 3 (Create Products & Prices) in **Live Mode**:
1. Create "Guapital Premium" product
2. Add Monthly price ($9.99/mo)
3. Add Annual price ($99/year)
4. Add Founding Member price ($79/year)
5. Copy all **Live Mode Price IDs** to production env vars

### 7.5 Create Production Webhook

1. Go to **Developers** → **Webhooks** (in Live Mode)
2. Click **Add endpoint**
3. Fill in:

```
Endpoint URL: https://yourdomain.com/api/stripe/webhook
Description: Production webhook for subscription events
```

4. Select events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`

5. Click **Add endpoint**

6. Copy the **Signing secret** (starts with `whsec_...`)

7. Add to production environment:
   ```bash
   # Stripe Webhook Secret (Production)
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### 7.6 Test Production Webhook

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click on your production endpoint
3. Click **Send test webhook**
4. Select `checkout.session.completed`
5. Click **Send test webhook**
6. Verify your server receives it (check logs)

---

## Step 8: Founding Member Tracking

Track the first 1,000 users who get the $79 founding member price.

### 8.1 Create Founding Member Counter API

Create `/src/app/api/founding-members/count/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = createClient();

  // Count users with founding member pricing
  const { count, error } = await supabase
    .from('user_settings')
    .select('user_id', { count: 'exact', head: true })
    .eq('subscription_tier', 'premium')
    .eq('stripe_price_id', process.env.STRIPE_PRICE_FOUNDING);

  if (error) {
    console.error('Error counting founding members:', error);
    return NextResponse.json(
      { error: 'Failed to count founding members' },
      { status: 500 }
    );
  }

  const remaining = Math.max(0, 1000 - (count || 0));
  const isFull = remaining === 0;

  return NextResponse.json({
    total: count || 0,
    remaining,
    isFull,
  });
}
```

### 8.2 Update Checkout Logic

In your checkout creation logic, check founding member availability:

```typescript
// Example: /src/app/api/stripe/create-checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { priceType } = await request.json();

  // Check founding member availability
  let priceId: string;
  if (priceType === 'founding') {
    const { count } = await supabase
      .from('user_settings')
      .select('user_id', { count: 'exact', head: true })
      .eq('subscription_tier', 'premium')
      .eq('stripe_price_id', process.env.STRIPE_PRICE_FOUNDING);

    const slotsAvailable = (count || 0) < 1000;

    priceId = slotsAvailable
      ? process.env.STRIPE_PRICE_FOUNDING!
      : process.env.STRIPE_PRICE_ANNUAL!; // Fallback to regular annual
  } else if (priceType === 'annual') {
    priceId = process.env.STRIPE_PRICE_ANNUAL!;
  } else {
    priceId = process.env.STRIPE_PRICE_MONTHLY!;
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?checkout=cancelled`,
    metadata: {
      user_id: user.id,
    },
  });

  return NextResponse.json({ url: session.url });
}
```

### 8.3 Update Database Schema

Ensure `user_settings` table has a column to track the price ID:

```sql
-- Add column if it doesn't exist
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
```

Update webhook to save price ID:

```typescript
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session;
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  const priceId = lineItems.data[0]?.price?.id;

  await supabase
    .from('user_settings')
    .update({
      subscription_tier: 'premium',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      stripe_price_id: priceId, // Save for founding member tracking
    })
    .eq('user_id', session.metadata?.user_id);
  break;
}
```

---

## Troubleshooting

### Webhook Signature Verification Failed

**Symptom:** Webhook returns 400 error: "Invalid signature"

**Solutions:**
1. **Check webhook secret matches:**
   ```bash
   # In terminal running stripe listen, you'll see:
   # whsec_xxxxxxxxxxxxx
   # This must match STRIPE_WEBHOOK_SECRET in .env.local
   ```

2. **Restart Stripe CLI:**
   ```bash
   # Ctrl+C to stop stripe listen
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   # Copy new webhook secret to .env.local
   # Restart Next.js dev server
   ```

3. **Verify endpoint URL:**
   - Should be exactly `/api/stripe/webhook`
   - No trailing slash

### Subscription Not Updating in Supabase

**Symptom:** User pays but subscription_tier stays 'free'

**Solutions:**
1. **Check webhook logs in Stripe Dashboard:**
   - Go to **Developers** → **Webhooks**
   - Click on your endpoint
   - Check recent events for errors

2. **Verify RLS policies:**
   ```sql
   -- Check if service role can update user_settings
   SELECT * FROM user_settings WHERE user_id = 'test_user_id';
   ```

3. **Add logging to webhook:**
   ```typescript
   console.log('Webhook event:', event.type);
   console.log('User ID:', session.metadata?.user_id);
   console.log('Subscription ID:', session.subscription);
   ```

4. **Check metadata is passed:**
   - When creating checkout session, ensure `metadata: { user_id }` is included

### Test Mode vs Live Mode Confusion

**Symptom:** Keys don't work, products not found

**Solutions:**
1. **Always check the mode toggle** (top-right in Stripe Dashboard)
2. **Use matching keys:**
   - Test mode: `pk_test_...` and `sk_test_...`
   - Live mode: `pk_live_...` and `sk_live_...`
3. **Separate Price IDs:**
   - Test Price IDs don't work in Live mode
   - Must recreate products in Live mode

### Webhook Not Receiving Events Locally

**Symptom:** `stripe listen` running but no events logged

**Solutions:**
1. **Verify Next.js is running on correct port:**
   ```bash
   # Default is localhost:3000
   # If different, update stripe listen command:
   stripe listen --forward-to localhost:YOUR_PORT/api/stripe/webhook
   ```

2. **Check firewall/antivirus:**
   - May block local webhook forwarding
   - Try disabling temporarily

3. **Use ngrok as alternative:**
   ```bash
   # Install ngrok
   brew install ngrok

   # Forward port 3000
   ngrok http 3000

   # Use ngrok URL with stripe listen
   stripe listen --forward-to https://xxxxx.ngrok.io/api/stripe/webhook
   ```

### Founding Member Slots Not Tracking

**Symptom:** More than 1,000 founding members allowed

**Solutions:**
1. **Add database index for faster counting:**
   ```sql
   CREATE INDEX idx_founding_members
   ON user_settings(subscription_tier, stripe_price_id)
   WHERE subscription_tier = 'premium';
   ```

2. **Use transaction locking for race conditions:**
   ```typescript
   // In checkout creation, lock the count check
   const { data: lock } = await supabase.rpc('increment_founding_count');
   ```

3. **Add hard limit in checkout:**
   ```typescript
   if (count >= 1000) {
     throw new Error('Founding member slots full');
   }
   ```

---

## Next Steps

After completing this setup:

1. ✅ Test all payment flows thoroughly
2. ✅ Verify webhook handling for all subscription events
3. ✅ Confirm founding member tracking works correctly
4. ✅ Test subscription cancellation and reactivation
5. ✅ Add error handling for failed payments
6. ✅ Set up email notifications for subscription events (optional)

**Before production launch:**
- [ ] Complete Stripe account activation
- [ ] Switch to Live mode and get production keys
- [ ] Recreate products in Live mode
- [ ] Set up production webhook
- [ ] Test with real card (small amount, then refund)
- [ ] Monitor webhook logs for first few days

---

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)

---

**Questions or issues?** Check the Stripe Dashboard logs first, then review webhook event history. Most issues are related to webhook configuration or API key mismatches.
