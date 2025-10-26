'use client'

import { useEffect, useState } from 'react'

/**
 * Custom hook to check if a media query matches
 * @param query - The media query string (e.g., '(min-width: 1024px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Initialize media query list
    const mediaQuery = window.matchMedia(query)

    // Set initial value
    setMatches(mediaQuery.matches)

    // Define listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener (use the modern API if available, fall back to deprecated one)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener)
    } else {
      // @ts-ignore - deprecated but still needed for older browsers
      mediaQuery.addListener(listener)
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener)
      } else {
        // @ts-ignore - deprecated but still needed for older browsers
        mediaQuery.removeListener(listener)
      }
    }
  }, [query])

  // Return false during SSR to prevent hydration mismatch
  if (!mounted) {
    return false
  }

  return matches
}
