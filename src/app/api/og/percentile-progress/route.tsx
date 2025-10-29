import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const timePeriodLabels: Record<string, string> = {
  '1mo': '1 MONTH AGO',
  '3mo': '3 MONTHS AGO',
  '6mo': '6 MONTHS AGO',
  '12mo': '12 MONTHS AGO'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startPercentile = searchParams.get('startPercentile') || '20'
  const endPercentile = searchParams.get('endPercentile') || '15'
  const age = searchParams.get('age') || '28'
  const timePeriod = searchParams.get('timePeriod') || '3mo'
  const deltaPoints = searchParams.get('deltaPoints') || '5'

  const timeLabel = timePeriodLabels[timePeriod] || '3 MONTHS AGO'

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
        {/* Logo at top */}
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            fontWeight: 600,
            color: '#FFC107',
            marginBottom: '40px',
          }}
        >
          Guapital
        </div>

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
              fontSize: 28,
              opacity: 0.8,
            }}
          >
            MOVED UP
          </div>
          <div
            style={{
              fontSize: 80,
              fontWeight: 'bold',
              color: '#FFC107',
              marginTop: 12,
              lineHeight: 1,
            }}
          >
            {deltaPoints} PERCENTILE POINTS
          </div>

          {/* Timeline Comparison */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 60,
              gap: 48,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  opacity: 0.6,
                }}
              >
                {timeLabel}
              </div>
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 'bold',
                  marginTop: 12,
                }}
              >
                {startPercentile}%
              </div>
            </div>

            <div
              style={{
                fontSize: 64,
                color: '#FFC107',
                fontWeight: 'bold'
              }}
            >
              {'>'}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  opacity: 0.6,
                }}
              >
                TODAY
              </div>
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 'bold',
                  color: '#FFC107',
                  marginTop: 12,
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
              marginTop: 60,
              gap: 20,
            }}
          >
            <div
              style={{
                width: 450,
                height: 16,
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                display: 'flex',
              }}
            >
              <div
                style={{
                  width: `${100 - parseInt(endPercentile)}%`,
                  height: '100%',
                  background: '#FFC107',
                  borderRadius: 8,
                }}
              />
            </div>
            <div
              style={{
                fontSize: 36,
                color: '#FFC107',
                fontWeight: 'bold'
              }}
            >
              ^
            </div>
          </div>
        </div>

        {/* CTA at bottom */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            fontSize: 20,
            opacity: 0.5,
          }}
        >
          Keep building wealth
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
