import type { GpxTrackEntry } from '../../types'
import { PLANNED_COLOR } from './gpxMapSection.helpers'

export function GpxTrackLegend({ plannedLatLngs, tracksWithLatLngs }: {
  plannedLatLngs: [number, number][]
  tracksWithLatLngs: { entry: GpxTrackEntry; color: string; positions: [number, number][] }[]
}) {
  return (
    <div className="flex gap-4 px-3 py-2 bg-surface border-t border-border flex-wrap">
      {plannedLatLngs.length > 1 && (
        <div className="flex items-center gap-1.5">
          <svg width="20" height="6">
            <line x1="0" y1="3" x2="20" y2="3" stroke={PLANNED_COLOR} strokeWidth="2.5" strokeDasharray="5 3" />
          </svg>
          <span className="font-mono text-label tracking-widest uppercase text-text-dim">Planned Route</span>
        </div>
      )}
      {tracksWithLatLngs
        .filter((t) => t.positions.length > 1)
        .map(({ entry, color }) => (
          <div key={entry.id} className="flex items-center gap-1.5">
            <svg width="20" height="6">
              <line x1="0" y1="3" x2="20" y2="3" stroke={color} strokeWidth="2.5" />
            </svg>
            <span className="font-mono text-label tracking-widest uppercase text-text-dim">{entry.label}</span>
          </div>
        ))}
    </div>
  )
}
