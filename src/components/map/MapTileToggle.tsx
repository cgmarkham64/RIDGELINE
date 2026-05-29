import { IconLayers } from '../icons'
import type { TileLayerKey } from './constants'

export function MapTileToggle({
  current,
  onToggle,
}: {
  current: TileLayerKey
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={`Switch to ${current === 'topo' ? 'dark' : 'topo'} map`}
      className="absolute top-3 right-3 z-1000 flex items-center gap-1.5 px-2 py-1.5 border border-border rounded-sm font-mono text-label tracking-widest uppercase text-text-dim hover:text-text transition-colors cursor-pointer"
      style={{ background: 'rgba(15,13,11,0.82)' }}
    >
      <IconLayers />
      {current === 'topo' ? 'Dark' : 'Topo'}
    </button>
  )
}