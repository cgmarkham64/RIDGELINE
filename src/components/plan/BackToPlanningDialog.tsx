import { Modal } from '../ui/Modal'

interface BackToPlanningDialogProps {
  onCancel: () => void
  onConfirm: () => void
}

export function BackToPlanningDialog({ onCancel, onConfirm }: BackToPlanningDialogProps) {
  return (
    <Modal
      backdropClassName="bg-black/60"
      panelClassName="bg-surface border border-border-mid rounded-xl p-6 w-full max-w-sm shadow-2xl"
    >
      <h2 className="font-heading text-sub font-extrabold text-text mb-2">Back to planning?</h2>
      <p className="text-body text-text-mid leading-relaxed mb-5">
        This resets the trip status to{' '}
        <span className="text-amber font-semibold">Planning</span>. You can re-advance it any time.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 font-heading text-caption font-bold tracking-widest uppercase rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-3 py-1.5 font-heading text-caption font-bold tracking-widest uppercase rounded border cursor-pointer transition-colors"
          style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}
        >
          Back to planning
        </button>
      </div>
    </Modal>
  )
}
