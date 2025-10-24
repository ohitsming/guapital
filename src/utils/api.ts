/**
 * API Utility with Rate Limit Handling
 *
 * Custom fetch wrapper that provides rate limit information in response.
 * Components can use this to display appropriate user feedback.
 */

export interface ApiFetchOptions extends RequestInit {
  // Additional options can be added here
}

export interface RateLimitInfo {
  isRateLimited: boolean;
  retryAfter?: number; // seconds
  message?: string;
}

/**
 * Custom fetch wrapper with rate limit detection
 *
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Response object (check response.status === 429 for rate limits)
 *
 * @example
 * const response = await apiFetch('/api/networth');
 * if (response.status === 429) {
 *   const rateLimitInfo = getRateLimitInfo(response);
 *   showToast(rateLimitInfo.message, 'error');
 * }
 * const data = await response.json();
 */
export async function apiFetch(
  url: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // Network errors, etc.
    throw error;
  }
}

/**
 * Extract rate limit information from a response
 * Use this when response.status === 429
 */
export function getRateLimitInfo(response: Response): RateLimitInfo {
  if (response.status !== 429) {
    return { isRateLimited: false };
  }

  const retryAfter = response.headers.get('Retry-After');
  const resetTime = response.headers.get('X-RateLimit-Reset');

  let retryMessage = 'Please try again later.';
  let retrySeconds: number | undefined;

  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    retrySeconds = seconds;
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
    retrySeconds = secondsUntilReset;
    if (secondsUntilReset < 60) {
      retryMessage = `Please try again in ${secondsUntilReset} seconds.`;
    } else {
      const minutes = Math.ceil(secondsUntilReset / 60);
      retryMessage = `Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
    }
  }

  return {
    isRateLimited: true,
    retryAfter: retrySeconds,
    message: `Rate limit exceeded. ${retryMessage}`,
  };
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
