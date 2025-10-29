# Social Sharing Implementation Plan: Progress Tracking & Multi-Moment Strategy

**Status:** Ready for Development
**Timeline:** 2-4 weeks (Phase 2A)
**Last Updated:** January 2025

---

## Overview

This document provides detailed implementation specs for the social sharing feature with **progress tracking** as the reshareability driver.

### Key Innovation: Multi-Moment Sharing Strategy

Instead of one-time static share ("Top 15%"), create **5 shareable moments** throughout the user journey:

1. **Initial Achievement** - Static snapshot (share once)
2. **Progress Milestones** - Delta tracking (share on improvement) 🔥 **KILLER FEATURE**
3. **Annual "Year in Review"** - Spotify Wrapped style (share annually)
4. **Milestone Badges** - Threshold crossing (share on achievement)
5. **Percentile Streaks** - Consistency rewards (share on maintenance)

**Expected Impact:** 2.5x share rate increase (5-10% → 15-25%)

---

## Problem Statement

### Static Percentile = Single Share

**Concern:** "Top 15% for age 28" is shareable once, then never again (unless percentile moves significantly)

**Reality:**
- Net worth changes slowly (monthly snapshots)
- Percentile only moves 1-2 points per month (if at all)
- No reason to reshare static status
- Viral coefficient limited by one-time sharing

### Two Decimal Places = NOT the Solution

**Proposed:** "Top 14.73%" for more frequent changes

**Problems:**
- Not memorable (clunky number)
- Doesn't feel significant (14.80% → 14.73% is boring)
- Looks pedantic (not celebration-worthy)
- Still fundamentally static (just more precise)

**Verdict:** ❌ Skip two decimal places

---

## Solution: Progress Tracking as Reshareability Driver

### Research Findings

**What people actually share:**
- **Spotify Wrapped:** Year-over-year growth ("2,000 more hours listened!")
- **Strava:** Side-by-side comparison ("Your pace improved 10%")
- **Duolingo:** Weekly league promotions (Bronze → Silver → Gold)
- **Fitbit:** Annual summary of total progress

**Key Insight:** People share **PROGRESS** (movement), not **STATUS** (position)

### Implementation Strategy

**Store with Precision, Display with Simplicity:**
- Database: Store `DECIMAL(5,2)` (e.g., 14.73) for accurate calculations
- Display: Round to whole number (e.g., "Top 15%") for memorable sharing
- Progress: Calculate delta with precision, display rounded ("+5 points")

**Why This Works:**
- Precision for tracking (accurate progress measurement)
- Simplicity for sharing (memorable, screenshot-worthy)
- Best of both worlds

---

## Database Schema

### Current Schema (Already Exists)

```sql
CREATE TABLE percentile_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  percentile DECIMAL(5,2), -- e.g., 14.73
  age INTEGER,
  net_worth BIGINT,
  opted_in BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Existing index
CREATE INDEX idx_percentile_snapshots_user
  ON percentile_snapshots(user_id, created_at DESC);
```

**No schema changes needed!** ✅ Current structure already supports progress tracking.

---

### New Table: Share Events Tracking

```sql
CREATE TABLE share_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL, -- 'initiated', 'completed', 'clicked'
  share_type TEXT NOT NULL, -- 'static', 'progress', 'annual', 'milestone', 'streak'
  platform TEXT, -- 'twitter', 'linkedin', 'instagram', 'reddit', 'copy_link'

  -- Share data
  percentile INTEGER, -- Rounded for display
  percentile_precise DECIMAL(5,2), -- Original precision
  age INTEGER,

  -- Progress data (null for static shares)
  start_percentile INTEGER,
  end_percentile INTEGER,
  delta_percentile DECIMAL(5,2), -- Can be negative
  time_period TEXT, -- '1mo', '3mo', '6mo', '12mo'
  net_worth_growth BIGINT,

  -- Privacy settings
  included_net_worth BOOLEAN DEFAULT false,
  anonymous BOOLEAN DEFAULT false,

  -- A/B testing
  share_card_variant TEXT, -- 'minimalist', 'dataviz', 'badge'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own share events"
  ON share_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own share events"
  ON share_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for analytics
CREATE INDEX idx_share_events_user ON share_events(user_id, created_at DESC);
CREATE INDEX idx_share_events_type ON share_events(share_type, event_type);
CREATE INDEX idx_share_events_platform ON share_events(platform);
```

---

### New Table: Shareable Milestones (Optional - Phase 2B)

```sql
CREATE TABLE shareable_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  milestone_type TEXT NOT NULL, -- 'threshold', 'streak', 'growth'
  milestone_name TEXT NOT NULL, -- 'Top 10% Club', '12-Month Streak'

  -- Milestone data
  percentile INTEGER,
  threshold_crossed INTEGER, -- e.g., 25, 20, 15, 10, 5, 1
  streak_months INTEGER,

  -- Tracking
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  shared BOOLEAN DEFAULT false, -- Did user share this milestone?
  shared_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE shareable_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own milestones"
  ON shareable_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones"
  ON shareable_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_milestones_user ON shareable_milestones(user_id, achieved_at DESC);
```

---

## API Endpoints

### 1. GET /api/percentile/progress

**Purpose:** Calculate progress over time (1/3/6/12 months)

**Query Parameters:**
- `period`: `'1mo'` | `'3mo'` | `'6mo'` | `'12mo'` (default: `'3mo'`)

**Response:**
```typescript
interface ProgressResponse {
  current: {
    percentile: number        // Rounded (e.g., 15)
    percentilePrecise: number // Precise (e.g., 14.73)
    age: number
    netWorth: number
  }
  past: {
    percentile: number
    percentilePrecise: number
    netWorth: number
    date: string // ISO 8601
  }
  delta: {
    percentilePoints: number  // Positive = improvement
    netWorthGrowth: number    // Dollar amount
    isSignificant: boolean    // True if >= 3 points
    trend: 'improving' | 'declining' | 'stable'
  }
  timePeriod: string
  daysElapsed: number
}
```

**Implementation:**

```typescript
// app/api/percentile/progress/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '3mo'

  const periodMap = {
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '12mo': 365
  }

  const daysAgo = periodMap[period as keyof typeof periodMap]
  if (!daysAgo) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
  }

  const compareDate = new Date()
  compareDate.setDate(compareDate.getDate() - daysAgo)

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
      error: 'No percentile data. Opt in to percentile ranking first.'
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
      message: `Track your net worth for at least ${daysAgo} days to see progress`
    }, { status: 404 })
  }

  // Calculate delta
  const deltaPercentile = past.percentile - current.percentile // Positive = improvement (lower percentile is better)
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

  return NextResponse.json({
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
  })
}
```

---

### 2. POST /api/share/track

**Purpose:** Track share events (initiated, completed, clicked)

**Request Body:**
```typescript
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
```

**Implementation:**

```typescript
// app/api/share/track/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const { error } = await supabase
    .from('share_events')
    .insert({
      user_id: user.id,
      event_type: body.eventType,
      share_type: body.shareType,
      platform: body.platform,
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
    return NextResponse.json({ error: 'Failed to track share' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

---

### 3. GET /api/share/analytics

**Purpose:** Retrieve share analytics for dashboard (admin/user)

**Response:**
```typescript
interface ShareAnalytics {
  totalShares: number
  shareRate: number // % of users who shared at least once
  byType: {
    static: number
    progress: number
    annual: number
    milestone: number
    streak: number
  }
  byPlatform: {
    twitter: number
    linkedin: number
    instagram: number
    reddit: number
    copy_link: number
  }
  avgDeltaForProgressShares: number
  mostSharedTimeperiod: '1mo' | '3mo' | '6mo' | '12mo'
}
```

---

## OG Image Generation

### Static Card (Baseline)

**Route:** `/api/og/percentile-static`

**Query Parameters:**
- `percentile`: `15`
- `age`: `28`
- `showNetWorth`: `true` | `false`
- `netWorth`: `142000` (optional)

**Visual Design:**

```
┌─────────────────────────────────┐
│                                 │
│  [Guapital Logo]                │  <- Top left, 16px
│                                 │
│                                 │
│  TOP 15%                        │  <- 72pt bold, gold (#FFC107)
│  for 28 year olds               │  <- 24pt regular, off-white (#F7F9F9)
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━          │  <- Gold progress bar
│  ▲                              │
│  You                            │
│                                 │
│  Net Worth Percentile           │  <- 16pt, subtle
│                                 │
└─────────────────────────────────┘

Colors:
- Background: Dark Teal (#004D40)
- Primary: Gold (#FFC107)
- Secondary: Off-white (#F7F9F9)

Size: 1200x630 (og:image format)
```

**Implementation:**

```typescript
// app/api/og/percentile-static/route.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const percentile = searchParams.get('percentile') || '50'
  const age = searchParams.get('age') || '30'
  const showNetWorth = searchParams.get('showNetWorth') === 'true'
  const netWorth = searchParams.get('netWorth')

  const percentileNum = parseInt(percentile)
  const progressWidth = 100 - percentileNum // Top 15% = 85% progress

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#004D40',
          color: '#F7F9F9',
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            fontSize: 20,
            fontWeight: 600,
            color: '#FFC107',
          }}
        >
          Guapital
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: '#FFC107',
              letterSpacing: '-0.02em',
            }}
          >
            TOP {percentile}%
          </div>
          <div
            style={{
              fontSize: 24,
              marginTop: 10,
              color: '#F7F9F9',
            }}
          >
            for {age} year olds
          </div>

          {/* Optional: Net Worth */}
          {showNetWorth && netWorth && (
            <div
              style={{
                fontSize: 18,
                marginTop: 20,
                opacity: 0.8,
                color: '#F7F9F9',
              }}
            >
              ${parseInt(netWorth).toLocaleString()} net worth
            </div>
          )}

          {/* Progress Bar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 60,
            }}
          >
            <div
              style={{
                width: 400,
                height: 8,
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 4,
                position: 'relative',
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: `${progressWidth}%`,
                  height: '100%',
                  background: '#FFC107',
                  borderRadius: 4,
                }}
              />
            </div>
            <div
              style={{
                fontSize: 14,
                marginTop: 10,
                color: '#F7F9F9',
                opacity: 0.6,
              }}
            >
              ▲ You
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 16,
              marginTop: 80,
              opacity: 0.7,
              color: '#F7F9F9',
            }}
          >
            Net Worth Percentile Tracker
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
```

---

### Progress Card (MVP Focus) 🔥

**Route:** `/api/og/percentile-progress`

**Query Parameters:**
- `startPercentile`: `20`
- `endPercentile`: `15`
- `age`: `28`
- `timePeriod`: `3mo`
- `deltaPoints`: `5`

**Visual Design:**

```
┌─────────────────────────────────┐
│                                 │
│  [Guapital Logo]                │
│                                 │
│  MOVED UP                       │  <- 18pt, off-white
│  5 PERCENTILE POINTS            │  <- 64pt bold, gold
│                                 │
│  3 MONTHS AGO  →  TODAY         │  <- 20pt
│      20%       →   15%          │  <- 48pt bold
│                                 │
│  [━━━━━━━━━━━━⬆━━━━━━━━━━━]   │  <- Arrow shows improvement
│                                 │
│  Keep building wealth           │  <- 16pt, subtle
│                                 │
└─────────────────────────────────┘
```

**Implementation:**

```typescript
// app/api/og/percentile-progress/route.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startPercentile = searchParams.get('startPercentile') || '20'
  const endPercentile = searchParams.get('endPercentile') || '15'
  const age = searchParams.get('age') || '28'
  const timePeriod = searchParams.get('timePeriod') || '3mo'
  const deltaPoints = searchParams.get('deltaPoints') || '5'

  const timePeriodLabels = {
    '1mo': '1 MONTH AGO',
    '3mo': '3 MONTHS AGO',
    '6mo': '6 MONTHS AGO',
    '12mo': '12 MONTHS AGO'
  }

  const timeLabel = timePeriodLabels[timePeriod as keyof typeof timePeriodLabels] || '3 MONTHS AGO'

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#004D40',
          color: '#F7F9F9',
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            fontSize: 20,
            fontWeight: 600,
            color: '#FFC107',
          }}
        >
          Guapital
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: '#F7F9F9',
              opacity: 0.8,
            }}
          >
            MOVED UP
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              color: '#FFC107',
              letterSpacing: '-0.02em',
              marginTop: 5,
            }}
          >
            {deltaPoints} PERCENTILE POINTS
          </div>

          {/* Timeline Comparison */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 50,
              gap: 30,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 20, opacity: 0.7 }}>{timeLabel}</div>
              <div style={{ fontSize: 48, fontWeight: 'bold', marginTop: 10 }}>
                {startPercentile}%
              </div>
            </div>

            <div style={{ fontSize: 48, color: '#FFC107' }}>→</div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 20, opacity: 0.7 }}>TODAY</div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: '#FFC107',
                  marginTop: 10,
                }}
              >
                {endPercentile}%
              </div>
            </div>
          </div>

          {/* Progress Bar with Arrow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 50,
              gap: 10,
            }}
          >
            <div
              style={{
                width: 350,
                height: 8,
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 4,
                position: 'relative',
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: `${100 - parseInt(endPercentile)}%`,
                  height: '100%',
                  background: '#FFC107',
                  borderRadius: 4,
                }}
              />
            </div>
            <div style={{ fontSize: 24, color: '#FFC107' }}>⬆</div>
          </div>

          {/* CTA */}
          <div
            style={{
              fontSize: 16,
              marginTop: 60,
              opacity: 0.7,
              color: '#F7F9F9',
            }}
          >
            Keep building wealth
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
```

---

## Frontend Components

### 1. ShareButton Component

**Location:** `src/components/percentile/ShareButton.tsx`

```typescript
'use client'

import { useState } from 'react'
import { ShareIcon } from '@heroicons/react/24/outline'
import ShareModal from './ShareModal'

interface ShareButtonProps {
  percentile: number
  age: number
  netWorth: number
  className?: string
}

export default function ShareButton({
  percentile,
  age,
  netWorth,
  className = ''
}: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600
          text-neutral-900 rounded-lg font-medium transition-colors ${className}`}
      >
        <ShareIcon className="w-5 h-5" />
        Share
      </button>

      {showModal && (
        <ShareModal
          percentile={percentile}
          age={age}
          netWorth={netWorth}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
```

---

### 2. ShareModal Component

**Location:** `src/components/percentile/ShareModal.tsx`

```typescript
'use client'

import { useState, useMemo, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { apiPost } from '@/utils/api'

interface ShareModalProps {
  percentile: number
  age: number
  netWorth: number
  onClose: () => void
}

const captionTemplates = [
  "Making progress on my financial journey 📊",
  "Tracking my net worth with @Guapital",
  "Celebrating milestones on the path to financial independence 🎯",
]

export default function ShareModal({ percentile, age, netWorth, onClose }: ShareModalProps) {
  const [shareType, setShareType] = useState<'static' | 'progress'>('static')
  const [showNetWorth, setShowNetWorth] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const [caption, setCaption] = useState(captionTemplates[0])
  const [progressData, setProgressData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Fetch progress data
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch('/api/percentile/progress?period=3mo')
        if (res.ok) {
          const data = await res.json()
          setProgressData(data)
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err)
      }
    }
    fetchProgress()
  }, [])

  const shareUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guapital.com'

    if (shareType === 'progress' && progressData) {
      return `${baseUrl}/api/og/percentile-progress?startPercentile=${progressData.past.percentile}&endPercentile=${progressData.current.percentile}&age=${age}&timePeriod=${progressData.timePeriod}&deltaPoints=${Math.abs(Math.round(progressData.delta.percentilePoints))}`
    }

    return `${baseUrl}/api/og/percentile-static?percentile=${Math.round(percentile)}&age=${age}&showNetWorth=${showNetWorth}&netWorth=${netWorth}`
  }, [shareType, percentile, age, showNetWorth, netWorth, progressData])

  const trackShare = async (eventType: 'initiated' | 'completed', platform?: string) => {
    await apiPost('/api/share/track', {
      eventType,
      shareType,
      platform,
      percentile,
      age,
      startPercentile: progressData?.past.percentile,
      endPercentile: progressData?.current.percentile,
      deltaPercentile: progressData?.delta.percentilePoints,
      timePeriod: progressData?.timePeriod,
      netWorthGrowth: progressData?.delta.netWorthGrowth,
      includedNetWorth: showNetWorth,
      anonymous,
      shareCardVariant: 'minimalist'
    })
  }

  const handleShare = async (platform: string) => {
    await trackShare('completed', platform)

    const encodedCaption = encodeURIComponent(caption)
    const encodedUrl = encodeURIComponent(shareUrl)

    let url = ''
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedCaption}&url=${encodedUrl}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case 'reddit':
        url = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedCaption}`
        break
      case 'copy_link':
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied to clipboard!')
        return
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
    }
  }

  useEffect(() => {
    trackShare('initiated')
  }, [])

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900">Share Your Percentile</h2>

        {/* Privacy Warning */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <p className="text-sm text-amber-800">
            Sharing financial info publicly may pose security risks. Only share what you're comfortable with.
          </p>
        </div>

        {/* Share Type Selection */}
        {progressData && progressData.delta.isSignificant && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">Share Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="shareType"
                  value="static"
                  checked={shareType === 'static'}
                  onChange={(e) => setShareType('static')}
                  className="mr-2"
                />
                Current Percentile
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="shareType"
                  value="progress"
                  checked={shareType === 'progress'}
                  onChange={(e) => setShareType('progress')}
                  className="mr-2"
                />
                Progress (+{Math.abs(Math.round(progressData.delta.percentilePoints))} points)
              </label>
            </div>
          </div>
        )}

        {/* Privacy Controls */}
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showNetWorth}
              onChange={(e) => setShowNetWorth(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-neutral-700">Include net worth amount</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-neutral-700">Share anonymously (no username)</span>
          </label>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-neutral-700">Preview</h3>
          <img
            src={shareUrl}
            alt="Share card preview"
            className="w-full rounded-lg border border-neutral-200"
          />
        </div>

        {/* Caption Editor */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="w-full p-3 border border-neutral-300 rounded-lg"
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            {captionTemplates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => setCaption(template)}
                className="text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded"
              >
                {template}
              </button>
            ))}
          </div>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleShare('twitter')}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium"
          >
            Twitter
          </button>
          <button
            onClick={() => handleShare('linkedin')}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium"
          >
            LinkedIn
          </button>
          <button
            onClick={() => handleShare('reddit')}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
          >
            Reddit
          </button>
          <button
            onClick={() => handleShare('copy_link')}
            className="px-4 py-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg font-medium"
          >
            Copy Link
          </button>
        </div>
      </div>
    </Modal>
  )
}
```

---

### 3. ProgressCelebrationModal (Auto-Prompt)

**Location:** `src/components/percentile/ProgressCelebrationModal.tsx`

**Purpose:** Automatically show when significant progress detected

```typescript
'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import ShareButton from './ShareButton'

interface ProgressCelebrationModalProps {
  percentile: number
  age: number
  netWorth: number
}

export default function ProgressCelebrationModal({
  percentile,
  age,
  netWorth
}: ProgressCelebrationModalProps) {
  const [show, setShow] = useState(false)
  const [progressData, setProgressData] = useState<any>(null)

  useEffect(() => {
    const checkProgress = async () => {
      try {
        const res = await fetch('/api/percentile/progress?period=3mo')
        if (res.ok) {
          const data = await res.json()

          // Only show if significant improvement
          if (data.delta.isSignificant && data.delta.trend === 'improving') {
            setProgressData(data)
            setShow(true)
          }
        }
      } catch (err) {
        // Silently fail - user can still manually share
      }
    }

    checkProgress()
  }, [])

  if (!show || !progressData) return null

  return (
    <Modal onClose={() => setShow(false)}>
      <div className="text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-neutral-900">
          Amazing Progress!
        </h2>
        <p className="text-lg text-neutral-700">
          You've moved up <span className="font-bold text-emerald-600">
            {Math.abs(Math.round(progressData.delta.percentilePoints))} percentile points
          </span> in the last 3 months!
        </p>
        <p className="text-neutral-600">
          From {progressData.past.percentile}% → {progressData.current.percentile}%
        </p>

        <ShareButton
          percentile={percentile}
          age={age}
          netWorth={netWorth}
          className="w-full justify-center py-3 text-lg"
        />

        <button
          onClick={() => setShow(false)}
          className="text-sm text-neutral-500 hover:text-neutral-700"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  )
}
```

---

### 4. Integration into PercentileRankCard

**Location:** `src/components/percentile/PercentileRankCard.tsx`

**Add ShareButton + Auto-Celebration:**

```typescript
// Add to existing PercentileRankCard component

import ShareButton from './ShareButton'
import ProgressCelebrationModal from './ProgressCelebrationModal'

export default function PercentileRankCard({
  percentileData,
  userAge,
  userNetWorth
}: Props) {
  // ... existing code ...

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* ... existing content ... */}

      <div className="mt-6 flex gap-3">
        {/* Existing Learn More button */}
        <button onClick={openLearnMore} className="...">
          Learn More
        </button>

        {/* NEW: Share Button */}
        <ShareButton
          percentile={percentileData.percentile}
          age={userAge}
          netWorth={userNetWorth}
        />
      </div>

      {/* NEW: Auto-celebration for progress */}
      <ProgressCelebrationModal
        percentile={percentileData.percentile}
        age={userAge}
        netWorth={userNetWorth}
      />
    </div>
  )
}
```

---

## Implementation Timeline

### Week 1: Core Infrastructure (MVP)

**Day 1-2: Database + API**
- [ ] Create `share_events` table (migration)
- [ ] Build `/api/percentile/progress` endpoint
- [ ] Build `/api/share/track` endpoint
- [ ] Test progress calculation logic

**Day 3-4: OG Image Generation**
- [ ] Build `/api/og/percentile-static` route
- [ ] Build `/api/og/percentile-progress` route
- [ ] Test image generation with various parameters
- [ ] Verify og:image meta tags work on Twitter/LinkedIn

**Day 5-7: Frontend Components**
- [ ] Build `ShareButton` component
- [ ] Build `ShareModal` component
- [ ] Integrate into `PercentileRankCard`
- [ ] Test share flow end-to-end

---

### Week 2: Polish + Testing

**Day 8-10: Auto-Prompt + UX**
- [ ] Build `ProgressCelebrationModal` component
- [ ] Add logic to detect significant progress
- [ ] Test timing of auto-prompts (not too spammy)
- [ ] Add loading states, error handling

**Day 11-12: Analytics + Tracking**
- [ ] Verify share events tracked correctly
- [ ] Build basic analytics dashboard (admin view)
- [ ] Set up UTM tracking for referrals
- [ ] Test conversion attribution

**Day 13-14: QA + Launch Prep**
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Test all share platforms (Twitter, LinkedIn, Reddit)
- [ ] Verify og:image renders correctly
- [ ] Load testing (OG image generation at scale)
- [ ] Write launch announcement

---

### Week 3-4: A/B Testing + Iteration

**Day 15-21: Measure Baseline**
- Track share rate for 1 week
- Measure completion rate (initiated → completed)
- Analyze platform preference (Twitter vs LinkedIn vs Reddit)
- Calculate initial K-factor

**Day 22-28: Iterate Based on Data**
- If share rate < 5%: Test messaging, placement, timing
- If completion rate low: Simplify UX, reduce friction
- If progress shares outperform static: Make progress default
- Build variant B (data viz card) if time allows

---

## Success Metrics & KPIs

### Primary Metrics (Track Daily)

**1. Share Rate**
```sql
SELECT
  COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'initiated') AS users_who_clicked,
  (SELECT COUNT(DISTINCT user_id) FROM percentile_snapshots WHERE opted_in = true) AS total_opted_in,
  ROUND(COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'initiated')::DECIMAL /
    (SELECT COUNT(DISTINCT user_id) FROM percentile_snapshots WHERE opted_in = true) * 100, 2) AS share_rate_percent
FROM share_events
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Target:** 5-10% (good), 15%+ (great)

---

**2. Share Completion Rate**
```sql
SELECT
  COUNT(*) FILTER (WHERE event_type = 'initiated') AS initiated,
  COUNT(*) FILTER (WHERE event_type = 'completed') AS completed,
  ROUND(COUNT(*) FILTER (WHERE event_type = 'completed')::DECIMAL /
    COUNT(*) FILTER (WHERE event_type = 'initiated') * 100, 2) AS completion_rate_percent
FROM share_events
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Target:** 50%+ (indicates good UX, low friction)

---

**3. Viral Coefficient (K-factor)**
```sql
-- Calculate K-factor (estimated)
WITH share_stats AS (
  SELECT
    COUNT(DISTINCT user_id) AS users_who_shared,
    (SELECT COUNT(DISTINCT user_id) FROM percentile_snapshots WHERE opted_in = true) AS total_users,
    50 AS estimated_avg_reach, -- Update based on Twitter analytics
    (SELECT COUNT(*) FROM auth.users WHERE utm_campaign = 'percentile_share'
      AND created_at > NOW() - INTERVAL '30 days') AS referral_signups
)
SELECT
  ROUND(users_who_shared::DECIMAL / total_users, 4) AS share_rate,
  estimated_avg_reach,
  ROUND(referral_signups::DECIMAL / (users_who_shared * estimated_avg_reach), 4) AS conversion_rate_per_view,
  ROUND((users_who_shared::DECIMAL / total_users) * estimated_avg_reach *
    (referral_signups::DECIMAL / (users_who_shared * estimated_avg_reach)), 4) AS k_factor
FROM share_stats;
```

**Target:** K > 0.3 (good), K > 0.5 (great), K > 1.0 (viral)

---

### Secondary Metrics (Track Weekly)

**4. Share Type Distribution**
```sql
SELECT
  share_type,
  COUNT(*) AS shares,
  ROUND(COUNT(*)::DECIMAL / SUM(COUNT(*)) OVER () * 100, 2) AS percent_of_total
FROM share_events
WHERE event_type = 'completed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY share_type
ORDER BY shares DESC;
```

**Hypothesis:** Progress shares will outperform static shares 2:1

---

**5. Platform Preference**
```sql
SELECT
  platform,
  COUNT(*) AS shares,
  ROUND(COUNT(*)::DECIMAL / SUM(COUNT(*)) OVER () * 100, 2) AS percent_of_total
FROM share_events
WHERE event_type = 'completed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY platform
ORDER BY shares DESC;
```

**Hypothesis:** Twitter/Reddit highest for tech worker demo

---

**6. Privacy Settings**
```sql
SELECT
  COUNT(*) FILTER (WHERE included_net_worth = true) AS with_networth,
  COUNT(*) FILTER (WHERE included_net_worth = false) AS without_networth,
  COUNT(*) FILTER (WHERE anonymous = true) AS anonymous,
  ROUND(COUNT(*) FILTER (WHERE included_net_worth = false)::DECIMAL / COUNT(*) * 100, 2)
    AS percent_hiding_networth
FROM share_events
WHERE event_type = 'completed'
  AND created_at > NOW() - INTERVAL '7 days';
```

**Hypothesis:** 60%+ will hide net worth (privacy-conscious)

---

**7. Progress Time Period Preference**
```sql
SELECT
  time_period,
  COUNT(*) AS shares,
  AVG(ABS(delta_percentile)) AS avg_delta_points
FROM share_events
WHERE share_type = 'progress'
  AND event_type = 'completed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY time_period
ORDER BY shares DESC;
```

**Hypothesis:** 3-month most popular (balance of frequency + significance)

---

## Edge Cases & Error Handling

### 1. New Users (< 30 Days Historical Data)

**Problem:** Can't calculate progress without historical snapshots

**Solution:**
```typescript
// In /api/percentile/progress
if (!past) {
  return NextResponse.json({
    error: 'Not enough historical data',
    needsDays: daysAgo,
    message: `Track your net worth for at least ${daysAgo} days to see progress`,
    canShareStatic: true // Show static card only
  }, { status: 404 })
}
```

**Frontend:** Hide progress option in share modal if not enough data

---

### 2. Declining Percentile (Market Effects)

**Problem:** User net worth grew, but percentile declined (others grew faster)

**Solution:** Reframe as context, highlight absolute gains

```typescript
// In ProgressCelebrationModal
if (progressData.delta.trend === 'declining' && progressData.delta.netWorthGrowth > 0) {
  return (
    <Modal>
      <h2>Market Update</h2>
      <p>Your percentile moved from {past}% → {current}%</p>
      <p className="text-emerald-600">
        But your net worth grew ${formatCurrency(netWorthGrowth)}!
      </p>
      <p className="text-sm text-neutral-600">
        Strong market gains lifted averages across all age groups.
      </p>
      {/* Still allow sharing with context */}
    </Modal>
  )
}
```

**Don't auto-prompt** for declining percentile (only on improvement)

---

### 3. Plateau (Top Performers)

**Problem:** User at top 5%, can't improve much further

**Solution:** Celebrate consistency (streak feature, Phase 2B)

```typescript
// Check if maintained top threshold for X months
const isTopPerformer = percentile <= 10
const maintainedMonths = await calculateConsistencyStreak(userId, 10) // Stayed below 10% threshold

if (isTopPerformer && maintainedMonths >= 6) {
  // Show streak celebration instead of progress
  return {
    shareType: 'streak',
    message: `Maintained top ${percentile}% for ${maintainedMonths} months!`
  }
}
```

---

### 4. Volatility (Crypto Crashes, Stock Swings)

**Problem:** Net worth fluctuates daily, causing percentile to swing wildly

**Solution:**
- Use 30-day moving average for percentile display
- Only compare snapshots 30+ days apart for progress
- Don't trigger auto-prompts for <3 percentile point changes

```typescript
// In daily percentile snapshot job (pg_cron)
-- Calculate 30-day moving average
UPDATE percentile_snapshots
SET percentile_smoothed = (
  SELECT AVG(percentile)
  FROM percentile_snapshots ps2
  WHERE ps2.user_id = percentile_snapshots.user_id
    AND ps2.created_at >= percentile_snapshots.created_at - INTERVAL '30 days'
    AND ps2.created_at <= percentile_snapshots.created_at
)
WHERE created_at >= NOW() - INTERVAL '1 day';

-- Use percentile_smoothed for share cards
```

**Schema change:**
```sql
ALTER TABLE percentile_snapshots ADD COLUMN percentile_smoothed DECIMAL(5,2);
```

---

### 5. Rate Limiting OG Image Generation

**Problem:** OG image generation on Edge = compute cost at scale

**Solution:** Cache generated images

```typescript
// In OG image route
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cacheKey = searchParams.toString() // Use query params as cache key

  // Check cache first (use Vercel KV, Redis, or CDN)
  const cached = await cache.get(cacheKey)
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400' // 24 hours
      }
    })
  }

  // Generate image...
  const image = new ImageResponse(...)

  // Cache for 24 hours
  await cache.set(cacheKey, image, { ex: 86400 })

  return image
}
```

**Alternative:** Pre-generate common percentile images (5%, 10%, 15%, 20%, 25%, etc.)

---

## Phase 2B: Future Enhancements

**After validating MVP (Week 5+):**

### 1. Annual "Year in Review" (December Launch)

**Inspired by:** Spotify Wrapped (156M+ shares)

**Features:**
- Total net worth growth (dollar + percentage)
- Percentile movement (start → end)
- Top asset category (Investments, Real Estate, Crypto)
- Transaction count
- Biggest win (largest single-month gain)
- Total days tracked

**Visual:** Multi-slide Instagram Story format (swipeable)

**Expected share rate:** 40-50% (annual cultural moment)

---

### 2. Milestone Badge System

**Thresholds:**
- Entered Top 25% Club
- Entered Top 20% Club
- Entered Top 15% Club
- Entered Top 10% Club
- Entered Top 5% Elite
- Entered Top 1% Legends

**Visual:** Gold badge graphic, achievement unlocked messaging

**Synergy:** Phase 2 roadmap already includes milestone badges

---

### 3. Percentile Streak Rewards

**Track:** Consecutive months maintaining threshold (e.g., stayed above 85th percentile)

**Visual:** Calendar grid with gold dots (Duolingo-style)

**Messaging:** "Consistency beats intensity"

**Target audience:** High performers who plateau

---

### 4. Social Proof / Friend Network

**Feature:** "3 friends shared their percentile this month"

**Privacy:** Only show avatars of users who opted in to public sharing

**Goal:** FOMO, reduce perceived risk ("others are sharing too")

---

### 5. Referral Tracking Dashboard

**Feature:** Show user how many friends signed up from their shares

**Messaging:** "Your share helped 5 friends join Guapital!"

**Gamification:** Leaderboard of top referrers (optional, opt-in)

---

## Testing Checklist

### Unit Tests

- [ ] Progress calculation API (1/3/6/12 month periods)
- [ ] Share tracking API (insert events correctly)
- [ ] OG image generation (renders correctly)
- [ ] Edge cases (no historical data, declining percentile)

### Integration Tests

- [ ] Share flow end-to-end (click → modal → platform)
- [ ] Auto-prompt triggers on significant progress
- [ ] UTM tracking captures referrals
- [ ] Privacy controls work (hide net worth, anonymous)

### Manual QA

- [ ] Test on iOS Safari (og:image preview)
- [ ] Test on Android Chrome (og:image preview)
- [ ] Test Twitter share (card renders correctly)
- [ ] Test LinkedIn share (card renders correctly)
- [ ] Test Reddit share (card renders correctly)
- [ ] Test copy link (clipboard works)
- [ ] Test share modal on mobile (responsive)
- [ ] Test progress celebration modal (timing, non-intrusive)

### Load Testing

- [ ] OG image generation (100 concurrent requests)
- [ ] Share tracking API (1000 events/second)
- [ ] Progress calculation API (large historical datasets)

---

## Launch Plan

### Pre-Launch (1 Week Before)

- [ ] Deploy to staging, test with 10 beta users
- [ ] Collect feedback on share card designs
- [ ] Verify analytics tracking works
- [ ] Prepare announcement post (Twitter, Reddit, blog)

### Launch Day

- [ ] Deploy to production
- [ ] Announce on Twitter/LinkedIn
- [ ] Post to r/personalfinance, r/Fire (with context, not spammy)
- [ ] Email existing users (Premium first, then Free)
- [ ] Monitor error logs, Sentry alerts

### Post-Launch (Week 1-4)

- [ ] Daily share rate monitoring
- [ ] A/B test messaging ("Share" vs "Celebrate" button)
- [ ] Iterate based on analytics
- [ ] Collect user feedback (survey)

### Decision Point (End of Week 4)

**If K-factor > 0.5:**
- ✅ Double down on social sharing
- Build annual "Year in Review" feature
- Build milestone badge system
- Optimize share card designs

**If K-factor < 0.3:**
- Pivot to FIRE calculator (SEO strategy)
- Continue iterating on social sharing in background
- Test different growth channels

---

## Risk Mitigation

### Risk 1: Low Share Rate (< 5%)

**Mitigation:**
- A/B test messaging (multiple variants)
- Test placement (larger button, different color)
- Test timing (prompt right after net worth update)
- Add social proof ("127 people shared this month")

**Fallback:** Even 3% share rate = meaningful growth boost

---

### Risk 2: Privacy Backlash

**Mitigation:**
- Clear warning before sharing
- Default to hide net worth
- Anonymous mode available
- User controls everything

**Monitoring:** Track support tickets, social sentiment

---

### Risk 3: Low Referral Conversion

**Mitigation:**
- Optimize landing page for referred users
- Add social proof ("Your friend [Name] uses Guapital")
- Test CTAs ("See your percentile" vs "Track your wealth")
- Offer incentive (founding member pricing)

**Monitoring:** UTM conversion tracking

---

## Conclusion

### Why This Plan Works

1. **Solves "Share Once" Problem:** Progress tracking creates multiple shareable moments
2. **Research-Backed:** Spotify, Strava, Duolingo all use progress sharing
3. **Privacy-Focused:** User controls what's shared
4. **Low Risk:** Even modest K-factor (0.3-0.5) = significant growth
5. **Fast Feedback:** 2-4 weeks to validate, not 3-6 months (SEO)
6. **Scalable:** Zero ongoing costs (one-time build)

### Expected Outcomes

**Baseline (Static Only):**
- 5-10% share rate
- K-factor: 0.08
- 10-20 referral signups/month

**With Progress Tracking:**
- 15-25% share rate (2.5x increase)
- K-factor: 0.20-0.30
- 40-80 referral signups/month

**Stretch Goal (Annual Review):**
- 40-50% share rate (cultural moment)
- K-factor: 0.50+
- 150+ referral signups/month

### Timeline Summary

- **Week 1-2:** Build MVP (static + progress cards)
- **Week 3-4:** A/B test, measure K-factor
- **Week 5+:** Iterate or pivot based on data

**Go/No-Go Decision:** End of Week 4

---

**Ready to ship.** 🚀
