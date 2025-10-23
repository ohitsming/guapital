import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/debug/subscription - Check current user subscription status
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch settings',
        details: error,
        user_id: user.id,
        user_email: user.email,
      }, { status: 500 });
    }

    return NextResponse.json({
      user_id: user.id,
      user_email: user.email,
      settings: settings,
      has_settings_row: !!settings,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Internal error',
      details: error.message,
    }, { status: 500 });
  }
}
