import type { PermitTone } from './permitsStage.types'

const TONE_OPTS: { value: PermitTone; label: string; activeCls: string }[] = [
  { value: 'amber', label: 'Deadline', activeCls: 'bg-amber-dim border-amber-border text-amber' },
  { value: 'sky',   label: 'Booking',  activeCls: 'bg-sky-dim border-sky-border text-sky'       },
  { value: 'pine',  label: 'Info',     activeCls: 'bg-pine-dim border-pine-border text-pine'     },
]

type CriticalDateToneRowProps = {
  tone: PermitTone
  onChange: (tone: PermitTone) => void
}

export function CriticalDateToneRow({ tone, onChange }: CriticalDateToneRowProps) {
  return (
    <div className="flex gap-1.5">
      {TONE_OPTS.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`flex-1 px-2 py-1 rounded border font-mono text-label font-bold tracking-[0.08em] uppercase transition-colors cursor-pointer ${
            tone === t.value ? t.activeCls : 'bg-transparent border-border text-text-dim hover:border-border-mid'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
