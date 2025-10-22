import { useId } from 'react'
import clsx from 'clsx'

export function Logomark({
    invert = false,
    filled = false,
    ...props
}: React.ComponentPropsWithoutRef<'svg'> & {
    invert?: boolean
    filled?: boolean
}) {
    let id = useId()
    const primaryColor = invert ? '#FFFFFF' : '#004D40'
    const accentColor = '#FFC107'

    return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={accentColor} />
                    <stop offset="100%" stopColor="#FFD54F" />
                </linearGradient>
            </defs>

            <g transform="translate(24, 24) scale(1.25) translate(-24, -24)">
                {/* Coin circle with gradient */}
                <circle
                    cx="24"
                    cy="18"
                    r="12"
                    fill={`url(#${id}-gradient)`}
                    opacity="0.9"
                />
                <circle
                    cx="24"
                    cy="18"
                    r="12"
                    stroke={primaryColor}
                    strokeWidth="2.5"
                    fill="none"
                />

                {/* Hand underneath holding the coin */}
                <path
                    d="M 10 28
                       L 10 26
                       C 10 26, 12 24, 15 24
                       L 33 24
                       C 36 24, 38 26, 38 26
                       L 38 28
                       Z"
                    fill={primaryColor}
                    stroke={primaryColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Fingers/lines of the hand */}
                <path
                    d="M 14 30 L 34 30"
                    stroke={primaryColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
                <path
                    d="M 16 34 L 32 34"
                    stroke={primaryColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
                <path
                    d="M 18 38 L 30 38"
                    stroke={primaryColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />

                {/* Dollar sign on coin */}
                <text
                    x="24"
                    y="23"
                    fontSize="14"
                    fontWeight="700"
                    textAnchor="middle"
                    fill={primaryColor}
                    fontFamily="system-ui, -apple-system, sans-serif"
                >
                    $
                </text>
            </g>
        </svg>
    )
}

export function Logo({
    className,
    invert = false,
    filled = false,
    fillOnHover = false,
    ...props
}: React.ComponentPropsWithoutRef<'svg'> & {
    invert?: boolean
    filled?: boolean
    fillOnHover?: boolean
}) {
    let id = useId()
    const primaryColor = invert ? '#FFFFFF' : '#004D40'
    const accentColor = '#FFC107'

    return (
        <svg
            viewBox="0 0 200 48"
            aria-label="Guapital"
            className={clsx(fillOnHover && 'group/logo', className)}
            {...props}
        >
            <defs>
                <linearGradient id={`${id}-logo-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={accentColor} />
                    <stop offset="100%" stopColor="#FFD54F" />
                </linearGradient>
            </defs>

            {/* Logomark - Hand holding coin */}
            <g transform="translate(24, 24) scale(1.15) translate(-24, -24)">
                {/* Coin circle with gradient */}
                <circle
                    cx="24"
                    cy="18"
                    r="12"
                    fill={`url(#${id}-logo-gradient)`}
                    opacity="0.9"
                />
                <circle
                    cx="24"
                    cy="18"
                    r="12"
                    stroke={primaryColor}
                    strokeWidth="2.5"
                    fill="none"
                />

                {/* Hand underneath holding the coin */}
                <path
                    d="M 10 28
                       L 10 26
                       C 10 26, 12 24, 15 24
                       L 33 24
                       C 36 24, 38 26, 38 26
                       L 38 28
                       Z"
                    fill={primaryColor}
                    stroke={primaryColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Fingers/lines of the hand */}
                <path
                    d="M 14 30 L 34 30"
                    stroke={primaryColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
                <path
                    d="M 16 34 L 32 34"
                    stroke={primaryColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
                <path
                    d="M 18 38 L 30 38"
                    stroke={primaryColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />

                {/* Dollar sign on coin */}
                <text
                    x="24"
                    y="23"
                    fontSize="14"
                    fontWeight="700"
                    textAnchor="middle"
                    fill={primaryColor}
                    fontFamily="system-ui, -apple-system, sans-serif"
                >
                    $
                </text>
            </g>

            {/* Wordmark "Guapital" */}
            <g transform="translate(54, 32) scale(1.15)">
                <text
                    x="0"
                    y="0"
                    fontSize="24"
                    fontWeight="700"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fill={primaryColor}
                    letterSpacing="-0.02em"
                >
                    Guapital
                </text>
            </g>
        </svg>
    )
}