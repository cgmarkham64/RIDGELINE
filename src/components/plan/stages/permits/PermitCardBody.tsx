import type { ReactElement } from 'react'
import { IconCheck, IconAlertTriangle } from '../../../icons'
import { Field } from './PermitAtoms'
import { ZONE_STATUS_CLS } from './permitsStage.constants'
import type { Permit } from './permitsStage.types'
import type { PermitTypeName } from '../../types'

type FieldPair = [string, string]

type PermitBodyProps = {
  permit: Permit
  canEdit: boolean
  onUpdatePermit: (key: string, value: string) => void
}

function namedFields(permit: Permit, keys: string[]): FieldPair[] {
  return keys.map(k => [k, permit.fields[k] ?? ''])
}

function FieldGrid({ fields, cols, canEdit, onUpdatePermit }: {
  fields: FieldPair[]
  cols: number
  canEdit: boolean
  onUpdatePermit: (key: string, value: string) => void
}) {
  if (fields.length === 0) return null
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {fields.map(([k, v]) => (
        <Field key={k} label={k} value={v} onChange={canEdit ? val => onUpdatePermit(k, val) : undefined} />
      ))}
    </div>
  )
}

const LOTTERY_FIELD_GRID_MAX_COLS = 4
const RESERVATION_FIELD_GRID_MAX_COLS = 3
const FIXED_GRID_COLS = 2

function ComputedFieldsBody({ permit, canEdit, onUpdatePermit, maxCols }: PermitBodyProps & { maxCols: number }) {
  const fields = Object.entries(permit.fields)
  return <FieldGrid fields={fields} cols={Math.min(fields.length, maxCols)} canEdit={canEdit} onUpdatePermit={onUpdatePermit} />
}

function LotteryBody(props: PermitBodyProps) {
  return <ComputedFieldsBody {...props} maxCols={LOTTERY_FIELD_GRID_MAX_COLS} />
}

function ReservationBody(props: PermitBodyProps) {
  return <ComputedFieldsBody {...props} maxCols={RESERVATION_FIELD_GRID_MAX_COLS} />
}

function ParkingBody({ permit, canEdit, onUpdatePermit }: PermitBodyProps) {
  return <FieldGrid fields={Object.entries(permit.fields)} cols={FIXED_GRID_COLS} canEdit={canEdit} onUpdatePermit={onUpdatePermit} />
}

function namedFieldsBody(keys: [string, string]) {
  return function NamedFieldsBody({ permit, canEdit, onUpdatePermit }: PermitBodyProps) {
    return <FieldGrid fields={namedFields(permit, keys)} cols={FIXED_GRID_COLS} canEdit={canEdit} onUpdatePermit={onUpdatePermit} />
  }
}

function SelfIssueBody() {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 bg-pine-dim border border-pine-border rounded text-fine text-text-mid">
      <span className="text-pine shrink-0"><IconCheck size={12} /></span>
      No booking required — self-issue at the trailhead. We'll add a reminder.
    </div>
  )
}

function ZoneNightsList({ zones }: { zones: NonNullable<Permit['zones']> }) {
  return (
    <div className="flex flex-col gap-1">
      {zones.map(z => (
        <div key={z.night} className="grid items-center gap-2.5 px-3 py-2 bg-bg border border-border rounded grid-cols-[44px_1fr_72px]">
          <span className="font-mono text-caption font-bold text-amber text-center py-0.5 px-1.5 bg-amber-dim border border-amber-border rounded">
            N{z.night}
          </span>
          <span className="text-body-sm">{z.zone}</span>
          <span className={`font-mono text-label text-right uppercase tracking-[0.08em] ${ZONE_STATUS_CLS[z.status]}`}>
            {z.status.replace('_', ' ')}
          </span>
        </div>
      ))}
    </div>
  )
}

function ZoneWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5 mt-3">
      {warnings.map((w, i) => (
        <div key={i} className="flex items-start gap-2 px-3 py-2 bg-amber-dim border border-amber-border rounded text-fine text-text-mid">
          <IconAlertTriangle size={13} className="shrink-0 mt-px text-amber" />
          <span>{w}</span>
        </div>
      ))}
    </div>
  )
}

function ZoneNightsBody({ permit, canEdit, onUpdatePermit }: PermitBodyProps) {
  const fields = Object.entries(permit.fields)
  return (
    <>
      {fields.length > 0 && (
        <div className="mb-3">
          <FieldGrid fields={fields} cols={FIXED_GRID_COLS} canEdit={canEdit} onUpdatePermit={onUpdatePermit} />
        </div>
      )}
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-1.5">Zones × nights</div>
      <ZoneNightsList zones={permit.zones ?? []} />
      <ZoneWarnings warnings={permit.zoneWarnings ?? []} />
    </>
  )
}

const PERMIT_BODY: Record<PermitTypeName, (props: PermitBodyProps) => ReactElement | null> = {
  lottery: LotteryBody,
  reservation: ReservationBody,
  walkup: namedFieldsBody(['Window opens', 'Arrive by']),
  selfissue: SelfIssueBody,
  zonenights: ZoneNightsBody,
  parking: ParkingBody,
  hut: namedFieldsBody(['Check-in date', 'Nights']),
  fishing: namedFieldsBody(['License #', 'Expiry']),
  vehicle: namedFieldsBody(['Pass type', 'Pass #']),
}

export function PermitCardBody(props: PermitBodyProps) {
  const Body = PERMIT_BODY[props.permit.type]
  return <Body {...props} />
}
