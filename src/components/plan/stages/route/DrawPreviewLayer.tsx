import type L from 'leaflet'
import { Marker, Polyline } from 'react-leaflet'
import { makeDrawStartIcon, makeDrawEndIcon } from '../../../map/leafletIcons'
import type { DrawState } from './routeStage.types'

const PREVIEW_COLOR = '#f0a030'
const PREVIEW_WEIGHT = 3
const PREVIEW_OPACITY = 0.9
const PREVIEW_DASH = '8 5'

type DrawPreviewLayerProps = {
  drawState: DrawState
  onPinDrag: (which: 'start' | 'end', lat: number, lng: number) => void
}

export function DrawPreviewLayer({ drawState, onPinDrag }: DrawPreviewLayerProps) {
  const showStartPin = drawState.phase === 'placing-end' || drawState.phase === 'active'
  const showEndPin = drawState.phase === 'active'

  return (<>
    {drawState.phase === 'active' && drawState.result && (
      <Polyline positions={drawState.result.path} color={PREVIEW_COLOR} weight={PREVIEW_WEIGHT} opacity={PREVIEW_OPACITY} dashArray={PREVIEW_DASH} />
    )}
    {showStartPin && 'start' in drawState && (
      <Marker
        position={drawState.start}
        icon={makeDrawStartIcon()}
        draggable={drawState.phase === 'active'}
        eventHandlers={{
          dragend(e) {
            const { lat, lng } = (e.target as L.Marker).getLatLng()
            onPinDrag('start', lat, lng)
          },
        }}
      />
    )}
    {showEndPin && drawState.phase === 'active' && (
      <Marker
        position={drawState.end}
        icon={makeDrawEndIcon()}
        draggable
        eventHandlers={{
          dragend(e) {
            const { lat, lng } = (e.target as L.Marker).getLatLng()
            onPinDrag('end', lat, lng)
          },
        }}
      />
    )}
  </>)
}
