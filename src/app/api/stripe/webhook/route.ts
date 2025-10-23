import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

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

    // Use service role key to bypass RLS in webhooks
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;

        // Validate session has required data
        if (!session.subscription) {
          console.error('Checkout session missing subscription ID');
          return NextResponse.json(
            { error: 'Invalid checkout session' },
            { status: 400 }
          );
        }

        if (!session.metadata?.user_id) {
          console.error('Checkout session missing user_id in metadata');
          return NextResponse.json(
            { error: 'Invalid checkout session metadata' },
            { status: 400 }
          );
        }

        // Check if user already has an active subscription
        const { data: existingSettings } = await supabase
          .from('user_settings')
          .select('subscription_tier, subscription_status, stripe_subscription_id')
          .eq('user_id', session.metadata.user_id)
          .single();

        if (
          existingSettings?.subscription_tier === 'premium' &&
          existingSettings?.subscription_status === 'active' &&
          existingSettings?.stripe_subscription_id &&
          existingSettings.stripe_subscription_id !== session.subscription
        ) {
          console.warn(
            `User ${session.metadata.user_id} already has active subscription ${existingSettings.stripe_subscription_id}, ignoring new subscription ${session.subscription}`
          );
          return NextResponse.json(
            { error: 'User already has an active subscription' },
            { status: 400 }
          );
        }

        // Get the price ID from the session to track founding members
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;

        if (!priceId) {
          console.error('No price ID found in checkout session line items');
          return NextResponse.json(
            { error: 'Invalid checkout session line items' },
            { status: 400 }
          );
        }

        // Get subscription details to populate start/end dates
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

        // Update user to premium tier with subscription dates
        const { error } = await supabase
          .from('user_settings')
          .update({
            subscription_tier: 'premium',
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', session.metadata.user_id);

        if (error) {
          console.error('Error updating user subscription:', error);
          return NextResponse.json(
            { error: 'Failed to update subscription' },
            { status: 500 }
          );
        } else {
          console.log(`User ${session.metadata.user_id} upgraded to premium (${priceId})`);
          console.log(`Subscription period: ${new Date(subscription.current_period_start * 1000).toISOString()} to ${new Date(subscription.current_period_end * 1000).toISOString()}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const tier = subscription.status === 'active' ? 'premium' : 'free';

        // Update subscription tier, status, and renewal dates
        const { error } = await supabase
          .from('user_settings')
          .update({
            subscription_tier: tier,
            subscription_status: subscription.status,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription status:', error);
          return NextResponse.json(
            { error: 'Failed to update subscription status' },
            { status: 500 }
          );
        } else {
          console.log(`Subscription ${subscription.id} updated to ${tier} (renews: ${new Date(subscription.current_period_end * 1000).toISOString()})`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;

        const { error } = await supabase
          .from('user_settings')
          .update({ subscription_tier: 'free' })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error handling subscription cancellation:', error);
          return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
          );
        } else {
          console.log(`Subscription ${subscription.id} cancelled`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;

        // Log failed payment - could add user notification here
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;
        console.warn(
          `Payment failed for subscription ${subscriptionId}`
        );
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;

        // Log successful payment
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;
        console.log(
          `Payment succeeded for subscription ${subscriptionId}`
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}
