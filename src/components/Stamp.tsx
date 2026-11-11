import { SHAPE_PATHS, type StampStyle } from '@/lib/stampArt'

interface StampProps {
  number: number
  style: StampStyle
  /** Short upper-case date such as "NOV 11". Empty for placeholders. */
  dateLabel?: string
  variant: 'filled' | 'empty'
}

/** Shared SVG filter that gives filled stamps a slightly rough ink edge. */
export function StampDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <filter id="stamp-ink" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" />
        </filter>
      </defs>
    </svg>
  )
}

export function Stamp({ number, style, dateLabel, variant }: StampProps) {
  const { color, shape } = style
  const filled = variant === 'filled'
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" aria-hidden="true" focusable="false">
      <g filter={filled ? 'url(#stamp-ink)' : undefined}>
        <path
          d={SHAPE_PATHS[shape]}
          fill={filled ? color : 'none'}
          fillOpacity={filled ? 0.12 : 0}
          stroke={filled ? color : '#1B2A4A'}
          strokeOpacity={filled ? 1 : 0.28}
          strokeWidth={filled ? 3 : 2}
          strokeDasharray={filled ? undefined : '5 4'}
          strokeLinejoin="round"
        />
        <circle
          cx="50"
          cy="50"
          r="33"
          fill="none"
          stroke={filled ? color : '#1B2A4A'}
          strokeOpacity={filled ? 0.85 : 0.14}
          strokeWidth="1.2"
          strokeDasharray="1.5 3"
          strokeLinecap="round"
        />
        <text
          x="50"
          y="33"
          textAnchor="middle"
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight="700"
          fontSize="6.5"
          letterSpacing="1.4"
          fill={filled ? color : '#1B2A4A'}
          fillOpacity={filled ? 1 : 0.35}
        >
          LESSON
        </text>
        <text
          x="50"
          y="60"
          textAnchor="middle"
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight="700"
          fontSize="27"
          fill={filled ? color : '#1B2A4A'}
          fillOpacity={filled ? 1 : 0.3}
        >
          {number}
        </text>
        {filled && dateLabel ? (
          <text
            x="50"
            y="72.5"
            textAnchor="middle"
            fontFamily="'Space Grotesk', sans-serif"
            fontWeight="700"
            fontSize="6.5"
            letterSpacing="1"
            fill={color}
          >
            {dateLabel}
          </text>
        ) : null}
      </g>
    </svg>
  )
}
