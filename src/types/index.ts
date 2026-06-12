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
  wakeActual?: string
  onTrailActual?: string
  campActual?: string
  wildlife?: string[]
  companions?: string[]
  photos?: Photo[]
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType = 'trip_share_invite' | 'invite_accepted' | 'invite_declined'
export type NotificationStatus = 'pending' | 'accepted' | 'declined'

export interface AppNotification {
  _id: string
  toSub: string
  fromSub: string
  fromName: string
  type: NotificationType
  tripId: string
  tripTitle: string
  read: boolean
  status: NotificationStatus
  createdAt: string
  updatedAt: string
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
  firstTimestamp?: string // ISO 8601 timestamp of the first track point, used to order tracks
}

// ─── Waypoints ───────────────────────────────────────────────────────────────

export type WaypointType =
  | 'campsite'
  | 'wildlife'
  | 'viewpoint'
  | 'no-water'
  | 'some-water'
  | 'lots-of-water'
  | 'resupply'
  | 'other'

export interface Waypoint {
  id: string
  type: WaypointType
  label: string
  lat: number
  lon: number
  notes?: string
  photoId?: string // for future photo linkage
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
  waypoints?: Waypoint[]
  coverPhotoId?: string
  loadoutId?: string
  status?: 'planning' | 'ready' | 'on-trail' | 'wrap-up' | 'complete'
  planStages?: Record<string, unknown>
  ownerSub?: string
  ownerName?: string
  sharedWith?: { sub: string; name: string; role?: 'read' | 'edit' }[]
  journalDays?: JournalDay[]
  photos?: Photo[]
  createdAt: string
  updatedAt: string
}
