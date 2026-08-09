import type { Trip } from '../../types'
import { MapTileToggle } from '../map/MapTileToggle'
import { GpxImportPanel } from './GpxImportPanel'
import { GpxMapCanvas } from './GpxMapCanvas'
import { GpxTrackLegend } from './GpxTrackLegend'
import { computeGpxGeometry } from './gpxMapSection.helpers'
import { useGpxImport } from './useGpxImport'

export function GpxMapSection({
  trip,
  onTripUpdated,
  showMap = true,
  activeWaypointId,
  onWaypointClick,
}: {
  trip: Trip
  onTripUpdated: (trip: Trip) => void
  showMap?: boolean
  activeWaypointId?: string | null
  onWaypointClick?: (id: string) => void
}) {
  const geometry = computeGpxGeometry(trip)
  const gpx = useGpxImport(trip, geometry.gpxTracks, onTripUpdated)
  const { fileInputRef, handleFileChange } = gpx

  return (
    <div>
      <GpxImportPanel
        gpxPlanned={trip.gpxPlanned}
        gpxTracks={geometry.gpxTracks}
        importing={gpx.importing}
        removing={gpx.removing}
        openMenu={gpx.openMenu}
        onSetMenu={gpx.setOpenMenu}
        onOpenPicker={gpx.openPicker}
        onRemovePlanned={gpx.removePlanned}
        onRemoveTrack={gpx.removeTrack}
      />

      {gpx.error && <p className="text-fine text-red mb-2">{gpx.error}</p>}

      {showMap && geometry.hasAny && geometry.bounds ? (
        <div className="relative z-1 rounded-md overflow-hidden border border-border">
          <MapTileToggle current={gpx.tileLayer} onToggle={gpx.toggleTileLayer} />
          <GpxMapCanvas
            bounds={geometry.bounds}
            allPoints={geometry.allPoints}
            plannedLatLngs={geometry.plannedLatLngs}
            tracksWithLatLngs={geometry.tracksWithLatLngs}
            startEnd={geometry.startEnd}
            waypoints={trip.waypoints}
            activeWaypointId={activeWaypointId}
            onWaypointClick={onWaypointClick}
            tileLayer={gpx.tileLayer}
          />
          <GpxTrackLegend plannedLatLngs={geometry.plannedLatLngs} tracksWithLatLngs={geometry.tracksWithLatLngs} />
        </div>
      ) : showMap ? (
        <div className="border border-dashed border-border rounded-md px-5 py-7 text-center">
          <div className="text-2xl opacity-20 mb-1.5">🗺</div>
          <p className="font-mono text-label tracking-widest uppercase text-text-dim">Import a planned route or GPS track above to render the map</p>
        </div>
      ) : null}

      <input ref={fileInputRef} type="file" accept=".gpx" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
