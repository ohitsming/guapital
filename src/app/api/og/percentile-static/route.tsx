import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Simple number formatter for edge runtime (toLocaleString not available)
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const percentile = searchParams.get('percentile') || '50'
  const age = searchParams.get('age') || '30'
  const showNetWorth = searchParams.get('showNetWorth') === 'true'
  const netWorth = searchParams.get('netWorth')

  const percentileNum = parseInt(percentile)
  const progressWidth = 100 - percentileNum // Top 15% = 85% progress

  const logoUrl = `${origin}/logo.png`

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#004D40',
          color: '#F7F9F9',
          padding: '60px',
        }}
      >
        {/* Logo at top - Actual dimensions: 3148x1020, scaled proportionally */}
        <img
          src={logoUrl}
          width={500}
          height={162}
          style={{
            marginBottom: '60px',
            filter: 'brightness(0) invert(1)',
          }}
        />

        {/* Main Content - centered */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 120,
              fontWeight: 'bold',
              color: '#FFC107',
              lineHeight: 1,
            }}
          >
            TOP {percentile}%
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 36,
              marginTop: 20,
              opacity: 0.9,
            }}
          >
            for {age} year olds
          </div>

          {/* Optional: Net Worth */}
          {showNetWorth && netWorth && (
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                marginTop: 32,
                opacity: 0.7,
              }}
            >
              ${formatNumber(parseInt(netWorth))} net worth
            </div>
          )}

          {/* Progress Bar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 80,
            }}
          >
            <div
              style={{
                width: 500,
                height: 16,
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: `${progressWidth}%`,
                  height: '100%',
                  background: '#FFC107',
                  borderRadius: 8,
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 20,
                marginTop: 20,
                opacity: 0.5,
              }}
            >
              Your position
            </div>
          </div>
        </div>

        {/* Tagline at bottom */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            fontSize: 20,
            opacity: 0.6,
          }}
        >
          Net Worth Percentile Tracker
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
