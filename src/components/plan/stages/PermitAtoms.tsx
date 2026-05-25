import type { PermitTypeName } from '../types'
import { PERMIT_TYPES, TONE_CLS } from './permitsStage.constants'

export function PermitTypeIcon({ type, size = 15 }: { type: PermitTypeName; size?: number }) {
  const base = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (type) {
    case 'lottery':
      return <svg {...base}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="12" x2="15" y2="12"/></svg>
    case 'reservation':
      return <svg {...base}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    case 'walkup':
      return <svg {...base}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    case 'selfissue':
      return <svg {...base}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    case 'zonenights':
      return <svg {...base}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    case 'hut':
      return <svg {...base}><path d="M3 21l9-15 9 15z"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="12" y1="6" x2="12" y2="21"/></svg>
    case 'parking':
      return <svg {...base}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>
    case 'fishing':
      return <svg {...base}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
    case 'vehicle':
      return <svg {...base}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
  }
}

export function TypeChip({ type }: { type: PermitTypeName }) {
  const t = PERMIT_TYPES[type]
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[9px] tracking-[0.06em] uppercase font-semibold ${TONE_CLS[t.tone]}`}>
      {t.label}
    </span>
  )
}

export function Field({ label, value, readOnly }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="font-mono text-[9px] tracking-[0.14em] uppercase text-text-dim mb-1 block">{label}</label>
      <input
        className="w-full px-2.5 py-1.5 border border-border rounded-sm text-[11px] bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors read-only:text-text-mid read-only:cursor-default"
        defaultValue={value}
        readOnly={readOnly}
      />
    </div>
  )
}