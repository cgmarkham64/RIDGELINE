import { IconX, IconCheck, IconMap } from '../../icons'
import { PermitTypeIcon, TypeChip, Field } from './PermitAtoms'
import { PERMIT_TYPES, TONE_CLS, ZONE_STATUS_CLS } from './permitsStage.constants'
import type { Permit } from './permitsStage.types'

export function PermitCard({ permit, onRemove, onViewMap, onOverrideParty }: {
  permit: Permit
  onRemove: () => void
  onViewMap: () => void
  onOverrideParty: () => void
}) {
  const t = PERMIT_TYPES[permit.type]
  const fields = Object.entries(permit.fields)

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className={`w-8 h-8 rounded-md flex items-center justify-center border shrink-0 ${TONE_CLS[t.tone]}`}>
          <PermitTypeIcon type={permit.type} size={15} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <TypeChip type={permit.type} />
            <span className="font-mono text-[9px] text-text-dim">
              party {permit.party}
              <button
                onClick={onOverrideParty}
                className="ml-1 text-amber bg-transparent border-none cursor-pointer font-mono text-[9px] p-0 hover:underline"
              >
                override
              </button>
            </span>
          </div>
          <div className="font-heading text-[14px] font-extrabold text-text leading-snug">{permit.name}</div>
          <div className="font-mono text-[9px] text-text-dim mt-0.5">{permit.agency}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onViewMap}
            className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.08em] uppercase text-text-dim hover:text-sky px-2 py-1 border border-transparent hover:border-sky-border hover:bg-sky-dim rounded transition-colors"
          >
            <IconMap size={10} /> Map
          </button>
          <button onClick={onRemove} className="text-text-dim hover:text-red p-1 transition-colors" title="Remove">
            <IconX size={14} />
          </button>
        </div>
      </div>

      {permit.type === 'lottery' && fields.length > 0 && (
        <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 4)}, 1fr)` }}>
          {fields.map(([k, v]) => <Field key={k} label={k} value={v} />)}
        </div>
      )}
      {permit.type === 'reservation' && fields.length > 0 && (
        <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 3)}, 1fr)` }}>
          {fields.map(([k, v]) => <Field key={k} label={k} value={v} />)}
        </div>
      )}
      {permit.type === 'walkup' && (
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Window opens" value="11:00 AM" />
          <Field label="Arrive by"    value="9:30 AM" />
        </div>
      )}
      {permit.type === 'selfissue' && (
        <div className="flex items-center gap-2.5 px-3 py-2 bg-pine-dim border border-pine-border rounded text-[11px] text-text-mid">
          <span className="text-pine shrink-0"><IconCheck size={12} /></span>
          No booking required — self-issue at the trailhead. We'll add a reminder.
        </div>
      )}
      {permit.type === 'zonenights' && (
        <>
          {fields.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {fields.map(([k, v]) => <Field key={k} label={k} value={v} />)}
            </div>
          )}
          <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-1.5">Zones × nights</div>
          <div className="flex flex-col gap-1">
            {(permit.zones ?? []).map(z => (
              <div
                key={z.night}
                className="grid items-center gap-2.5 px-3 py-2 bg-bg border border-border rounded grid-cols-[44px_1fr_72px]"
              >
                <span className="font-mono text-[10px] font-bold text-amber text-center py-0.5 px-1.5 bg-amber-dim border border-amber-border rounded">
                  N{z.night}
                </span>
                <span className="text-[12px]">{z.zone}</span>
                <span className={`font-mono text-[9px] text-right uppercase tracking-[0.08em] ${ZONE_STATUS_CLS[z.status]}`}>
                  {z.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      {permit.type === 'parking' && fields.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {fields.map(([k, v]) => <Field key={k} label={k} value={v} />)}
        </div>
      )}
    </div>
  )
}