// ─── Gear ────────────────────────────────────────────────────────────────────

export type GearCategory =
  | 'shelter'
  | 'sleep'
  | 'clothing'
  | 'footwear'
  | 'navigation'
  | 'nutrition'
  | 'hydration'
  | 'first-aid'
  | 'tools'
  | 'electronics'
  | 'other'

export interface GearItem {
  id: string
  name: string
  category: GearCategory
  brand?: string
  weightGrams?: number
  isWorn?: boolean // worn weight vs pack weight
  notes?: string
  link?: string
}

export interface Loadout {
  id: string
  name: string
  description?: string
  items: GearItem[]
  createdAt: string
  updatedAt: string
}

// ─── Photos ──────────────────────────────────────────────────────────────────

export interface Photo {
  id: string
  tripId?: string
  journalDayId?: string
  url: string
  thumbnailUrl?: string
  filename: string
  caption?: string
  // From EXIF
  takenAt?: string
  latitude?: number
  longitude?: number
  altitudeM?: number
  cameraMake?: string
  cameraModel?: string
  createdAt: string
}

// ─── Journal ─────────────────────────────────────────────────────────────────

export interface JournalDay {
  _id: string
  tripId: string
  date: string // ISO date string, e.g. "2024-08-12T00:00:00.000Z"
  dayNumber: number
  title?: string
  body: string
  milesCovered?: number
  elevationGainFt?: number
  weatherNotes?: string
  tempLowF?: number
  tempHighF?: number
  photos?: Photo[]
}

// ─── GPX ─────────────────────────────────────────────────────────────────────

export interface GpxTrack {
  type: 'LineString'
  coordinates: [number, number, number][] // [lon, lat, ele]
}

export interface GpxTrackEntry {
  id: string // stable client-generated id (Date.now().toString())
  label: string // e.g. "Day 1", "Day 2"
  track: GpxTrack
}

// ─── Trip ────────────────────────────────────────────────────────────────────

export interface Trip {
  _id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  location: string
  distanceMiles?: number
  elevationGainFt?: number
  gpxFileUrl?: string
  gpxPlanned?: GpxTrack
  gpxTracks?: GpxTrackEntry[]
  coverPhotoId?: string
  loadoutId?: string
  journalDays?: JournalDay[]
  photos?: Photo[]
  createdAt: string
  updatedAt: string
}
