import { IconX, IconPencil, IconExternalLink, IconSparkle } from '../../../icons'
import { PermitTypeIcon, TypeChip } from './PermitAtoms'
import { TONE_CLS, PERMIT_TYPES } from './permitsStage.constants'
import { isSafeExternalUrl } from '../../../../lib/utils'
import type { Permit } from './permitsStage.types'

const CONFIDENCE_LABEL: Record<NonNullable<Permit['confidence']>, string> = {
  high: 'Verify',
  medium: 'Review carefully',
  low: 'Low confidence',
}

const CONFIDENCE_CLS: Record<NonNullable<Permit['confidence']>, string> = {
  high: 'text-pine',
  medium: 'text-amber',
  low: 'text-red',
}

function AutoDetectedBadge() {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-label tracking-[0.06em] uppercase px-1.5 py-0.5 rounded-sm border border-dashed border-border text-text-dim">
      <IconSparkle /> from route
    </span>
  )
}

function ConfidenceBadge({ confidence }: { confidence: NonNullable<Permit['confidence']> }) {
  return (
    <span className={`font-mono text-label uppercase tracking-[0.06em] ${CONFIDENCE_CLS[confidence]}`}>
      {CONFIDENCE_LABEL[confidence]}
    </span>
  )
}

function BookLink({ url }: { url: string }) {
  if (!isSafeExternalUrl(url)) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase mt-2 px-2.5 py-1.5 rounded border border-amber-border text-amber bg-amber-dim hover:bg-amber transition-colors"
    >
      Book <IconExternalLink size={10} />
    </a>
  )
}

function HeaderActions({ canEdit, onEdit, onRemove }: { canEdit: boolean; onEdit: () => void; onRemove: () => void }) {
  if (!canEdit) return null
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button onClick={onEdit} className="text-text-dim hover:text-text p-1 transition-colors" title="Edit">
        <IconPencil size={13} />
      </button>
      <button onClick={onRemove} className="text-text-dim hover:text-red p-1 transition-colors" title="Remove">
        <IconX size={14} />
      </button>
    </div>
  )
}

type PermitCardHeaderProps = {
  permit: Permit
  partySize: number
  canEdit: boolean
  onEdit: () => void
  onRemove: () => void
}

export function PermitCardHeader({ permit, partySize, canEdit, onEdit, onRemove }: PermitCardHeaderProps) {
  const t = PERMIT_TYPES[permit.type]

  return (
    <div className="flex items-start gap-3 mb-3">
      <span className={`w-8 h-8 rounded-md flex items-center justify-center border shrink-0 ${TONE_CLS[t.tone]}`}>
        <PermitTypeIcon type={permit.type} size={15} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <TypeChip type={permit.type} />
          <span className="font-mono text-label text-text-dim">party {partySize}</span>
          {permit.autoDetected && <AutoDetectedBadge />}
          {permit.confidence && <ConfidenceBadge confidence={permit.confidence} />}
        </div>
        <div className="font-heading text-body-sm font-extrabold text-text leading-snug">{permit.name}</div>
        <div className="font-mono text-label text-text-dim mt-0.5">{permit.agency}</div>
        {permit.url && <BookLink url={permit.url} />}
      </div>
      <HeaderActions canEdit={canEdit} onEdit={onEdit} onRemove={onRemove} />
    </div>
  )
}
