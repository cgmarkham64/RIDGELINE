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

interface Props {
  label?: string
}

export function MoonLoader({ label }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="hiker-stage">
        <svg viewBox="0 0 220 105" width="140" height="67" className="scene-svg" aria-hidden>
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
          <g className="scene-moon">
            <circle cx="14" cy="72" r="20" fill="rgba(240,160,48,0.07)" />
            <circle cx="14" cy="72" r="12" fill="var(--amber)" />
            <circle cx="19" cy="68" r="10" fill="#181410" />
          </g>
          <path
            d="M0,105 L38,52 L58,66 L88,38 L118,58 L148,44 L175,60 L200,48 L220,105 Z"
            fill="#161210"
          />
          <path
            d="M0,105 L18,82 L38,88 L62,70 L85,78 L108,64 L132,74 L158,68 L182,78 L205,84 L220,105 Z"
            fill="#1e1a15"
          />
        </svg>
      </div>
      {label && (
        <p className="font-mono text-[9px] tracking-[0.16em] uppercase text-amber">{label}</p>
      )}
    </div>
  )
}