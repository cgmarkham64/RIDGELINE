import { IconPlus, IconChevronLeft, IconChevronRight } from '../../../icons'
import type { PermitTypeName } from '../../types'

interface FreeformDialogFooterProps {
  step: 'type' | 'details'
  selectedType: PermitTypeName | null
  isEditing: boolean
  canSave: boolean
  onClose: () => void
  onNext: () => void
  onBack: () => void
  onSave: () => void
}

export function FreeformDialogFooter({
  step, selectedType, isEditing, canSave, onClose, onNext, onBack, onSave,
}: FreeformDialogFooterProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-border shrink-0">
      <button
        onClick={onClose}
        className="font-mono text-caption tracking-widest uppercase text-text-dim hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0"
      >
        Cancel
      </button>
      {step === 'type' ? (
        <button
          onClick={onNext}
          disabled={!selectedType}
          className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next <IconChevronRight />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 font-heading text-caption font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
            >
              <IconChevronLeft /> Back
            </button>
          )}
          <button
            onClick={onSave}
            disabled={!canSave}
            className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEditing ? 'Save changes' : <><IconPlus size={10} /> Add to trip</>}
          </button>
        </div>
      )}
    </div>
  )
}
