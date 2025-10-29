/**
 * API endpoint for Trajectory historical data
 * Returns historical snapshots and trends
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { TrajectoryHistory, TrajectorySnapshot } from '@/lib/interfaces/trajectory'

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '365')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch historical snapshots
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('trajectory_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .lte('snapshot_date', endDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: false })
      .limit(limit)

    if (snapshotsError) {
      console.error('Error fetching trajectory snapshots:', snapshotsError)
      return NextResponse.json(
        { error: 'Failed to fetch trajectory history' },
        { status: 500 }
      )
    }

    // Calculate 30-day trends if we have enough data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const currentSnapshot = snapshots?.[0]
    const thirtyDaySnapshot = snapshots?.find(
      s => new Date(s.snapshot_date) <= thirtyDaysAgo
    )

    let trends = {
      savings_rate_change_30d: 0,
      fire_date_shift_30d: 0,
      net_worth_growth_30d: 0,
      progress_change_30d: 0,
    }

    if (currentSnapshot && thirtyDaySnapshot) {
      // Calculate savings rate change
      trends.savings_rate_change_30d =
        currentSnapshot.savings_rate - thirtyDaySnapshot.savings_rate

      // Calculate FIRE date shift (in days)
      if (currentSnapshot.projected_fire_date && thirtyDaySnapshot.projected_fire_date) {
        const currentDate = new Date(currentSnapshot.projected_fire_date)
        const oldDate = new Date(thirtyDaySnapshot.projected_fire_date)
        trends.fire_date_shift_30d =
          Math.round((oldDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      }

      // Calculate net worth growth
      trends.net_worth_growth_30d =
        currentSnapshot.current_net_worth - thirtyDaySnapshot.current_net_worth

      // Calculate progress change
      if (currentSnapshot.fire_number > 0 && thirtyDaySnapshot.fire_number > 0) {
        const currentProgress =
          (currentSnapshot.current_net_worth / currentSnapshot.fire_number) * 100
        const oldProgress =
          (thirtyDaySnapshot.current_net_worth / thirtyDaySnapshot.fire_number) * 100
        trends.progress_change_30d = currentProgress - oldProgress
      }
    }

    // Format response
    const response: TrajectoryHistory = {
      snapshots: (snapshots || []) as TrajectorySnapshot[],
      trends,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Trajectory history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trajectory history' },
      { status: 500 }
    )
  }
}