import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/ratelimit';
import { logger } from '@/utils/logger';
import type { CreateSupportRequestPayload } from '@/lib/interfaces/support';

export const dynamic = 'force-dynamic';

// POST /api/support - Create a new support request
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Rate limiting: 5 requests per minute (prevent spam)
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateLimitResult = await checkRateLimit(identifier, 'support');

    if (!rateLimitResult.success) {
      logger.warn('Support request rate limited', {
        userId: user.id,
        identifier,
        limit: rateLimitResult.limit,
        resetSeconds: rateLimitResult.resetSeconds,
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many support requests. Please try again in ${rateLimitResult.resetSeconds} seconds.`,
          retryAfter: rateLimitResult.resetSeconds,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': rateLimitResult.resetSeconds.toString(),
          },
        }
      );
    }

    // Parse request body
    const body = (await request.json()) as CreateSupportRequestPayload;

    // Validate required fields
    if (!body.type || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields: type and description' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['bug', 'feature', 'account', 'question', 'other'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: bug, feature, account, question, other' },
        { status: 400 }
      );
    }

    // Validate description length
    if (body.description.length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (body.description.length > 5000) {
      return NextResponse.json(
        { error: 'Description must be less than 5000 characters' },
        { status: 400 }
      );
    }

    // Create support request
    const { data: supportRequest, error: insertError } = await supabase
      .from('support_requests')
      .insert({
        user_id: user.id,
        email: user.email || '',
        type: body.type,
        description: body.description,
        status: 'open',
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Error creating support request', {
        userId: user.id,
        error: insertError.message,
        code: insertError.code,
      });
      return NextResponse.json(
        { error: 'Failed to create support request' },
        { status: 500 }
      );
    }

    logger.info('Support request created', {
      userId: user.id,
      requestId: supportRequest.id,
      type: body.type,
    });

    return NextResponse.json(
      {
        success: true,
        data: supportRequest,
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error) {
    logger.error('Unexpected error in support API', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET /api/support - Get user's support requests (optional, for future features)
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Fetch user's support requests
    const { data: requests, error: fetchError } = await supabase
      .from('support_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error('Error fetching support requests', {
        userId: user.id,
        error: fetchError.message,
      });
      return NextResponse.json(
        { error: 'Failed to fetch support requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    logger.error('Unexpected error in support GET API', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
