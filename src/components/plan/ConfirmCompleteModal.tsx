import { Modal } from '../ui/Modal'

export function ConfirmCompleteModal({ onAddEntries, onCompleteAnyway }: {
  onAddEntries: () => void
  onCompleteAnyway: () => void
}) {
  return (
    <Modal
      backdropClassName="bg-black/60"
      panelClassName="bg-surface border border-border-mid rounded-xl p-6 w-full max-w-sm shadow-2xl"
    >
      <h2 className="font-heading text-sub font-extrabold text-text mb-2">No journal entries yet.</h2>
      <p className="text-body text-text-mid leading-relaxed mb-5">
        Consider adding a trip report before marking this complete — it only takes a few minutes.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onAddEntries}
          className="px-3 py-1.5 font-heading text-caption font-bold tracking-widest uppercase rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent"
        >
          Add entries
        </button>
        <button
          onClick={onCompleteAnyway}
          className="px-3 py-1.5 font-heading text-caption font-bold tracking-widest uppercase rounded border cursor-pointer transition-colors"
          style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}
        >
          Complete anyway
        </button>
      </div>
    </Modal>
  )
}
