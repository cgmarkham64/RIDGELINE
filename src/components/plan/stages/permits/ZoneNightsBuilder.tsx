import { IconPlus, IconX } from '../../../icons'
import { INPUT_CLS, ZONE_STATUS_BTNS } from './freeformDialog.helpers'
import type { DraftZone } from './freeformDialog.types'

function ZoneRow({ zone, index, onUpdate, onRemove }: {
  zone: DraftZone
  index: number
  onUpdate: (patch: Partial<DraftZone>) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="font-mono text-caption font-bold text-amber text-center py-0.5 px-1.5 bg-amber-dim border border-amber-border rounded shrink-0">
        N{index + 1}
      </span>
      <input
        className={`flex-1 ${INPUT_CLS}`}
        placeholder="Zone name"
        value={zone.zone}
        onChange={(e) => onUpdate({ zone: e.target.value })}
      />
      <div className="flex gap-1 shrink-0">
        {ZONE_STATUS_BTNS.map((sb) => (
          <button
            key={sb.value}
            onClick={() => onUpdate({ status: sb.value })}
            className={`px-2 py-0.5 rounded border font-mono text-label font-bold tracking-[0.06em] uppercase transition-colors cursor-pointer ${
              zone.status === sb.value ? sb.cls : 'bg-transparent border-border text-text-dim hover:border-border-mid'
            }`}
          >
            {sb.label}
          </button>
        ))}
      </div>
      <button onClick={onRemove} className="text-text-dim hover:text-red transition-colors p-0.5 bg-transparent border-none cursor-pointer shrink-0">
        <IconX size={12} />
      </button>
    </div>
  )
}

interface ZoneNightsBuilderProps {
  zones: DraftZone[]
  onUpdate: (i: number, patch: Partial<DraftZone>) => void
  onRemove: (i: number) => void
  onAdd: () => void
}

export function ZoneNightsBuilder({ zones, onUpdate, onRemove, onAdd }: ZoneNightsBuilderProps) {
  return (
    <div>
      <label className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1.5 block">Zones × nights</label>
      {zones.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden divide-y divide-border mb-2">
          {zones.map((z, i) => (
            <ZoneRow key={i} zone={z} index={i} onUpdate={(patch) => onUpdate(i, patch)} onRemove={() => onRemove(i)} />
          ))}
        </div>
      )}
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-1 font-mono text-label text-text-dim hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0"
      >
        <IconPlus size={9} /> Add night
      </button>
    </div>
  )
}
