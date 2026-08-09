import { PermitCardHeader } from './PermitCardHeader'
import { PermitCardBody } from './PermitCardBody'
import type { Permit } from './permitsStage.types'

type PermitCardProps = {
  permit: Permit
  onRemove: () => void
  onEdit: () => void
  onUpdatePermit: (key: string, value: string) => void
  canEdit: boolean
  partySize: number
}

export function PermitCard({ permit, onRemove, onEdit, onUpdatePermit, canEdit, partySize }: PermitCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <PermitCardHeader permit={permit} partySize={partySize} canEdit={canEdit} onEdit={onEdit} onRemove={onRemove} />
      <PermitCardBody permit={permit} canEdit={canEdit} onUpdatePermit={onUpdatePermit} />
    </div>
  )
}
