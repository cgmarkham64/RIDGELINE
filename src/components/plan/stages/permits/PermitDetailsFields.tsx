import type { PermitTypeName } from '../../types'
import { ZoneNightsBuilder } from './ZoneNightsBuilder'
import { usePermitFormFields } from './usePermitFormFields'

const FIELD_INPUT_CLS = 'w-full px-3 py-2 border border-border rounded text-body bg-surface-2 text-text outline-none focus:border-border-mid transition-colors'

function TextField({ label, value, onChange, placeholder, type = 'text', autoFocus }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  autoFocus?: boolean
}) {
  return (
    <div>
      <label className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1.5 block">{label}</label>
      <input
        type={type}
        className={FIELD_INPUT_CLS}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
    </div>
  )
}

interface PermitDetailsFieldsProps {
  selectedType: PermitTypeName
  isEditing: boolean
  fields: ReturnType<typeof usePermitFormFields>
}

export function PermitDetailsFields({ selectedType, isEditing, fields }: PermitDetailsFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <TextField
        label="Permit name *"
        placeholder="e.g. Mt. Whitney overnight permit"
        value={fields.name}
        onChange={fields.setName}
        autoFocus={!isEditing}
      />
      <TextField
        label="Agency / issuer"
        placeholder="e.g. Inyo NF · recreation.gov"
        value={fields.agency}
        onChange={fields.setAgency}
      />
      <TextField
        label="Booking URL"
        type="url"
        placeholder="https://www.recreation.gov/…"
        value={fields.url}
        onChange={fields.setUrl}
      />
      {(selectedType === 'lottery' || selectedType === 'reservation') && (
        <TextField label="Confirmation #" placeholder="e.g. 4829-XKPZ" value={fields.confirmNum} onChange={fields.setConfirmNum} />
      )}
      {selectedType === 'selfissue' && (
        <TextField label="Trailhead" placeholder="e.g. North Lake Trailhead" value={fields.trailhead} onChange={fields.setTrailhead} />
      )}
      {selectedType === 'zonenights' && (
        <ZoneNightsBuilder zones={fields.draftZones} onUpdate={fields.updateZone} onRemove={fields.removeZone} onAdd={fields.addZone} />
      )}
      <div>
        <label className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1.5 block">Notes</label>
        <textarea
          className="w-full px-3 py-2 border border-border rounded text-body bg-surface-2 text-text outline-none focus:border-border-mid transition-colors resize-none"
          placeholder="Why this permit is needed, key dates, links…"
          rows={3}
          value={fields.notes}
          onChange={(e) => fields.setNotes(e.target.value)}
        />
      </div>
    </div>
  )
}
