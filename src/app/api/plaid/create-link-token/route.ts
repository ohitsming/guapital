import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // PREMIUM FEATURE CHECK: Plaid integration is Premium+ only
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    const tier = userSettings?.subscription_tier || 'free';

    if (tier === 'free') {
      return NextResponse.json(
        {
          error: 'Premium feature',
          message: 'Plaid account linking is only available for Premium subscribers. Upgrade to connect your bank accounts automatically.',
        },
        { status: 403 }
      );
    }

    // Validate environment configuration
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      console.error('❌ Missing Plaid credentials');
      return NextResponse.json(
        { error: 'Plaid configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Build link token configuration
    const linkTokenConfig: any = {
      user: {
        client_user_id: user.id,
      },
      client_name: 'Guapital',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    // Add webhook URL if configured (recommended for production)
    if (process.env.NEXT_PUBLIC_ENV_URL) {
      linkTokenConfig.webhook = `${process.env.NEXT_PUBLIC_ENV_URL}/api/plaid/webhook`;
    }

    // Note: redirect_uri is optional for web apps
    // Only needed if using OAuth redirect flow
    // If you get "redirect_uri not configured" error, comment out this line:
    // linkTokenConfig.redirect_uri = process.env.NEXT_PUBLIC_ENV_URL;

    console.log('🔍 Creating Plaid link token for user:', user.id);
    console.log('🔍 Plaid environment:', process.env.PLAID_ENV);

    // Create a link token for the user
    const response = await plaidClient.linkTokenCreate(linkTokenConfig);

    console.log('✅ Link token created successfully');

    return NextResponse.json({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
    });
  } catch (error: any) {
    console.error('❌ Error creating link token:', error);

    // Log detailed Plaid error if available
    if (error.response?.data) {
      console.error('Plaid Error Details:', JSON.stringify(error.response.data, null, 2));
    }

    // Return detailed error for debugging
    return NextResponse.json(
      {
        error: 'Failed to create link token',
        details: error.message,
        plaidError: error.response?.data?.error_message || null,
        plaidErrorCode: error.response?.data?.error_code || null,
      },
      { status: 500 }
    );
  }
}
