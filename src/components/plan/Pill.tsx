type PillTone = 'amber' | 'sky' | 'pine' | 'red' | ''

const toneClasses: Record<PillTone, string> = {
  amber: 'text-amber border-amber-border bg-amber-dim',
  sky:   'text-sky border-sky-border bg-sky-dim',
  pine:  'text-pine border-pine-border bg-pine-dim',
  red:   'text-red border-red-border bg-red-dim',
  '':    'text-text-mid border-border bg-surface-2',
}

export function Pill({ tone = '' as PillTone, children }: { tone?: PillTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full border ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}