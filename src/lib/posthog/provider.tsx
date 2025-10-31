'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

if (typeof window !== 'undefined') {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified_only', // Only create profiles for identified users
      capture_pageview: false, // We'll capture pageviews manually
      capture_pageleave: true,
      autocapture: true, // Auto-capture clicks, form submissions
      session_recording: {
        maskAllInputs: true, // Mask sensitive input fields
        maskTextSelector: '[data-sensitive]', // Additional masking
      },
    });
  } else {
    console.error('❌ PostHog not initialized - missing environment variables');
    console.error('NEXT_PUBLIC_POSTHOG_KEY:', process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'Set' : 'Missing');
    console.error('NEXT_PUBLIC_POSTHOG_HOST:', process.env.NEXT_PUBLIC_POSTHOG_HOST ? 'Set' : 'Missing');
  }
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
