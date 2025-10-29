import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface TrackShareRequest {
  eventType: 'initiated' | 'completed' | 'clicked'
  shareType: 'static' | 'progress' | 'annual' | 'milestone' | 'streak'
  platform?: 'twitter' | 'linkedin' | 'instagram' | 'reddit' | 'copy_link'

  percentile: number
  age: number

  // Progress data (for progress shares)
  startPercentile?: number
  endPercentile?: number
  deltaPercentile?: number
  timePeriod?: '1mo' | '3mo' | '6mo' | '12mo'
  netWorthGrowth?: number

  // Privacy settings
  includedNetWorth: boolean
  anonymous: boolean

  // A/B testing
  shareCardVariant: 'minimalist' | 'dataviz' | 'badge'
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: TrackShareRequest = await request.json()

    // Validate required fields
    if (!body.eventType || !body.shareType || !body.percentile || !body.age) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert share event
    const { error } = await supabase
      .from('share_events')
      .insert({
        user_id: user.id,
        event_type: body.eventType,
        share_type: body.shareType,
        platform: body.platform || null,
        percentile: Math.round(body.percentile),
        percentile_precise: body.percentile,
        age: body.age,
        start_percentile: body.startPercentile ? Math.round(body.startPercentile) : null,
        end_percentile: body.endPercentile ? Math.round(body.endPercentile) : null,
        delta_percentile: body.deltaPercentile || null,
        time_period: body.timePeriod || null,
        net_worth_growth: body.netWorthGrowth || null,
        included_net_worth: body.includedNetWorth,
        anonymous: body.anonymous,
        share_card_variant: body.shareCardVariant
      })

    if (error) {
      console.error('Error tracking share:', error)
      return NextResponse.json(
        { error: 'Failed to track share event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in share tracking:', error)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
