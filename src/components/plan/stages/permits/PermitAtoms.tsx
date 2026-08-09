import type { PermitTypeName } from '../../types'
import {
  IconTicket, IconCalendar, IconClock, IconCheckCircle,
  IconLayers, IconHut, IconParking, IconFishing, IconVehicle,
} from '../../../icons'
import { PERMIT_TYPES, TONE_CLS } from './permitsStage.constants'

const PERMIT_ICON: Record<PermitTypeName, typeof IconTicket> = {
  lottery: IconTicket,
  reservation: IconCalendar,
  walkup: IconClock,
  selfissue: IconCheckCircle,
  zonenights: IconLayers,
  hut: IconHut,
  parking: IconParking,
  fishing: IconFishing,
  vehicle: IconVehicle,
}

export function PermitTypeIcon({ type, size = 15 }: { type: PermitTypeName; size?: number }) {
  const Icon = PERMIT_ICON[type]
  return <Icon size={size} />
}

export function TypeChip({ type }: { type: PermitTypeName }) {
  const t = PERMIT_TYPES[type]
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-label tracking-[0.06em] uppercase font-semibold ${TONE_CLS[t.tone]}`}>
      {t.label}
    </span>
  )
}

export function Field({ label, value, readOnly, onChange }: {
  label: string
  value: string
  readOnly?: boolean
  onChange?: (v: string) => void
}) {
  const cls = 'w-full px-2.5 py-1.5 border border-border rounded-sm text-fine bg-surface-2 text-text outline-none font-mono focus:border-border-mid transition-colors'
  return (
    <div>
      <label className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1 block">{label}</label>
      <input
        className={onChange ? cls : `${cls} read-only:text-text-mid read-only:cursor-default`}
        {...(onChange
          ? { value, onChange: e => onChange(e.target.value) }
          : { defaultValue: value, readOnly }
        )}
      />
    </div>
  )
}