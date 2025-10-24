/**
 * API Utility with Rate Limit Handling
 *
 * Custom fetch wrapper that automatically handles rate limit responses
 * and displays user-friendly toast notifications.
 */

import { toast } from 'react-hot-toast';

export interface ApiFetchOptions extends RequestInit {
  showRateLimitToast?: boolean; // Default: true
}

/**
 * Custom fetch wrapper with automatic rate limit handling
 *
 * @param url - API endpoint URL
 * @param options - Fetch options + showRateLimitToast flag
 * @returns Response object
 *
 * @example
 * const response = await apiFetch('/api/networth');
 * const data = await response.json();
 */
export async function apiFetch(
  url: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const { showRateLimitToast = true, ...fetchOptions } = options;

  try {
    const response = await fetch(url, fetchOptions);

    // Handle rate limit responses
    if (response.status === 429) {
      if (showRateLimitToast) {
        // Parse rate limit headers
        const retryAfter = response.headers.get('Retry-After');
        const resetTime = response.headers.get('X-RateLimit-Reset');

        // Calculate human-readable retry time
        let retryMessage = 'Please try again later.';
        if (retryAfter) {
          const seconds = parseInt(retryAfter, 10);
          if (seconds < 60) {
            retryMessage = `Please try again in ${seconds} seconds.`;
          } else {
            const minutes = Math.ceil(seconds / 60);
            retryMessage = `Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
          }
        } else if (resetTime) {
          const resetDate = new Date(parseInt(resetTime, 10));
          const now = new Date();
          const secondsUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / 1000);
          if (secondsUntilReset < 60) {
            retryMessage = `Please try again in ${secondsUntilReset} seconds.`;
          } else {
            const minutes = Math.ceil(secondsUntilReset / 60);
            retryMessage = `Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
          }
        }

        // Show user-friendly toast
        toast.error(
          `Rate limit exceeded. ${retryMessage}`,
          {
            duration: 5000,
            icon: '⏱️',
          }
        );
      }

      // Return the response so caller can handle it
      return response;
    }

    return response;
  } catch (error) {
    // Network errors, etc.
    throw error;
  }
}

/**
 * Convenience wrapper for GET requests
 */
export async function apiGet(url: string, options: ApiFetchOptions = {}) {
  return apiFetch(url, { ...options, method: 'GET' });
}

/**
 * Convenience wrapper for POST requests
 */
export async function apiPost(
  url: string,
  body?: any,
  options: ApiFetchOptions = {}
) {
  return apiFetch(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience wrapper for PUT requests
 */
export async function apiPut(
  url: string,
  body?: any,
  options: ApiFetchOptions = {}
) {
  return apiFetch(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience wrapper for DELETE requests
 */
export async function apiDelete(url: string, options: ApiFetchOptions = {}) {
  return apiFetch(url, { ...options, method: 'DELETE' });
}
