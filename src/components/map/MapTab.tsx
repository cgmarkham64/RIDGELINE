import type { Trip } from '../../types'
import { resolveStartEnd } from './constants'
import { AttributionStrip } from './MapHelpers'
import { MapControlsBar } from './MapControlsBar'
import { MapArea } from './MapArea'
import { WaypointDialogs } from './WaypointDialogs'
import { computeMapGeometry } from './mapTab.helpers'
import { useAddWaypointForm } from './useAddWaypointForm'
import { useEditWaypointForm } from './useEditWaypointForm'
import { useMapInteraction } from './useMapInteraction'
import { useMapClickHandlers } from './useMapClickHandlers'
import { useEscapeKeyDismiss } from './useEscapeKeyDismiss'

interface Props {
  trip: Trip
  onTripUpdated: (trip: Trip) => void
}

export function MapTab({ trip, onTripUpdated }: Props) {
  const geometry = computeMapGeometry(trip)
  const addForm = useAddWaypointForm(trip, geometry.waypoints, onTripUpdated)
  const editForm = useEditWaypointForm(trip, geometry.waypoints, onTripUpdated)
  const interaction = useMapInteraction()
  const handlers = useMapClickHandlers(addForm, editForm, interaction)
  useEscapeKeyDismiss(addForm, editForm, interaction)

  return (
    <div className="flex flex-col h-full">
      <MapControlsBar
        trip={trip}
        onTripUpdated={onTripUpdated}
        waypoints={geometry.waypoints}
        addMode={addForm.addMode}
        editingId={editForm.editingId}
        onAddModeStart={() => addForm.setAddMode(true)}
        onCancelAdd={addForm.cancelAdd}
        onChipSelect={(wp) => addForm.setFocusId(wp.id)}
        onChipEdit={(wp) => { addForm.cancelAdd(); editForm.startEdit(wp) }}
        onChipDelete={editForm.handleDeleteWaypoint}
      />

      <MapArea
        bounds={geometry.bounds}
        allPoints={geometry.allPoints}
        plannedLatLngs={geometry.plannedLatLngs}
        tracksWithLatLngs={geometry.tracksWithLatLngs}
        waypoints={geometry.waypoints}
        editingId={editForm.editingId}
        addMode={addForm.addMode}
        pendingLatLon={addForm.pendingLatLon}
        addFormType={addForm.addForm.type}
        focusId={addForm.focusId}
        mapRef={interaction.mapRef}
        startEnd={resolveStartEnd(geometry.plannedLatLngs, geometry.tracksWithLatLngs)}
        contextMenu={interaction.contextMenu}
        waypointContextMenu={interaction.waypointContextMenu}
        tileLayer={interaction.tileLayer}
        onTileToggle={interaction.toggleTileLayer}
        onMapClick={handlers.handleMapClick}
        onMarkerClick={handlers.handleMarkerClick}
        onMarkerContextMenu={handlers.handleMarkerContextMenu}
        onDeleteWaypoint={editForm.handleDeleteWaypoint}
        onFocusDone={() => addForm.setFocusId(null)}
        onContextMenu={handlers.handleContextMenu}
        onDismissContextMenu={() => interaction.setContextMenu(null)}
        onDismissWaypointContextMenu={() => interaction.setWaypointContextMenu(null)}
      />

      <WaypointDialogs waypoints={geometry.waypoints} addForm={addForm} editForm={editForm} />

      <AttributionStrip tileLayer={interaction.tileLayer} />
    </div>
  )
}
