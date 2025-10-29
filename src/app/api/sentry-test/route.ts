import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    if (type === 'error') {
      throw new Error('Test server-side error from Sentry test API');
    }

    if (type === 'custom') {
      Sentry.captureMessage('Test server-side custom message', 'info');
      return NextResponse.json({
        success: true,
        message: 'Custom server event sent to Sentry'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Sentry test API is working'
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Server error captured by Sentry' },
      { status: 500 }
    );
  }
}
