import { useCallback, useRef, useState } from 'react'
import type L from 'leaflet'
import type { Waypoint } from '../../types'

export function useMapInteraction() {
  const [contextMenu, setContextMenu] = useState<{ lat: number; lon: number; x: number; y: number } | null>(null)
  const [waypointContextMenu, setWaypointContextMenu] = useState<{ wp: Waypoint; x: number; y: number } | null>(null)
  const [tileLayer, setTileLayer] = useState<'topo' | 'dark'>('topo')
  const mapRef = useRef<L.Map | null>(null)

  const dismissMenus = useCallback(() => {
    setContextMenu(null)
    setWaypointContextMenu(null)
  }, [])
  function openContextMenu(lat: number, lon: number, x: number, y: number) {
    setWaypointContextMenu(null)
    setContextMenu({ lat, lon, x, y })
  }
  function openWaypointContextMenu(wp: Waypoint, x: number, y: number) {
    setContextMenu(null)
    setWaypointContextMenu({ wp, x, y })
  }
  function toggleTileLayer() {
    setTileLayer(k => k === 'topo' ? 'dark' : 'topo')
  }

  return {
    contextMenu, setContextMenu, waypointContextMenu, setWaypointContextMenu, tileLayer, mapRef,
    dismissMenus, openContextMenu, openWaypointContextMenu, toggleTileLayer,
  }
}
