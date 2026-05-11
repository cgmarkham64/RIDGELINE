type ProgressBarTone = 'amber' | 'pine' | 'sky'

const trackColors: Record<ProgressBarTone, string> = {
  amber: 'var(--color-amber)',
  pine:  'var(--color-pine)',
  sky:   'var(--color-sky)',
}

interface ProgressBarProps {
  value: number  // 0–100
  tone?: ProgressBarTone
}

export function ProgressBar({ value, tone = 'amber' }: ProgressBarProps) {
  return (
    <div className="w-full h-1 bg-surface-2 border border-border rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-200"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: trackColors[tone] }}
      />
    </div>
  )
}