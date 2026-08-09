import type { ReminderTone, ContactTone } from '../../types'

export interface Reminder {
  date: string
  description: string
  tone: ReminderTone
  set: boolean
}

export interface Contact {
  name: string
  role: string
  phone: string
  tone: ContactTone
}

export interface MapLayer {
  name: string
  size: string
  ok: boolean
}

export interface ChecklistItem {
  text: string
  done: boolean
  pending?: boolean
}

export const PERCENT_MULTIPLIER = 100

export const DEFAULT_REMINDERS: Reminder[] = [
  { date: 'Jan 25', description: 'Whitney lottery opens reminder',              tone: 'amber', set: true  },
  { date: 'Mar 24', description: 'Lottery results · expect email by 5PM',       tone: 'amber', set: true  },
  { date: 'Aug 1',  description: 'Mail resupply to Bishop PO',                  tone: 'sky',   set: true  },
  { date: 'Aug 8',  description: '72-hr forecast check',                        tone: 'sky',   set: true  },
  { date: 'Aug 10', description: 'Pack shakedown · weigh-in',                   tone: 'sky',   set: false },
  { date: 'Aug 11', description: '5AM · airport · do not check trekking poles', tone: 'pine',  set: true  },
]

export const DEFAULT_CONTACTS: Contact[] = [
  { name: 'Sam (home base)',      role: 'check-in · 8PM PT daily', phone: '415-555-0142',      tone: 'amber' },
  { name: 'Inyo Co. Sheriff SAR', role: 'east-side primary',       phone: '760-878-0383',      tone: 'red'   },
  { name: 'Tulare Co. SAR',       role: 'west-side primary',       phone: '559-733-6218',      tone: 'red'   },
  { name: 'Garmin IERCC',         role: 'inReach SOS routing',     phone: 'auto · SOS button', tone: 'sky'   },
]

export const DEFAULT_MAP_LAYERS: MapLayer[] = [
  { name: 'CalTopo — Sierra High Route corridor', size: '142 MB · 4 layers', ok: true  },
  { name: 'Gaia GPS — backup',                    size: '88 MB · contours',  ok: true  },
  { name: 'NOAA — wx overlays',                   size: '12 MB',             ok: true  },
  { name: 'OnX — bail-out roads',                 size: '— · pending',       ok: false },
]

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { text: 'Trip one-pager (PDF)',         done: true,  pending: false },
  { text: 'Offline maps · CalTopo',       done: true,  pending: false },
  { text: 'Emergency contacts shared',    done: true,  pending: false },
  { text: 'Garmin inReach plan paid',     done: true,  pending: false },
  { text: 'Car parked at Whitney Portal', done: false, pending: true  },
  { text: 'Keys handed off',              done: false, pending: false },
]

export const DEFAULT_DAY_ROWS = [
  'D1 Onion Valley → Charlotte · 12 mi',
  'D2 Charlotte → Rae Lakes · 14 mi',
  'D3 Rae → Sixty Lake · 18 mi',
  'D4 Sixty → Bench Lake · 22 mi ⚠',
  'D5 Bench → Marjorie · 16 mi · RESUPPLY',
  'D6 Marjorie → Crabtree · 19 mi',
  'D7 Crabtree → Guitar Lake · 14 mi',
  'D8 Guitar → Whitney Portal · 17 mi · SUMMIT',
]

export const REMINDER_DATE_CLS: Record<ReminderTone, string> = {
  amber: 'text-amber',
  sky:   'text-sky',
  pine:  'text-pine',
}

export const CONTACT_AVATAR_CLS: Record<ContactTone, string> = {
  amber: 'bg-amber-dim border-amber-border text-amber',
  sky:   'bg-sky-dim border-sky-border text-sky',
  pine:  'bg-pine-dim border-pine-border text-pine',
  red:   'bg-red-dim border-red-border text-red',
}
