import { useId } from 'react'
import { Pill } from '../../Pill'
import { IconPlus, IconX } from '../../../icons'
import { WaypointIcon } from '../../../map/WaypointIcon'
import { WAYPOINT_COLOR } from '../../../map/constants'
import { STOP_TEXT_FIELDS, COORD_DECIMAL_PLACES } from './foodStage.helpers'
import type { Waypoint } from '../../../../types'
import type { ResupplyStop } from '../../types'

const RESUPPLY_COLOR = WAYPOINT_COLOR['resupply']

export type OrderedStop = { wp: Waypoint; stop: ResupplyStop; day: number }

type ResupplyStopCardProps = {
  item: OrderedStop
  onUpdate: (waypointId: string, patch: Partial<ResupplyStop>) => void
  onRemove: (waypointId: string) => void
}

function StopHeader({ item, onUpdate, onRemove }: ResupplyStopCardProps) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span
        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${RESUPPLY_COLOR}18`, border: `1px solid ${RESUPPLY_COLOR}44` }}
      >
        <WaypointIcon type="resupply" size={16} />
      </span>
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <span className="font-heading text-body-sm font-extrabold text-text">{item.wp.label}</span>
        <span className="font-mono text-label text-text-dim">{item.wp.lat.toFixed(COORD_DECIMAL_PLACES)}, {item.wp.lon.toFixed(COORD_DECIMAL_PLACES)}</span>
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <span className="font-mono text-label text-text-dim">Day</span>
          <input
            className="w-10 bg-surface-2 border border-border rounded-sm px-1.5 py-1 font-mono text-label text-text outline-none focus:border-border-mid transition-colors text-center"
            placeholder="—"
            value={item.stop.resupplyDay}
            onChange={e => onUpdate(item.wp.id, { resupplyDay: e.target.value })}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Pill tone={item.stop.status === 'shipped' ? 'pine' : 'amber'}>
          {item.stop.status === 'shipped' ? 'Shipped' : 'Unconfirmed'}
        </Pill>
        <button
          type="button"
          onClick={() => onRemove(item.wp.id)}
          className="text-text-dim hover:text-text transition-colors cursor-pointer"
          aria-label="Remove stop"
        >
          <IconX size={14} />
        </button>
      </div>
    </div>
  )
}

function StopFields({ item, onUpdate }: { item: OrderedStop; onUpdate: ResupplyStopCardProps['onUpdate'] }) {
  const uid = useId()
  return (
    <div className="grid grid-cols-3 gap-2.5 mb-4">
      {STOP_TEXT_FIELDS.map(f => (
        <div key={f.key}>
          <label
            htmlFor={`${uid}-${item.wp.id}-${f.key}`}
            className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1 block"
          >
            {f.label}
          </label>
          <input
            id={`${uid}-${item.wp.id}-${f.key}`}
            className="w-full px-2.5 py-1.5 border border-border rounded-sm text-body-sm bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors placeholder:text-text-dim"
            placeholder={f.placeholder}
            value={item.stop[f.key]}
            onChange={e => onUpdate(item.wp.id, { [f.key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  )
}

function StopActions({ item, onUpdate }: { item: OrderedStop; onUpdate: ResupplyStopCardProps['onUpdate'] }) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button type="button" className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer">
        <IconPlus size={10} /> Generate label
      </button>
      <button
        type="button"
        onClick={() => onUpdate(item.wp.id, { status: item.stop.status === 'shipped' ? 'unconfirmed' : 'shipped' })}
        className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
      >
        {item.stop.status === 'shipped' ? 'Mark unshipped' : 'Mark shipped'}
      </button>
    </div>
  )
}

export function ResupplyStopCard({ item, onUpdate, onRemove }: ResupplyStopCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <StopHeader item={item} onUpdate={onUpdate} onRemove={onRemove} />
      <StopFields item={item} onUpdate={onUpdate} />
      <StopActions item={item} onUpdate={onUpdate} />
    </div>
  )
}
