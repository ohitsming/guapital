import { createClient } from '@supabase/supabase-js'; // Changed import
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, h0n3yp0t, renderTime } = await request.json();

  // 1. Check the honeypot field
  if (h0n3yp0t) {
    // This is likely a bot. Send a generic success message to not alert the bot.
    return NextResponse.json({ message: 'Successfully added to the waitlist!' });
  }

  // 2. Time-based check
  const submissionTime = Date.now();
  if (renderTime && submissionTime - renderTime < 3000) {
    return NextResponse.json({ error: 'Submission too fast.' }, { status: 400 });
  }

  // 3. Basic email validation
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  // Initialize Supabase client with service role key to bypass RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  if (!supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceRoleKey
  );

  const { data, error } = await supabase
    .from('waitlist')
    .insert([{ email }])
    .select();

  if (error) {
    // Handle potential errors, like a duplicate email
    if (error.code === '23505') { // 23505 is the code for unique_violation
      // Still return a success-like message to prevent email enumeration
      return NextResponse.json({ message: 'This email is already on the waitlist.' }, { status: 200 });
    }
    console.error('Supabase error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Successfully added to the waitlist!', data }, { status: 201 });
}

