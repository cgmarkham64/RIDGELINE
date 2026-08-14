import { IconCheck } from '../icons'

interface RingProps {
  done: number
  total: number
  size?: number
  blocked?: boolean
  highlight?: boolean
}

export function Ring({ done, total, size = 28, blocked = false, highlight = false }: RingProps) {
  const pct = blocked ? 1 : total === 0 ? 0 : Math.max(0, Math.min(1, done / total))
  const r = size / 2 - 2
  const c = 2 * Math.PI * r
  const tone =
    blocked
      ? 'var(--color-red)'
      : done >= total && total > 0
        ? 'var(--color-pine)'
        : done > 0
          ? 'var(--color-amber)'
          : 'var(--color-text-dim)'

  return (
    <span
      style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg
        width={size}
        height={size}
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={2} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={tone} strokeWidth={2}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 220ms' }}
        />
      </svg>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, color: tone,
        background: highlight ? 'var(--color-pine-glow)' : 'transparent',
        borderRadius: 99, padding: '0 2px',
      }}>
        {blocked ? '!' : done >= total && total > 0
          ? <IconCheck size={11} strokeWidth={2.6} />
          : `${done}/${total}`}
      </span>
    </span>
  )
}