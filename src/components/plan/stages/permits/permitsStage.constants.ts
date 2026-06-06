import type { PermitTypeName, ZoneStatus } from '../../types'
import type { Permit, PermitTone } from './permitsStage.types'

export const PERMIT_TYPES: Record<PermitTypeName, { label: string; tone: PermitTone; hint: string }> = {
  lottery:     { label: 'Lottery',             tone: 'amber', hint: 'Apply window → results → accept' },
  reservation: { label: 'Advance reservation', tone: 'sky',   hint: 'Books on open date, fills fast' },
  walkup:      { label: 'Walk-up',             tone: 'amber', hint: 'Day-of, first-come' },
  selfissue:   { label: 'Self-issue',          tone: 'pine',  hint: 'Free trailhead register, no booking' },
  zonenights:  { label: 'Zone-by-zone',        tone: 'amber', hint: 'One permit, specifies zones/nights' },
  hut:         { label: 'Hut reservation',     tone: 'sky',   hint: 'Per-night booking (refugio/hut)' },
  parking:     { label: 'Parking pass',        tone: 'pine',  hint: 'Trailhead lot — separate from wilderness' },
  fishing:     { label: 'Fishing license',     tone: 'pine',  hint: 'Activity license' },
  vehicle:     { label: 'Vehicle entry',       tone: 'pine',  hint: 'NPS-style park entry' },
}

export const TONE_CLS: Record<PermitTone, string> = {
  amber: 'bg-amber-dim border-amber-border text-amber',
  sky:   'bg-sky-dim border-sky-border text-sky',
  pine:  'bg-pine-dim border-pine-border text-pine',
}

export const ZONE_STATUS_CLS: Record<ZoneStatus, string> = {
  available: 'text-pine',
  limited:   'text-amber',
  sold_out:  'text-red',
}

export const INITIAL_PERMITS: Permit[] = []

export const PERMIT_DATE_PRESETS: Record<PermitTypeName, { key: string; label: string; tone: PermitTone }[]> = {
  lottery:     [
    { key: 'apply_opens',  label: 'Application opens',   tone: 'amber' },
    { key: 'apply_closes', label: 'Application closes',  tone: 'amber' },
    { key: 'draw_date',    label: 'Draw date',           tone: 'amber' },
    { key: 'accept_by',    label: 'Acceptance deadline', tone: 'amber' },
  ],
  reservation: [
    { key: 'booking_opens', label: 'Booking opens',           tone: 'sky'   },
    { key: 'cancel_by',     label: 'Cancellation deadline',   tone: 'amber' },
  ],
  walkup:      [
    { key: 'window_opens', label: 'Window opens',  tone: 'amber' },
    { key: 'arrive_by',    label: 'Arrive by',     tone: 'amber' },
  ],
  selfissue:   [],
  zonenights:  [
    { key: 'booking_opens', label: 'Booking opens', tone: 'sky' },
  ],
  hut:         [
    { key: 'booking_opens', label: 'Booking opens',         tone: 'sky'   },
    { key: 'cancel_by',     label: 'Cancellation deadline', tone: 'amber' },
  ],
  parking:     [
    { key: 'booking_opens', label: 'Booking opens', tone: 'sky' },
  ],
  fishing:     [],
  vehicle:     [
    { key: 'booking_opens', label: 'Booking opens', tone: 'sky' },
  ],
}

