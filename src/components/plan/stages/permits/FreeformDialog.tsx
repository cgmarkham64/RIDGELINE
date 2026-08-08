import { Modal } from '../../../ui/Modal'
import { TypeChip } from './PermitAtoms'
import { FreeformDialogHeader } from './FreeformDialogHeader'
import { PermitTypeStep } from './PermitTypeStep'
import { AiPrefillBanner } from './AiPrefillBanner'
import { PermitDetailsFields } from './PermitDetailsFields'
import { CriticalDatesSection } from './CriticalDatesSection'
import { FreeformDialogFooter } from './FreeformDialogFooter'
import { useFreeformDialog } from './useFreeformDialog'
import type { AiPrefillInfo } from './freeformDialog.types'
import type { Permit } from './permitsStage.types'

interface FreeformDialogProps {
  onClose:        () => void
  onSave:         (permit: Permit) => void
  partySize:      number
  initialPermit?: Permit
  aiPrefill?:     AiPrefillInfo
}

export function FreeformDialog({ onClose, onSave, partySize, initialPermit, aiPrefill }: FreeformDialogProps) {
  const d = useFreeformDialog(initialPermit, aiPrefill, partySize, onSave)

  return (
    <Modal
      backdropClassName="p-6 bg-[rgba(10,9,8,0.78)]"
      panelClassName="bg-surface border border-border rounded-xl w-full max-w-160 shadow-2xl flex flex-col max-h-[90vh]"
    >
      <FreeformDialogHeader isEditing={d.isEditing} step={d.step} onClose={onClose} />

      <div className="overflow-y-auto flex-1">
        <div className="p-5">
          {d.step === 'type' && <PermitTypeStep selectedType={d.selectedType} onSelect={d.handleTypeSelect} />}

          {d.step === 'details' && d.selectedType && (
            <>
              {aiPrefill && <AiPrefillBanner aiPrefill={aiPrefill} />}
              <div className="flex items-center gap-2 mb-4">
                <TypeChip type={d.selectedType} />
                {!d.isEditing && (
                  <button
                    onClick={() => d.setStep('type')}
                    className="font-mono text-label text-text-dim hover:text-text transition-colors uppercase tracking-widest bg-transparent border-none cursor-pointer p-0"
                  >
                    Change
                  </button>
                )}
              </div>
              <PermitDetailsFields selectedType={d.selectedType} isEditing={d.isEditing} fields={d.fields} />
              <CriticalDatesSection dates={d.dates} />
            </>
          )}
        </div>
      </div>

      <FreeformDialogFooter
        step={d.step}
        selectedType={d.selectedType}
        isEditing={d.isEditing}
        canSave={!!d.fields.name.trim()}
        onClose={onClose}
        onNext={() => d.setStep('details')}
        onBack={() => d.setStep('type')}
        onSave={d.handleSave}
      />
    </Modal>
  )
}
