import { IconX } from '../../../icons'
import { stepLabelClass } from './freeformDialog.helpers'

function StepIndicator({ step }: { step: 'type' | 'details' }) {
  return (
    <div className="flex items-center gap-1.5 mr-2">
      {(['type', 'details'] as const).map((s, i) => (
        <span key={s} className="flex items-center gap-1.5">
          <span className={`font-mono text-label tracking-widest uppercase ${stepLabelClass(step, s)}`}>
            {s === 'type' ? 'Type' : 'Details'}
          </span>
          {i < 1 && <span className="text-border text-caption">·</span>}
        </span>
      ))}
    </div>
  )
}

interface FreeformDialogHeaderProps {
  isEditing: boolean
  step: 'type' | 'details'
  onClose: () => void
}

export function FreeformDialogHeader({ isEditing, step, onClose }: FreeformDialogHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border shrink-0">
      <span className="font-heading text-body-sm font-extrabold text-text flex-1">
        {isEditing ? 'Edit permit' : 'Add permit'}
      </span>
      {!isEditing && <StepIndicator step={step} />}
      <button onClick={onClose} className="text-text-dim hover:text-text p-1 transition-colors">
        <IconX size={16} />
      </button>
    </div>
  )
}
