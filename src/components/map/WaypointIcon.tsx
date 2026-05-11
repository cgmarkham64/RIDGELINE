import type { WaypointType } from '../../types'
import { WAYPOINT_COLOR } from './constants'

export function WaypointIcon({ type, size = 14 }: { type: WaypointType; size?: number }) {
  const color = WAYPOINT_COLOR[type]
  switch (type) {
    case 'campsite':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path d="M8 2L15 13H1L8 2Z" fill={color} opacity="0.9" />
          <path d="M6.5 13L8 9.5L9.5 13" fill="#0f0d0b" />
          <line x1="1" y1="13" x2="15" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'wildlife':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
          <ellipse cx="8" cy="11" rx="3.2" ry="2.4" />
          <circle cx="4.8" cy="7.8" r="1.5" />
          <circle cx="8" cy="6.8" r="1.5" />
          <circle cx="11.2" cy="7.8" r="1.5" />
        </svg>
      )
    case 'viewpoint':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <rect x="1.5" y="5" width="13" height="9" rx="1.5" fill={color} opacity="0.9" />
          <path d="M6 5V3.5C6 3 6.5 2.5 7 2.5H9C9.5 2.5 10 3 10 3.5V5" fill={color} opacity="0.7" />
          <circle cx="8" cy="9.5" r="2.8" fill="#0f0d0b" />
          <circle cx="8" cy="9.5" r="1.6" fill={color} opacity="0.5" />
        </svg>
      )
    case 'no-water':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2C8 2 4 7 4 10C4 12.21 5.79 14 8 14C10.21 14 12 12.21 12 10C12 7 8 2 8 2Z"
            fill={color}
            fillOpacity="0.25"
            stroke={color}
            strokeWidth="1.2"
          />
          <line x1="4.5" y1="4.5" x2="11.5" y2="12.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'some-water':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2C8 2 4 7 4 10C4 12.21 5.79 14 8 14C10.21 14 12 12.21 12 10C12 7 8 2 8 2Z"
            fill="none"
            stroke={color}
            strokeWidth="1.2"
          />
          <path
            d="M4.15 11C4.75 12.76 6.24 14 8 14C9.76 14 11.25 12.76 11.85 11Z"
            fill={color}
            fillOpacity="0.9"
          />
        </svg>
      )
    case 'lots-of-water':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path
            d="M8 2C8 2 4 7 4 10C4 12.21 5.79 14 8 14C10.21 14 12 12.21 12 10C12 7 8 2 8 2Z"
            fill={color}
            fillOpacity="0.9"
          />
          <ellipse cx="6.4" cy="9.5" rx="1" ry="1.6" fill="white" fillOpacity="0.3" transform="rotate(-15 6.4 9.5)" />
        </svg>
      )
    case 'other':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z"
            fill={color}
            opacity="0.9"
          />
          <circle cx="8" cy="6" r="2" fill="#0f0d0b" />
        </svg>
      )
  }
}