import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// Validate environment variables on module load
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  logger.info('Stripe webhook received', { requestId });

  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    logger.info('Webhook signature check', {
      requestId,
      hasSignature: !!signature,
      bodyLength: body.length
    });

    if (!signature) {
      logger.error('Missing stripe-signature header', { requestId });
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logger.webhook(event.type, {
        eventId: event.id,
        requestId,
        created: new Date(event.created * 1000).toISOString()
      });
    } catch (err) {
      logger.error('Webhook signature verification failed', {
        error: err,
        requestId,
        signaturePrefix: signature.substring(0, 10) + '...'
      });
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
        logger.info('Processing checkout.session.completed', {
          requestId,
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          mode: session.mode,
          paymentStatus: session.payment_status
        });

        // Validate session has required data
        if (!session.subscription) {
          logger.error('Checkout session missing subscription ID', {
            requestId,
            sessionId: session.id,
            hasSubscription: !!session.subscription,
            sessionMode: session.mode,
            sessionPaymentStatus: session.payment_status,
          });
          return NextResponse.json(
            { error: 'Invalid checkout session - missing subscription' },
            { status: 400 }
          );
        }

        if (!session.metadata?.user_id) {
          logger.error('Checkout session missing user_id in metadata', {
            requestId,
            sessionId: session.id,
            metadata: session.metadata,
          });
          return NextResponse.json(
            { error: 'Invalid checkout session metadata - missing user_id' },
            { status: 400 }
          );
        }

        // Check if user_settings row exists, create if it doesn't
        logger.info('Fetching existing user_settings', {
          requestId,
          userId: session.metadata.user_id
        });

        const { data: existingSettings, error: fetchError } = await supabase
          .from('user_settings')
          .select('subscription_tier, subscription_status, stripe_subscription_id')
          .eq('user_id', session.metadata.user_id)
          .single();

        // If user_settings doesn't exist, create it
        if (fetchError && fetchError.code === 'PGRST116') {
          logger.warn('User settings not found, creating new row', {
            requestId,
            userId: session.metadata.user_id
          });

          const { error: insertError } = await supabase
            .from('user_settings')
            .insert({
              user_id: session.metadata.user_id,
              subscription_tier: 'free',
              subscription_status: 'active',
            });

          if (insertError) {
            logger.error('Failed to create user_settings', {
              requestId,
              userId: session.metadata.user_id,
              error: insertError,
              code: insertError.code,
              message: insertError.message
            });
            return NextResponse.json(
              { error: 'Failed to create user settings' },
              { status: 500 }
            );
          }

          logger.info('Successfully created user_settings', {
            requestId,
            userId: session.metadata.user_id
          });
        } else if (fetchError) {
          logger.error('Error fetching user_settings', {
            requestId,
            userId: session.metadata.user_id,
            error: fetchError,
            code: fetchError.code,
            message: fetchError.message
          });
          return NextResponse.json(
            { error: 'Failed to fetch user settings' },
            { status: 500 }
          );
        } else {
          logger.info('Found existing user_settings', {
            requestId,
            userId: session.metadata.user_id,
            currentTier: existingSettings?.subscription_tier,
            currentStatus: existingSettings?.subscription_status
          });
        }

        if (
          existingSettings?.subscription_tier === 'premium' &&
          existingSettings?.subscription_status === 'active' &&
          existingSettings?.stripe_subscription_id &&
          existingSettings.stripe_subscription_id !== session.subscription
        ) {
          logger.warn('User already has active subscription', {
            requestId,
            userId: session.metadata.user_id,
            existingSubId: existingSettings.stripe_subscription_id,
            newSubId: session.subscription
          });
          return NextResponse.json(
            { error: 'User already has an active subscription' },
            { status: 400 }
          );
        }

        // Get the price ID from the session to track founding members
        logger.info('Fetching line items from Stripe', {
          requestId,
          sessionId: session.id
        });

        let lineItems;
        let priceId;
        try {
          lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          priceId = lineItems.data[0]?.price?.id;
          logger.info('Retrieved line items', {
            requestId,
            sessionId: session.id,
            priceId,
            lineItemsCount: lineItems.data.length
          });
        } catch (stripeError: any) {
          logger.error('Error fetching line items from Stripe', {
            requestId,
            sessionId: session.id,
            error: stripeError.message,
            stack: stripeError.stack
          });
          return NextResponse.json(
            { error: 'Failed to fetch checkout session line items from Stripe' },
            { status: 500 }
          );
        }

        if (!priceId) {
          logger.error('No price ID found in line items', {
            requestId,
            sessionId: session.id,
            lineItemsCount: lineItems.data.length,
          });
          return NextResponse.json(
            { error: 'Invalid checkout session line items - no price ID' },
            { status: 400 }
          );
        }

        // Get subscription details to populate start/end dates
        const subscriptionId = session.subscription as string;
        logger.info('Fetching subscription from Stripe', {
          requestId,
          subscriptionId
        });

        let subscription: Stripe.Subscription;
        let currentPeriodStart: number;
        let currentPeriodEnd: number;

        try {
          subscription = await stripe.subscriptions.retrieve(subscriptionId);

          logger.info('Retrieved subscription from Stripe', {
            requestId,
            subscriptionId,
            status: subscription.status,
            hasItems: !!subscription.items,
            itemsCount: subscription.items?.data?.length || 0,
            hasRootStart: !!(subscription as any).current_period_start,
            hasRootEnd: !!(subscription as any).current_period_end
          });

          // Try to get period dates from multiple locations (API version compatibility)
          // Newer API versions: dates at root level
          // Older API versions: dates in subscription items

          currentPeriodStart = (subscription as any).current_period_start;
          currentPeriodEnd = (subscription as any).current_period_end;

          // If not at root, try to get from first subscription item
          if (!currentPeriodStart || !currentPeriodEnd) {
            const firstItem = subscription.items?.data?.[0];

            if (firstItem) {
              currentPeriodStart = currentPeriodStart || (firstItem as any).current_period_start;
              currentPeriodEnd = currentPeriodEnd || (firstItem as any).current_period_end;

              logger.info('Period dates found in subscription item', {
                requestId,
                subscriptionId,
                itemId: firstItem.id,
                hasItemStart: !!(firstItem as any).current_period_start,
                hasItemEnd: !!(firstItem as any).current_period_end
              });
            }
          }

          // Validate period dates exist
          if (!currentPeriodStart || !currentPeriodEnd) {
            logger.error('Subscription missing period dates', {
              requestId,
              subscriptionId,
              hasRootStart: !!(subscription as any).current_period_start,
              hasRootEnd: !!(subscription as any).current_period_end,
              hasItems: !!subscription.items?.data?.length,
              subscriptionKeys: Object.keys(subscription).slice(0, 20),
              rawSubscription: JSON.stringify(subscription).substring(0, 500)
            });
            return NextResponse.json(
              { error: 'Invalid subscription data from Stripe' },
              { status: 500 }
            );
          }

          logger.info('Retrieved subscription details', {
            requestId,
            subscriptionId,
            status: subscription.status,
            currentPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
            currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString()
          });
        } catch (stripeError: any) {
          logger.error('Error fetching subscription from Stripe', {
            requestId,
            subscriptionId,
            error: stripeError.message,
            stack: stripeError.stack
          });
          return NextResponse.json(
            { error: 'Failed to fetch subscription from Stripe' },
            { status: 500 }
          );
        }

        // Period dates already extracted above (currentPeriodStart, currentPeriodEnd)
        // Update user to premium tier with subscription dates
        const updateData = {
          subscription_tier: 'premium',
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          subscription_start_date: new Date(currentPeriodStart * 1000).toISOString(),
          subscription_end_date: new Date(currentPeriodEnd * 1000).toISOString(),
        };

        logger.info('Updating user_settings to premium', {
          requestId,
          userId: session.metadata.user_id,
          updateData
        });

        const { error, data: updatedData } = await supabase
          .from('user_settings')
          .update(updateData)
          .eq('user_id', session.metadata.user_id)
          .select();

        if (error) {
          logger.error('Failed to update user_settings', {
            requestId,
            userId: session.metadata.user_id,
            error,
            errorCode: error.code,
            errorMessage: error.message,
            errorDetails: error.details,
            errorHint: error.hint
          });
          return NextResponse.json(
            { error: 'Failed to update subscription', details: error.message },
            { status: 500 }
          );
        }

        if (!updatedData || updatedData.length === 0) {
          logger.error('No rows updated - user_settings not found', {
            requestId,
            userId: session.metadata.user_id,
          });
          return NextResponse.json(
            { error: 'User settings not found' },
            { status: 404 }
          );
        }

        logger.info('✅ Successfully upgraded user to premium', {
          requestId,
          userId: session.metadata.user_id,
          priceId,
          subscriptionId,
          startDate: new Date(currentPeriodStart * 1000).toISOString(),
          endDate: new Date(currentPeriodEnd * 1000).toISOString(),
          updatedData
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;

        // Get current_period dates - try root level first, then from items
        let currentPeriodEnd = subscription.current_period_end;
        let currentPeriodStart = subscription.current_period_start;

        // If not at root level, get from first subscription item (API version 2025-09-30.clover+)
        if (!currentPeriodEnd || !currentPeriodStart) {
          const firstItem = subscription.items?.data?.[0];
          if (firstItem) {
            currentPeriodEnd = firstItem.current_period_end;
            currentPeriodStart = firstItem.current_period_start;
          }
        }

        const tier = subscription.status === 'active' ? 'premium' : 'free';

        logger.info('Processing customer.subscription.updated', {
          requestId,
          subscriptionId: subscription.id,
          status: subscription.status,
          tier,
          currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000).toISOString() : null,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
          fromItems: !subscription.current_period_end
        });

        // Validate required fields
        if (!currentPeriodEnd || !currentPeriodStart) {
          logger.error('Missing period dates in subscription update', {
            requestId,
            subscriptionId: subscription.id,
            hasCurrentPeriodEnd: !!currentPeriodEnd,
            hasCurrentPeriodStart: !!currentPeriodStart,
            hasItems: !!subscription.items?.data?.length,
            subscriptionObject: JSON.stringify(subscription).substring(0, 500)
          });
          return NextResponse.json(
            { error: 'Invalid subscription data - missing period dates' },
            { status: 400 }
          );
        }

        // Validate timestamps are valid numbers
        if (typeof currentPeriodEnd !== 'number' || typeof currentPeriodStart !== 'number') {
          logger.error('Invalid period date types in subscription update', {
            requestId,
            subscriptionId: subscription.id,
            currentPeriodEndType: typeof currentPeriodEnd,
            currentPeriodStartType: typeof currentPeriodStart,
            currentPeriodEnd,
            currentPeriodStart
          });
          return NextResponse.json(
            { error: 'Invalid subscription data - invalid period date types' },
            { status: 400 }
          );
        }

        // Update subscription tier, status, and period dates
        const { error } = await supabase
          .from('user_settings')
          .update({
            subscription_tier: tier,
            subscription_status: subscription.status,
            subscription_start_date: new Date(currentPeriodStart * 1000).toISOString(),
            subscription_end_date: new Date(currentPeriodEnd * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end || false,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          logger.error('Error updating subscription status', {
            requestId,
            subscriptionId: subscription.id,
            error,
            errorCode: error.code,
            errorMessage: error.message
          });
          return NextResponse.json(
            { error: 'Failed to update subscription status' },
            { status: 500 }
          );
        }

        logger.info('✅ Successfully updated subscription', {
          requestId,
          subscriptionId: subscription.id,
          tier,
          status: subscription.status
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;

        logger.info('Processing customer.subscription.deleted', {
          requestId,
          subscriptionId: subscription.id
        });

        const { error } = await supabase
          .from('user_settings')
          .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            cancel_at_period_end: false,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          logger.error('Error handling subscription cancellation', {
            requestId,
            subscriptionId: subscription.id,
            error,
            errorCode: error.code,
            errorMessage: error.message
          });
          return NextResponse.json(
            { error: 'Failed to cancel subscription' },
            { status: 500 }
          );
        }

        logger.info('✅ Successfully cancelled subscription', {
          requestId,
          subscriptionId: subscription.id
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;

        logger.warn('Payment failed for subscription', {
          requestId,
          subscriptionId,
          invoiceId: invoice.id,
          amountDue: invoice.amount_due
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;

        logger.info('Payment succeeded for subscription', {
          requestId,
          subscriptionId,
          invoiceId: invoice.id,
          amountPaid: invoice.amount_paid
        });
        break;
      }

      default:
        logger.info('Unhandled webhook event type', {
          requestId,
          eventType: event.type
        });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    logger.error('Fatal error processing webhook', {
      error,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}
