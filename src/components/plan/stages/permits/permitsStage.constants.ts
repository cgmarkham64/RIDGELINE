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

export const INITIAL_SUGGESTIONS: Permit[] = []

export const CRITICAL_DATES: { date: string; label: string; tone: PermitTone }[] = []

export const MAP_ZONES = [
  { id: 'inyo',    name: 'Inyo wilderness', color: '#5aa478', poly: '50,60 200,50 220,180 80,200',                    status: 'available' as ZoneStatus, night: 1 },
  { id: 'seki',    name: 'SEKI',            color: '#5ab4dc', poly: '200,50 360,80 340,220 220,180',                  status: 'available' as ZoneStatus, night: 3 },
  { id: 'whitney', name: 'Whitney zone',    color: '#f0a030', poly: '340,220 360,80 410,180 380,290 280,300 220,180', status: 'limited'   as ZoneStatus, night: 7 },
]

export const MAP_ROUTE = '70,180 130,140 190,110 250,90 310,110 350,150 380,200 360,260 310,280'

export const ZONE_PERMIT_MAP: Record<string, string> = {
  whitney: 'sgt_whitney',
  inyo:    'sgt_inyo',
  seki:    'sgt_canister',
}