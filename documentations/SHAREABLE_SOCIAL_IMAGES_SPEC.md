# Shareable Social Media Images - Implementation Specification

**Status:** Not Started
**Priority:** #2 (After Percentile Ranking, Before FIRE Calculator)
**Estimated Time:** 1-2 days (MVP), 3-5 days (Enhanced)
**Strategic Value:** 🔥 **CRITICAL for viral growth**

---

## Table of Contents

1. [Strategic Rationale](#strategic-rationale)
2. [Feature Overview](#feature-overview)
3. [Technical Approaches](#technical-approaches)
4. [Design Concepts](#design-concepts)
5. [Implementation Plan](#implementation-plan)
6. [User Flow](#user-flow)
7. [Code Examples](#code-examples)
8. [Viral Growth Strategy](#viral-growth-strategy)
9. [Success Metrics](#success-metrics)
10. [Future Enhancements](#future-enhancements)

---

## Strategic Rationale

### Why This Is THE Viral Growth Engine

**Current State:**
- ✅ Percentile ranking is complete (THE killer feature)
- ✅ Screenshot-worthy UI design
- ❌ **Missing:** Professional shareable images for social media

**The Problem:**
Screenshots are good, but **designed shareable images are 10x more viral** because:
1. **Professional design** - Looks polished, not like a random screenshot
2. **Privacy-friendly** - Can hide sensitive data while showing the "flex"
3. **Platform-optimized** - Perfect dimensions for Instagram/Twitter/LinkedIn (1200x630, 1080x1080)
4. **Branded** - Every share includes Guapital branding → free marketing
5. **Emotional** - Designed to make users feel proud and want to share

**Competitive Landscape:**
- ❌ Monarch Money: No shareable images
- ❌ YNAB: No shareable images
- ❌ Rocket Money: No shareable images
- ❌ Copilot: No shareable images
- ✅ **Guapital:** Screenshot-worthy percentile + **designed shareable images** = **viral moat**

**The Opportunity:**
- **Every share = $50-100 in ad spend value** (organic reach)
- **Spotify Wrapped case study:** 60M+ social shares in 2023 (Forbes)
- **Our advantage:** We're targeting wealth-builders who LOVE to flex progress on LinkedIn/Twitter

---

## Feature Overview

### What We're Building

A **"Guapital Wrapped"** feature that generates beautiful, shareable images showcasing:
1. User's percentile rank (e.g., "Top 12%")
2. Age bracket (e.g., "Age 26-28")
3. Net worth milestone (optional, privacy-friendly)
4. Achievement badges (e.g., "First $100K", "Top 10% Club")
5. Annual growth summary (e.g., "+35% net worth growth in 2025")

### User Experience

1. User views their percentile rank in the dashboard
2. Clicks **"Share Your Rank"** button
3. Modal opens with:
   - Preview of shareable image
   - Choice of templates (Minimal, Bold, Achievement)
   - Privacy options (show/hide net worth)
   - Platform selection (Twitter, LinkedIn, Instagram, Download)
4. User customizes and shares
5. Image posts to social media with branded Guapital watermark

### Privacy-First Approach

**Default:** Share percentile + age bracket (NO exact net worth)
**Example:** "I'm in the top 15% of wealth builders my age (26-28) 🏆"

**Optional:** Show net worth ranges (e.g., "$100K-$250K") if user opts in

---

## Technical Approaches

### Option 1: Vercel OG Image Generation (RECOMMENDED ✅)

**Why This Wins:**
- Built-in Next.js support
- Edge runtime (fast, globally distributed)
- React/JSX syntax (easy to design)
- No external dependencies
- FREE on Vercel's hobby plan (up to 1,000 images/day)

**How It Works:**
```typescript
// app/api/og/percentile/route.tsx
import { ImageResponse } from '@vercel/og';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const percentile = searchParams.get('percentile');
  const age = searchParams.get('age');

  return new ImageResponse(
    (<div style={{ /* JSX styles */ }}>...</div>),
    { width: 1200, height: 630 }
  );
}
```

**Pros:**
- ✅ Serverless (no infrastructure costs)
- ✅ Fast (~200ms generation)
- ✅ Scales automatically
- ✅ Easy to design (React/Tailwind-like syntax)
- ✅ Built-in caching

**Cons:**
- ⚠️ Limited font support (need to load custom fonts)
- ⚠️ No CSS animations (static images only)

**Cost:** FREE (Vercel hobby plan: 1,000 images/day, 10,000/month)

---

### Option 2: HTML Canvas API (Client-Side)

**How It Works:**
```typescript
import html2canvas from 'html2canvas';

const generateImage = () => {
  const element = document.getElementById('share-card');
  html2canvas(element).then(canvas => {
    canvas.toBlob(blob => {
      // Download or share blob
    });
  });
};
```

**Pros:**
- ✅ No server costs
- ✅ Instant generation (no API call)
- ✅ Works offline

**Cons:**
- ⚠️ Inconsistent rendering across browsers
- ⚠️ Larger bundle size (~100KB)
- ⚠️ Slower on mobile devices

**Cost:** FREE

---

### Option 3: Puppeteer (Server-Side Screenshot)

**How It Works:**
```typescript
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(html);
const screenshot = await page.screenshot();
```

**Pros:**
- ✅ Pixel-perfect rendering
- ✅ Full CSS support

**Cons:**
- ❌ Expensive (300MB+ memory per instance)
- ❌ Slow (~2-3 seconds per image)
- ❌ Not suitable for serverless

**Cost:** $20-50/month (requires dedicated server)

---

### Recommended Approach

**Phase 1 (MVP):** Vercel OG Image Generation
**Phase 2 (Enhanced):** HTML Canvas for real-time preview + Vercel OG for final image

---

## Design Concepts

### Template 1: "Wrapped 2025" (Spotify-Inspired)

```
┌─────────────────────────────────────────┐
│                                         │
│   🏆 GUAPITAL WRAPPED 2025              │
│                                         │
│   You're in the                         │
│   TOP 12%                               │
│   of wealth builders your age           │
│                                         │
│   Age 26-28 • Net Worth Growing 📈      │
│                                         │
│   Track yours at guapital.com           │
│   [Guapital Logo]                       │
│                                         │
└─────────────────────────────────────────┘
```

**Colors:**
- Background: Dark Teal (#004D40) → Black gradient
- Accent: Vibrant Gold (#FFC107)
- Text: White (#FFFFFF)

**Dimensions:** 1200x630 (Twitter/LinkedIn optimal)

---

### Template 2: "Minimal Flex"

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│             TOP 8%                      │
│        wealth builder                   │
│                                         │
│        Age 29 • 2025                    │
│                                         │
│                                         │
│    [Guapital Logo]  guapital.com        │
│                                         │
└─────────────────────────────────────────┘
```

**Colors:**
- Background: Off-white (#F7F9F9)
- Accent: Dark Teal (#004D40)
- Text: Near-black (#12181B)

**Dimensions:** 1080x1080 (Instagram optimal)

---

### Template 3: "Achievement Badge"

```
┌─────────────────────────────────────────┐
│                                         │
│      🎯 MILESTONE UNLOCKED              │
│                                         │
│    WEALTH BUILDER ELITE                 │
│    Top 10% in Your Age Group            │
│                                         │
│    [Progress Circle: 90% filled]        │
│                                         │
│    Achieved: October 2025               │
│    Join the club at guapital.com        │
│                                         │
└─────────────────────────────────────────┘
```

**Colors:**
- Background: Gradient (Dark Teal → Vibrant Gold)
- Accent: White (#FFFFFF)
- Badge: Gold border with glow effect

**Dimensions:** 1200x630

---

### Template 4: "Year-End Summary"

```
┌─────────────────────────────────────────┐
│   YOUR 2025 WEALTH JOURNEY              │
│                                         │
│   Net Worth Growth:  +42%               │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━          │
│                                         │
│   Percentile Rank:   Top 15%            │
│   Accounts Tracked:  8                  │
│   Biggest Win:       First $100K 🎉     │
│                                         │
│   Keep building with Guapital           │
│   [Logo] guapital.com                   │
└─────────────────────────────────────────┘
```

**Colors:**
- Background: Dark mode (#12181B)
- Progress bars: Gold (#FFC107)
- Text: White with 80% opacity

**Dimensions:** 1200x630

---

## Implementation Plan

### Phase 1: MVP (1-2 days)

**Goal:** Launch basic shareable image generation with 1 template

**Tasks:**
1. ✅ Set up Vercel OG API route (`/api/og/percentile/route.tsx`)
2. ✅ Design "Wrapped 2025" template (Template 1)
3. ✅ Create `ShareButton.tsx` component
4. ✅ Integrate into `PercentileRankCard.tsx`
5. ✅ Add Twitter/LinkedIn share dialogs
6. ✅ Add download image functionality
7. ✅ Test on staging environment

**Deliverables:**
- `/api/og/percentile` endpoint (generates 1200x630 images)
- Share button in dashboard
- Twitter/LinkedIn share integration

**Success Metric:** 5% of users who view percentile rank click "Share"

---

### Phase 2: Enhanced Features (3-5 days)

**Goal:** Multiple templates, privacy controls, tracking

**Tasks:**
1. ✅ Add 3 more templates (Minimal, Achievement, Year-End)
2. ✅ Template selector modal
3. ✅ Privacy controls (show/hide net worth)
4. ✅ Instagram-optimized templates (1080x1080)
5. ✅ Custom messaging options
6. ✅ Analytics tracking (share events, download events)
7. ✅ A/B test template popularity

**Deliverables:**
- `ShareModal.tsx` with template previews
- Privacy toggle ("Show net worth" checkbox)
- Analytics dashboard (shares per template)

**Success Metric:** 10% of users share, 3% share multiple times

---

### Phase 3: Viral Optimization (1 week)

**Goal:** Maximize virality and referral attribution

**Tasks:**
1. ✅ Referral tracking (UTM parameters in shared links)
2. ✅ Social media preview optimization (Open Graph tags)
3. ✅ Milestone achievement badges ("First $100K", "Top 10%", etc.)
4. ✅ Animated GIF/MP4 versions (for TikTok/Reels)
5. ✅ Leaderboard ("Most shared this month")
6. ✅ Share-to-unlock features (Premium trial for sharing)

**Deliverables:**
- Animated shareable content
- Referral attribution system
- Gamification (share milestones)

**Success Metric:** 20%+ of new signups from social shares

---

## User Flow

### 1. View Percentile Rank

User sees their percentile rank in the dashboard:
```
┌───────────────────────────────────┐
│  You're in the TOP 12%            │
│  of wealth builders your age      │
│                                   │
│  [Learn More] [Share Your Rank]   │
└───────────────────────────────────┘
```

---

### 2. Click "Share Your Rank"

Modal opens with preview:
```
┌─────────────────────────────────────────┐
│  Share Your Progress                    │
│                                         │
│  [Image Preview]                        │
│                                         │
│  Choose a template:                     │
│  ○ Wrapped 2025  ○ Minimal  ○ Badge     │
│                                         │
│  Privacy:                               │
│  ☐ Show my net worth                    │
│                                         │
│  [Twitter] [LinkedIn] [Instagram]       │
│  [Download Image]                       │
└─────────────────────────────────────────┘
```

---

### 3. User Shares to Platform

**Twitter Example:**
```
Tweet text: "I'm in the top 12% of wealth builders my age! 🏆 Track your net worth with @guapital"
[Attached Image]
Link: https://guapital.com?ref=social_share_twitter
```

**LinkedIn Example:**
```
Post text: "Proud to share: I'm in the top 15% of wealth builders in my age group (26-28). Tracking my net worth with Guapital has been a game-changer for staying on top of my financial goals. 📈

If you're serious about building wealth, check out Guapital: https://guapital.com?ref=social_share_linkedin"
[Attached Image]
```

---

### 4. Viral Loop

1. User's friend sees shared image on social media
2. Friend clicks link → lands on Guapital with UTM tracking
3. Friend signs up (attributed to referrer)
4. Friend views their percentile rank
5. Friend shares → **VIRAL LOOP**

---

## Code Examples

### 1. Vercel OG API Route

```typescript
// app/api/og/percentile/route.tsx
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse parameters
    const percentile = searchParams.get('percentile') || '50';
    const age = searchParams.get('age') || '26-28';
    const template = searchParams.get('template') || 'wrapped';
    const showNetWorth = searchParams.get('showNetWorth') === 'true';
    const networth = searchParams.get('networth') || '$150K';

    // Template selection
    if (template === 'wrapped') {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#004D40',
              background: 'linear-gradient(135deg, #004D40 0%, #12181B 100%)',
              color: 'white',
              fontFamily: 'Inter, sans-serif',
              padding: '60px',
            }}
          >
            {/* Trophy emoji */}
            <div style={{ fontSize: 80, marginBottom: 20 }}>🏆</div>

            {/* Title */}
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: '2px',
                opacity: 0.9,
                marginBottom: 40,
              }}
            >
              GUAPITAL WRAPPED 2025
            </div>

            {/* Main message */}
            <div style={{ fontSize: 40, marginBottom: 10, opacity: 0.95 }}>
              You're in the
            </div>

            {/* Percentile (big and bold) */}
            <div
              style={{
                fontSize: 140,
                fontWeight: 'bold',
                color: '#FFC107',
                marginBottom: 10,
                textShadow: '0 4px 20px rgba(255, 193, 7, 0.3)',
              }}
            >
              TOP {percentile}%
            </div>

            {/* Subtitle */}
            <div style={{ fontSize: 36, marginBottom: 60, opacity: 0.9 }}>
              of wealth builders your age
            </div>

            {/* Details */}
            <div
              style={{
                fontSize: 28,
                opacity: 0.85,
                marginBottom: 60,
                display: 'flex',
                gap: '20px',
              }}
            >
              <span>Age {age}</span>
              <span>•</span>
              {showNetWorth ? (
                <span>{networth} Net Worth</span>
              ) : (
                <span>Net Worth Growing 📈</span>
              )}
            </div>

            {/* Footer */}
            <div style={{ fontSize: 24, opacity: 0.7 }}>
              Track yours at guapital.com
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Add more templates here (minimal, badge, etc.)

  } catch (e: any) {
    console.error(e.message);
    return new Response('Failed to generate image', { status: 500 });
  }
}
```

---

### 2. Share Button Component

```typescript
// components/percentile/ShareButton.tsx
'use client';

import { useState } from 'react';
import { ShareModal } from './ShareModal';

interface ShareButtonProps {
  percentile: number;
  ageBracket: string;
  networth: number;
}

export function ShareButton({ percentile, ageBracket, networth }: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-accent-600 transition"
      >
        Share Your Rank 🚀
      </button>

      {showModal && (
        <ShareModal
          percentile={percentile}
          ageBracket={ageBracket}
          networth={networth}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
```

---

### 3. Share Modal Component

```typescript
// components/percentile/ShareModal.tsx
'use client';

import { useState } from 'react';
import { formatCurrency } from '@/utils/formatters';

interface ShareModalProps {
  percentile: number;
  ageBracket: string;
  networth: number;
  onClose: () => void;
}

export function ShareModal({ percentile, ageBracket, networth, onClose }: ShareModalProps) {
  const [template, setTemplate] = useState<'wrapped' | 'minimal' | 'badge'>('wrapped');
  const [showNetWorth, setShowNetWorth] = useState(false);

  const generateImageUrl = () => {
    const params = new URLSearchParams({
      percentile: percentile.toString(),
      age: ageBracket,
      template,
      showNetWorth: showNetWorth.toString(),
      networth: formatCurrency(networth),
    });
    return `/api/og/percentile?${params.toString()}`;
  };

  const shareToTwitter = () => {
    const text = `I'm in the top ${percentile}% of wealth builders my age! 🏆 Track your net worth with @guapital`;
    const url = `https://guapital.com?ref=social_share_twitter`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');

    // Track analytics
    trackShareEvent('twitter', template);
  };

  const shareToLinkedIn = () => {
    const url = `https://guapital.com?ref=social_share_linkedin`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'width=550,height=420');

    trackShareEvent('linkedin', template);
  };

  const downloadImage = async () => {
    const imageUrl = generateImageUrl();
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `guapital-wrapped-2025-top-${percentile}-percent.png`;
    a.click();

    URL.revokeObjectURL(url);
    trackShareEvent('download', template);
  };

  const trackShareEvent = (platform: string, template: string) => {
    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        event_category: 'Social Share',
        event_label: platform,
        template: template,
        percentile: percentile,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-2xl w-full mx-4 bg-white rounded-2xl shadow-2xl p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Share Your Progress 🎉
        </h2>

        {/* Image preview */}
        <div className="mb-6 rounded-lg overflow-hidden border-2 border-gray-200">
          <img
            src={generateImageUrl()}
            alt="Shareable image preview"
            className="w-full"
          />
        </div>

        {/* Template selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Choose a template:
          </label>
          <div className="flex gap-3">
            {(['wrapped', 'minimal', 'badge'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  template === t
                    ? 'bg-primary-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showNetWorth}
              onChange={(e) => setShowNetWorth(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-700"
            />
            <span className="text-sm text-gray-700">
              Show my net worth ({formatCurrency(networth)})
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-500 ml-7">
            By default, we only share your percentile rank to protect your privacy.
          </p>
        </div>

        {/* Share buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={shareToTwitter}
            className="flex-1 min-w-[140px] px-6 py-3 bg-[#1DA1F2] text-white rounded-lg font-semibold hover:bg-[#1a8cd8] transition"
          >
            Share on Twitter
          </button>
          <button
            onClick={shareToLinkedIn}
            className="flex-1 min-w-[140px] px-6 py-3 bg-[#0A66C2] text-white rounded-lg font-semibold hover:bg-[#004182] transition"
          >
            Share on LinkedIn
          </button>
          <button
            onClick={downloadImage}
            className="flex-1 min-w-[140px] px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition"
          >
            Download Image
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. Integration into PercentileRankCard

```typescript
// components/percentile/PercentileRankCard.tsx (add this)
import { ShareButton } from './ShareButton';

export function PercentileRankCard({ data }: { data: PercentileData }) {
  return (
    <div className="percentile-rank-card bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          You're in the top {data.percentile}%
        </h2>
        <button onClick={() => setShowLearnMore(true)}>
          <InfoTooltip />
        </button>
      </div>

      <p className="text-gray-600 mb-6">
        of wealth builders in your age group ({data.age_bracket})
      </p>

      {/* Percentile visualization */}
      <div className="mb-8">
        {/* ... existing chart ... */}
      </div>

      {/* Add Share Button */}
      <div className="flex gap-3">
        <ShareButton
          percentile={data.percentile}
          ageBracket={data.age_bracket}
          networth={data.user_net_worth}
        />
        <button
          onClick={() => setShowLearnMore(true)}
          className="px-6 py-3 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          Learn More
        </button>
      </div>
    </div>
  );
}
```

---

## Viral Growth Strategy

### 1. Share Incentives

**Idea:** Unlock Premium features temporarily for sharing

```typescript
// After user shares
if (shareCount === 1) {
  // Unlock 7-day Premium trial
  await grantPremiumTrial(userId, 7);
  showToast('🎉 Premium unlocked for 7 days! Thanks for sharing.');
}

if (shareCount === 3) {
  // Extra 14 days
  await extendPremiumTrial(userId, 14);
  showToast('🚀 You're on fire! +14 more days of Premium.');
}
```

**Expected Impact:** 2-3x increase in share rate

---

### 2. Referral Attribution

**Track who shares and who signs up from shares:**

```typescript
// When user clicks shared link
const urlParams = new URLSearchParams(window.location.search);
const referrer = urlParams.get('ref'); // e.g., 'social_share_twitter'
const userId = urlParams.get('u'); // referring user ID (optional)

// Store in analytics
trackReferral(referrer, userId);

// Give credit to referrer
if (userId) {
  await incrementReferralCount(userId);
}
```

**Reward top referrers:** Leaderboard, free Premium, swag

---

### 3. Social Proof

**Homepage testimonial:**
```
"1,000+ users shared their progress this month"
[Gallery of blurred shareable images]
```

**Dashboard notification:**
```
"🔥 Sarah just shared her top 8% rank on Twitter!
Share yours and unlock Premium for 7 days."
```

---

### 4. Seasonal Campaigns

**Year-End "Wrapped" Campaign (December):**
- Email all users: "Your 2025 Wealth Journey is ready to share!"
- Special year-end template with annual growth stats
- Social media contest: "Best Wrapped share wins $500"

**Expected Impact:** 10-20x share volume in December

---

## Success Metrics

### Phase 1 (MVP) Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Share Rate** | 5% of users who view percentile | `shares / percentile_views` |
| **Download Rate** | 3% of users | `downloads / percentile_views` |
| **Social Impressions** | 10,000 in first month | Twitter Analytics API |
| **Referral Signups** | 2% of shares → signups | UTM tracking |

**How to Track:**
```sql
-- Track in Supabase analytics table
CREATE TABLE share_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'share_twitter', 'share_linkedin', 'download'
  template TEXT NOT NULL, -- 'wrapped', 'minimal', 'badge'
  percentile INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Phase 2 (Enhanced) Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Share Rate** | 10% of users | Improved templates + incentives |
| **Viral Coefficient** | 0.3 (3 shares → 1 signup) | `new_signups_from_shares / total_shares` |
| **Template Popularity** | A/B test winner | Track shares per template |
| **Re-share Rate** | 10% share 2+ times | `users_who_shared_multiple / total_sharers` |

---

### Phase 3 (Viral Optimization) Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Viral Coefficient** | 0.5 (2 shares → 1 signup) | Optimized copy + incentives |
| **Social Signups %** | 20% of new signups | `signups_with_ref_param / total_signups` |
| **Top Referrer Impact** | 1 user → 50+ signups | Leaderboard tracking |

---

## Future Enhancements

### Phase 4: Advanced Features (Post-Launch)

1. **Animated GIFs/Videos**
   - Use `ffmpeg` to generate 3-5 second animations
   - Perfect for TikTok, Instagram Reels, Twitter videos
   - Example: Animated counter showing percentile rank increasing

2. **Milestone Badges**
   - "First $100K" badge
   - "Top 10% Club" badge
   - "Wealth Builder Elite" badge
   - Users collect badges, share achievements

3. **Comparison Mode**
   - "You vs. Average 28-year-old"
   - Side-by-side bar chart comparing net worth
   - Highlights progress over time

4. **Story Templates**
   - Instagram/Facebook Story-optimized (1080x1920)
   - Vertical format with swipe-up CTA
   - Animated progress bars

5. **Team/Group Sharing**
   - "Our team's top 5% average!"
   - For couples tracking joint net worth
   - Leaderboard for friend groups

6. **Localization**
   - Translate templates to Spanish, French, Mandarin
   - Expand to international markets

7. **NFT Badges (Web3 Integration)**
   - Mint percentile achievements as NFTs
   - "Top 1% 2025" NFT badge
   - Trade/display on OpenSea

---

## Implementation Checklist

### Phase 1 (MVP) - 1-2 Days

- [ ] Install `@vercel/og` package (if not already installed)
- [ ] Create `/app/api/og/percentile/route.tsx`
- [ ] Design "Wrapped 2025" template (Template 1)
- [ ] Test image generation locally
- [ ] Create `ShareButton.tsx` component
- [ ] Create `ShareModal.tsx` component
- [ ] Add Twitter share integration
- [ ] Add LinkedIn share integration
- [ ] Add download image functionality
- [ ] Integrate `ShareButton` into `PercentileRankCard.tsx`
- [ ] Add analytics tracking (share events)
- [ ] Test on staging environment
- [ ] Deploy to production

### Phase 2 (Enhanced) - 3-5 Days

- [ ] Design "Minimal Flex" template (Template 2)
- [ ] Design "Achievement Badge" template (Template 3)
- [ ] Design "Year-End Summary" template (Template 4)
- [ ] Add template selector to `ShareModal`
- [ ] Add privacy toggle (show/hide net worth)
- [ ] Create Instagram-optimized templates (1080x1080)
- [ ] Add custom message editor
- [ ] Create analytics dashboard (shares per template)
- [ ] A/B test template popularity
- [ ] Optimize for mobile sharing

### Phase 3 (Viral Optimization) - 1 Week

- [ ] Add referral tracking (UTM parameters)
- [ ] Create referral attribution system
- [ ] Add share incentives (Premium trial for sharing)
- [ ] Create milestone achievement badges
- [ ] Add animated GIF/MP4 generation
- [ ] Create leaderboard ("Most shared this month")
- [ ] Optimize social media Open Graph tags
- [ ] Add re-targeting for users who viewed but didn't share

---

## Cost Analysis

### Vercel OG (Recommended)

**Free Tier:**
- 1,000 images/day = 30,000/month
- Sufficient for MVP (assumes 5% share rate × 6,000 users = 300 shares/month)

**Pro Tier ($20/month):**
- 10,000 images/day = 300,000/month
- Needed at ~5,000 users with 10% share rate

**Cost per 1,000 users:**
- Assumes 10% share rate = 100 shares/month
- 100 shares × $0.00 (free tier) = **$0/month**

**Scaling:**
- 10,000 users → ~1,000 shares/month → Still FREE
- 50,000 users → ~5,000 shares/month → $20/month Pro tier

**ROI:**
- Cost: $0-20/month
- Value: ~$5,000-50,000/month in organic reach (assuming $0.50 CPM)

---

## Competitive Analysis

| Competitor | Shareable Images | Viral Features | Notes |
|------------|------------------|----------------|-------|
| **Monarch Money** | ❌ No | ❌ No | No social sharing features |
| **YNAB** | ❌ No | ❌ No | No social sharing features |
| **Rocket Money** | ❌ No | ❌ No | No social sharing features |
| **Copilot** | ❌ No | ❌ No | No social sharing features |
| **Empower** | ❌ No | ❌ No | No social sharing features |
| **Spotify** | ✅ Yes (Wrapped) | ✅ Yes | 60M+ shares annually |
| **Duolingo** | ✅ Yes (Year in Review) | ✅ Yes | Massive viral success |
| **Strava** | ✅ Yes (Activity maps) | ✅ Yes | Athletes share workouts |
| **Goodreads** | ✅ Yes (Year in Books) | ✅ Yes | Book readers share stats |
| **Guapital** | **✅ YES (Planned)** | **✅ YES** | **First in fintech space** |

**Strategic Insight:** We'd be the **FIRST** personal finance app in this space to offer Spotify Wrapped-style shareable images. This is a **blue ocean opportunity**.

---

## Legal & Privacy Considerations

### 1. Privacy-First Design

**Default behavior:**
- ✅ Share percentile rank (relative, not absolute)
- ✅ Share age bracket (range, not exact age)
- ❌ DO NOT share exact net worth (unless user opts in)
- ❌ DO NOT share personally identifiable information

**Example safe share:**
> "I'm in the top 15% of wealth builders my age (26-28)"

**Example risky share (require opt-in):**
> "I have a net worth of $245,000"

---

### 2. Terms of Service Update

Add to `src/app/terms/page.tsx`:

```markdown
## 14. Social Sharing and User-Generated Content

When you use Guapital's shareable image features, you agree that:
- The images you generate may include your percentile rank and age bracket
- You may optionally choose to include your net worth information
- You retain all rights to images you generate
- Guapital may feature user-shared content in marketing materials (with permission)
- You will not misrepresent your financial data when sharing
```

---

### 3. Privacy Policy Update

Add to `src/app/privacy/page.tsx`:

```markdown
## 13. Shareable Social Media Images

When you use our shareable image generation feature:
- We generate images based on your percentile rank and age bracket
- Images are generated on-demand and are not stored on our servers
- You control what information appears in the image (percentile, net worth, etc.)
- Sharing is entirely optional and controlled by you
- We track share events for analytics purposes (which platform, which template)
- We do not share your images with third parties without your consent
```

---

## Conclusion

### Why This Matters

**Current State:**
- ✅ We have THE killer feature (percentile ranking)
- ❌ We're missing THE viral distribution channel (shareable images)

**With Shareable Images:**
- 🚀 Every user becomes a marketing channel
- 🚀 Organic reach grows exponentially
- 🚀 User acquisition cost drops to near-zero
- 🚀 Network effects accelerate percentile data value

**The Math:**
- 1,000 users × 10% share rate = 100 shares/month
- 100 shares × 1,000 impressions/share = 100,000 impressions/month
- 100,000 impressions × 2% click rate = 2,000 visits/month
- 2,000 visits × 10% signup rate = **200 new users/month (FREE)**

**ROI:**
- Cost: $0-20/month (Vercel OG)
- Value: 200 users/month = $19,800/year in LTV (assumes $99/year, 20% conversion)
- **989x ROI**

---

### Recommended Priority

**Original Priority:**
1. ✅ Percentile Ranking (Complete)
2. ❌ FIRE Calculator (Not Started)

**New Recommended Priority:**
1. ✅ Percentile Ranking (Complete)
2. **🚀 Shareable Social Images (THIS)** ← **DO THIS NEXT**
3. FIRE Calculator

**Rationale:**
- Shareable images **multiply the impact** of percentile ranking
- FIRE calculator is a feature, shareable images are a **growth engine**
- 1-2 days of work → exponential viral growth

---

## Next Steps

When ready to implement:
1. Review this spec document
2. Confirm template designs (or request design updates)
3. Start with Phase 1 MVP (1-2 days)
4. Test with 10-20 beta users
5. Launch publicly
6. Monitor share rate and iterate

**Questions? See:** `CLAUDE.md` for strategic context or ping the team in #product-dev.

---

**Document Version:** 1.0
**Last Updated:** October 21, 2025
**Owner:** Product Team
**Status:** Ready for Implementation