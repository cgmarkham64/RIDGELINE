import { useMemo } from 'react'
import { randomSaying } from './sayings'

interface Props {
  label?: string
}

const STARS = [
  { cx: 22, cy: 12, r: 1.4, delay: '0s' },
  { cx: 58, cy: 22, r: 1.0, delay: '1.1s' },
  { cx: 95, cy: 8, r: 1.6, delay: '0.5s' },
  { cx: 138, cy: 18, r: 1.0, delay: '1.8s' },
  { cx: 170, cy: 9, r: 1.4, delay: '0.3s' },
  { cx: 44, cy: 32, r: 0.9, delay: '2.2s' },
  { cx: 118, cy: 28, r: 1.0, delay: '0.9s' },
  { cx: 195, cy: 22, r: 1.2, delay: '1.5s' },
]

export function HikerOverlay({ label = 'Processing…' }: Props) {
  const saying = useMemo(() => randomSaying(), [])

  return (
    <div className="hiker-overlay">
      <div className="hiker-overlay__card">
        <div className="hiker-overlay__status">{label}</div>

        <div className="hiker-stage">
          {/*
            ViewBox 220×105.
            Stars and moon live in the sky (y 0–65).
            Mountains fill the bottom (y 55–105).
            The moon group starts at (14, 72) and arcs 176px rightward
            while climbing ~58px — all via CSS translate on .scene-moon.
          */}
          <svg viewBox="0 0 220 105" width="220" height="105" className="scene-svg" aria-hidden>
            {/* ── Stars ── */}
            {STARS.map((s, i) => (
              <circle
                key={i}
                cx={s.cx}
                cy={s.cy}
                r={s.r}
                fill="var(--amber)"
                className="scene-star"
                style={{ animationDelay: s.delay }}
              />
            ))}

            {/* ── Moon (crescent) — entire group translates along the arc ── */}
            <g className="scene-moon">
              {/* Soft glow halo */}
              <circle cx="14" cy="72" r="20" fill="rgba(240,160,48,0.07)" />
              {/* Moon body */}
              <circle cx="14" cy="72" r="12" fill="var(--amber)" />
              {/* Crescent cutout — offset to reveal a sliver */}
              <circle cx="19" cy="68" r="10" fill="#181410" />
            </g>

            {/* ── Back mountain range — darker, taller peaks ── */}
            <path
              d="M0,105 L38,52 L58,66 L88,38 L118,58 L148,44 L175,60 L200,48 L220,105 Z"
              fill="#161210"
            />

            {/* ── Front mountain range — lighter, lower, more jagged ── */}
            <path
              d="M0,105 L18,82 L38,88 L62,70 L85,78 L108,64 L132,74 L158,68 L182,78 L205,84 L220,105 Z"
              fill="#1e1a15"
            />
          </svg>
        </div>

        <div className="hiker-overlay__saying-wrap">
          <div className="hiker-overlay__tag">{saying.tag}</div>
          <p className="hiker-overlay__saying">"{saying.text}"</p>
        </div>
      </div>
    </div>
  )
}
