import L from 'leaflet'
import type { WaypointType } from '../../types'
import { WAYPOINT_COLOR } from './constants'

function waypointSvgString(type: WaypointType, size: number): string {
  const c = WAYPOINT_COLOR[type]
  switch (type) {
    case 'campsite':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2L15 13H1L8 2Z" fill="${c}" opacity="0.9"/>
        <path d="M6.5 13L8 9.5L9.5 13" fill="#0f0d0b"/>
        <line x1="1" y1="13" x2="15" y2="13" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`
    case 'wildlife':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="${c}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="8" cy="11" rx="3.2" ry="2.4"/>
        <circle cx="4.8" cy="7.8" r="1.5"/>
        <circle cx="8" cy="6.8" r="1.5"/>
        <circle cx="11.2" cy="7.8" r="1.5"/>
      </svg>`
    case 'viewpoint':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="5" width="13" height="9" rx="1.5" fill="${c}" opacity="0.9"/>
        <path d="M6 5V3.5C6 3 6.5 2.5 7 2.5H9C9.5 2.5 10 3 10 3.5V5" fill="${c}" opacity="0.7"/>
        <circle cx="8" cy="9.5" r="2.8" fill="#0f0d0b"/>
        <circle cx="8" cy="9.5" r="1.6" fill="${c}" opacity="0.5"/>
      </svg>`
    case 'no-water':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2C8 2 4 7 4 10C4 12.21 5.79 14 8 14C10.21 14 12 12.21 12 10C12 7 8 2 8 2Z" fill="${c}" fill-opacity="0.25" stroke="${c}" stroke-width="1.2"/>
        <line x1="4.5" y1="4.5" x2="11.5" y2="12.5" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`
    case 'some-water':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2C8 2 4 7 4 10C4 12.21 5.79 14 8 14C10.21 14 12 12.21 12 10C12 7 8 2 8 2Z" fill="none" stroke="${c}" stroke-width="1.2"/>
        <path d="M4.15 11C4.75 12.76 6.24 14 8 14C9.76 14 11.25 12.76 11.85 11Z" fill="${c}" fill-opacity="0.9"/>
      </svg>`
    case 'lots-of-water':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2C8 2 4 7 4 10C4 12.21 5.79 14 8 14C10.21 14 12 12.21 12 10C12 7 8 2 8 2Z" fill="${c}" fill-opacity="0.9"/>
        <ellipse cx="6.4" cy="9.5" rx="1" ry="1.6" fill="white" fill-opacity="0.3" transform="rotate(-15 6.4 9.5)"/>
      </svg>`
    case 'resupply':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2L14 5L8 8L2 5Z" fill="${c}" opacity="0.9"/>
        <path d="M2 5L2 12.5L8 15.5L8 8Z" fill="${c}" opacity="0.6"/>
        <path d="M8 8L8 15.5L14 12.5L14 5Z" fill="${c}" opacity="0.75"/>
      </svg>`
    case 'other':
      return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" fill="${c}" opacity="0.9"/>
        <circle cx="8" cy="6" r="2" fill="#0f0d0b"/>
      </svg>`
  }
}

export function makeWaypointIcon(type: WaypointType, active: boolean, markerSize?: number): L.DivIcon {
  const color = WAYPOINT_COLOR[type]
  const size = markerSize ?? (active ? 32 : 28)
  const svgSize = Math.round(size * (active ? 0.56 : 0.54))
  const borderColor = active ? color : color + '88'
  return L.divIcon({
    html: `<div class="wp-marker-wrap${active ? ' wp-marker-active' : ''}" style="--wp-border-color:${borderColor};--wp-glow-dim:${color}33;--wp-glow-bright:${color}66;width:${size}px;height:${size}px;">${waypointSvgString(type, svgSize)}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 2],
  })
}

const START_COLOR = '#4ade80'
const END_COLOR = '#f87171'

function endpointDivIcon(color: string, svgInner: string, size: number): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#0f0d0b;border:1.5px solid ${color};display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px ${color}55;">
      <svg width="${size - 6}" height="${size - 6}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">${svgInner}</svg>
    </div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export function makeStartIcon(size = 22): L.DivIcon {
  return endpointDivIcon(
    START_COLOR,
    `<path d="M5.5 4.5L12 8L5.5 11.5Z" fill="${START_COLOR}" opacity="0.95"/>`,
    size
  )
}

export function makeEndIcon(size = 22): L.DivIcon {
  return endpointDivIcon(
    END_COLOR,
    `<rect x="5" y="5" width="6" height="6" rx="0.5" fill="${END_COLOR}" opacity="0.95"/>`,
    size
  )
}

export function makeDetectedWaterIcon(type: WaypointType, size = 24): L.DivIcon {
  const color = WAYPOINT_COLOR[type]
  const svgSize = Math.round(size * 0.52)
  return L.divIcon({
    html: `<div class="wp-marker-wrap wp-marker-detected" style="--wp-border-color:${color};width:${size}px;height:${size}px;">${waypointSvgString(type, svgSize)}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 2],
  })
}

export function makeDrawStartIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#0f0d0b;border:2px solid #4ade80;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px #4ade8088;cursor:grab;">
      <div style="width:6px;height:6px;border-radius:50%;background:#4ade80;"></div>
    </div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export function makeDrawEndIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#0f0d0b;border:2px solid #f87171;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px #f8717188;cursor:grab;">
      <div style="width:6px;height:6px;border-radius:50%;background:#f87171;"></div>
    </div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export function makePendingIcon(type: WaypointType): L.DivIcon {
  const color = WAYPOINT_COLOR[type]
  const size = 30
  return L.divIcon({
    html: `<div class="wp-marker-wrap wp-marker-active" style="--wp-border-color:${color};--wp-glow-dim:${color}33;--wp-glow-bright:${color}66;width:${size}px;height:${size}px;opacity:0.85;">${waypointSvgString(type, 16)}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}