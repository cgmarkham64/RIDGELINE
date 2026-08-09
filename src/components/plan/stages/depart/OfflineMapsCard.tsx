import { IconCheck, IconCircle, IconDownload } from '../../../icons'
import type { MapLayer } from './departStage.constants'

export function OfflineMapsCard({ mapLayers, readyCount, onDownload }: {
  mapLayers: MapLayer[]
  readyCount: number
  onDownload: (i: number) => void
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Offline maps</span>
        <span className="font-mono text-label text-text-dim">cached to all phones</span>
        <span className={`ml-auto font-mono text-caption ${readyCount === mapLayers.length ? 'text-pine' : 'text-amber'}`}>
          {readyCount} of {mapLayers.length} ready
        </span>
      </div>
      {mapLayers.map((m, i) => (
        <div
          key={m.name}
          className={`grid items-center gap-2.5 py-2 ${i < mapLayers.length - 1 ? 'border-b border-border' : ''}`}
          style={{ gridTemplateColumns: '18px 1fr auto' }}
        >
          <span className={m.ok ? 'text-pine' : 'text-amber'}>
            {m.ok ? <IconCheck size={12} /> : <IconCircle size={12} />}
          </span>
          <div className="min-w-0">
            <div className="text-[11.5px] font-semibold text-text leading-snug">{m.name}</div>
            <div className="font-mono text-label text-text-dim mt-0.5">{m.size}</div>
          </div>
          {!m.ok && (
            <button
              type="button"
              onClick={() => onDownload(i)}
              className="inline-flex items-center gap-1.5 font-heading text-label font-bold tracking-[0.08em] uppercase px-2 py-1 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer whitespace-nowrap"
            >
              <IconDownload /> Download
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
