import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface ProgressResponse {
  current: {
    percentile: number
    percentilePrecise: number
    age: number
    netWorth: number
  }
  past: {
    percentile: number
    percentilePrecise: number
    netWorth: number
    date: string
  }
  delta: {
    percentilePoints: number
    netWorthGrowth: number
    isSignificant: boolean
    trend: 'improving' | 'declining' | 'stable'
  }
  timePeriod: string
  daysElapsed: number
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '3mo'

  const periodMap: Record<string, number> = {
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '12mo': 365
  }

  const daysAgo = periodMap[period]
  if (!daysAgo) {
    return NextResponse.json({ error: 'Invalid period. Use 1mo, 3mo, 6mo, or 12mo' }, { status: 400 })
  }

  const compareDate = new Date()
  compareDate.setDate(compareDate.getDate() - daysAgo)

  try {
    // Get current percentile (most recent snapshot)
    const { data: current, error: currentError } = await supabase
      .from('percentile_snapshots')
      .select('percentile, age, net_worth')
      .eq('user_id', user.id)
      .eq('opted_in', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (currentError || !current) {
      return NextResponse.json({
        error: 'No percentile data. Opt in to percentile ranking first.',
        code: 'NO_CURRENT_DATA'
      }, { status: 404 })
    }

    // Get percentile from X months ago (closest snapshot before compareDate)
    const { data: past, error: pastError } = await supabase
      .from('percentile_snapshots')
      .select('percentile, net_worth, created_at')
      .eq('user_id', user.id)
      .lte('created_at', compareDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (pastError || !past) {
      return NextResponse.json({
        error: 'Not enough historical data',
        needsDays: daysAgo,
        message: `Track your net worth for at least ${daysAgo} days to see progress`,
        code: 'INSUFFICIENT_HISTORY',
        canShareStatic: true
      }, { status: 404 })
    }

    // Calculate delta
    // Note: Lower percentile is better (e.g., 15% = top 15%)
    // Positive delta = improvement (moved from 20% to 15%)
    const deltaPercentile = past.percentile - current.percentile
    const deltaNetWorth = current.net_worth - past.net_worth
    const isSignificant = Math.abs(deltaPercentile) >= 3 // 3+ points = notable

    let trend: 'improving' | 'declining' | 'stable'
    if (deltaPercentile > 1) {
      trend = 'improving'
    } else if (deltaPercentile < -1) {
      trend = 'declining'
    } else {
      trend = 'stable'
    }

    // Calculate actual days elapsed
    const daysElapsed = Math.floor(
      (new Date().getTime() - new Date(past.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    const response: ProgressResponse = {
      current: {
        percentile: Math.round(current.percentile),
        percentilePrecise: current.percentile,
        age: current.age,
        netWorth: current.net_worth
      },
      past: {
        percentile: Math.round(past.percentile),
        percentilePrecise: past.percentile,
        netWorth: past.net_worth,
        date: past.created_at
      },
      delta: {
        percentilePoints: deltaPercentile,
        netWorthGrowth: deltaNetWorth,
        isSignificant,
        trend
      },
      timePeriod: period,
      daysElapsed
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error calculating progress:', error)
    return NextResponse.json(
      { error: 'Failed to calculate progress' },
      { status: 500 }
    )
  }
}
