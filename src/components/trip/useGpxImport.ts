import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import type { Trip, GpxTrackEntry } from '../../types'
import type { ImportTarget } from './gpxMapSection.helpers'
import type { TileLayerKey } from '../map/constants'
import { importGpxFile, removePlannedGpx, removeGpxTrack } from './gpxMapSection.actions'

export function useGpxImport(trip: Trip, gpxTracks: GpxTrackEntry[], onTripUpdated: (trip: Trip) => void) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingTarget = useRef<ImportTarget | null>(null)

  const [importing, setImporting] = useState<string | null>(null)
  const [removing, setRemoving]   = useState<string | null>(null)
  const [openMenu, setOpenMenu]   = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [tileLayer, setTileLayer] = useState<TileLayerKey>('topo')

  useEffect(() => {
    if (!openMenu) return
    function close() { setOpenMenu(null) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenu])

  const deps = { trip, gpxTracks, onTripUpdated, setImporting, setRemoving, setError }

  function openPicker(target: ImportTarget) { pendingTarget.current = target; fileInputRef.current?.click() }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && pendingTarget.current) await importGpxFile(file, pendingTarget.current, deps)
    pendingTarget.current = null
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removePlanned() { void removePlannedGpx(deps) }
  function removeTrack(id: string) { void removeGpxTrack(id, deps) }
  function toggleTileLayer() { setTileLayer(k => k === 'topo' ? 'dark' : 'topo') }

  return {
    fileInputRef, importing, removing, openMenu, setOpenMenu, error, tileLayer,
    openPicker, handleFileChange, removePlanned, removeTrack, toggleTileLayer,
  }
}
