/**
 * Utility functions for percentile ranking
 */

/**
 * Triggers a percentile recalculation for the current user
 * This should be called after any net worth changes (adding/editing/deleting accounts)
 *
 * The API endpoint will:
 * - Create a net worth snapshot for today if it doesn't exist
 * - Recalculate the user's percentile ranking
 * - Update milestone achievements
 *
 * @returns Promise that resolves when recalculation is complete
 */
export async function recalculatePercentile(): Promise<void> {
  try {
    const response = await fetch('/api/percentile')

    if (!response.ok) {
      // Percentile recalculation failure should not block the app
      console.warn('Failed to recalculate percentile ranking:', response.statusText)
      return
    }

    const data = await response.json()

    // If user is not opted in, that's fine - just skip silently
    if (!data.opted_in) {
      return
    }

    // Success - percentile has been recalculated
    console.log('Percentile ranking recalculated successfully')
  } catch (error) {
    // Network or other errors should not block the app
    console.warn('Error recalculating percentile:', error)
  }
}
