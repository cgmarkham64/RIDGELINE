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

export const INITIAL_PERMITS: Permit[] = [
  {
    id: 'sgt_whitney',
    type: 'lottery',
    name: 'Mt. Whitney Zone (overnight)',
    agency: 'Inyo NF · recreation.gov',
    why: 'Your route exits via Whitney Portal — overnight permits are required Apr–Nov.',
    fields: {
      'Lottery opens':  'Feb 1, 2026',
      'Lottery closes': 'Mar 15, 2026',
      'Results':        'Mar 24, 2026',
      'Walk-up backup': 'Day-of 11 AM',
    },
    party: 4,
  },
  {
    id: 'sgt_inyo',
    type: 'reservation',
    name: 'Inyo NF wilderness — Onion Valley entry',
    agency: 'Inyo NF · recreation.gov',
    why: 'Entry trailhead Onion Valley enters Inyo wilderness — quota of 60/day applies May–Nov.',
    fields: {
      'Booking opens': '6 months out',
      'Booked':        'Mar 12, 2026',
      'Confirmation':  'INV-7724-K',
    },
    party: 4,
  },
]

export const INITIAL_SUGGESTIONS: Permit[] = [
  {
    id: 'sgt_canister',
    type: 'selfissue',
    name: 'Bear canister registration (SEKI)',
    agency: 'Sequoia & Kings Canyon NPS',
    why: 'Approved canister required when route crosses SEKI lands (Day 3–6).',
    fields: {},
    party: 4,
  },
  {
    id: 'sgt_parking',
    type: 'parking',
    name: 'Onion Valley trailhead parking',
    agency: 'Inyo NF',
    why: 'Lot fills July–Sep weekends; no fee, but space-limited.',
    fields: { 'Reserve at': 'recreation.gov', 'Backup': 'Independence shuttle' },
    party: 4,
  },
]

export const CRITICAL_DATES = [
  { date: 'Feb 1',  label: 'Whitney lottery opens',  tone: 'amber' as PermitTone },
  { date: 'Mar 12', label: 'Inyo entry — book',       tone: 'sky'   as PermitTone },
  { date: 'Mar 15', label: 'Whitney lottery closes',  tone: 'amber' as PermitTone },
  { date: 'Mar 24', label: 'Whitney results',         tone: 'sky'   as PermitTone },
]

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