import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// POST /api/stripe/create-checkout - Create a Stripe checkout session
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has an active premium subscription
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('subscription_tier, subscription_status, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (
      userSettings?.subscription_tier === 'premium' &&
      userSettings?.subscription_status === 'active'
    ) {
      return NextResponse.json(
        { error: 'You already have an active premium subscription' },
        { status: 400 }
      );
    }

    // Get the base URL from the request or environment variable
    const baseUrl = process.env.NEXT_PUBLIC_ENV_URL ||
                    `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host') || 'localhost:3000'}`;

    const { priceType } = await request.json();

    // Validate priceType
    if (!['monthly', 'annual', 'founding'].includes(priceType)) {
      return NextResponse.json(
        { error: 'Invalid price type. Must be: monthly, annual, or founding' },
        { status: 400 }
      );
    }

    // Check founding member availability
    let priceId: string;
    if (priceType === 'founding') {
      const { count } = await supabase
        .from('user_settings')
        .select('user_id', { count: 'exact', head: true })
        .eq('subscription_tier', 'premium')
        .eq('stripe_price_id', process.env.STRIPE_PRICE_FOUNDING);

      const slotsAvailable = (count || 0) < 1000;

      if (!slotsAvailable) {
        return NextResponse.json(
          { error: 'Founding member slots are full. Please select annual or monthly pricing.' },
          { status: 400 }
        );
      }

      priceId = process.env.STRIPE_PRICE_FOUNDING!;
    } else if (priceType === 'annual') {
      priceId = process.env.STRIPE_PRICE_ANNUAL!;
    } else {
      priceId = process.env.STRIPE_PRICE_MONTHLY!;
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe price ID not configured for this tier' },
        { status: 500 }
      );
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
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error: any) {
    console.error('Error in POST /api/stripe/create-checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}
