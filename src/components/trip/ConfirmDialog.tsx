interface Props {
  title: string
  body: React.ReactNode
  confirmLabel: string
  pendingLabel: string
  isPending: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({ title, body, confirmLabel, pendingLabel, isPending, onConfirm, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-lg w-full max-w-[360px] mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-heading text-base font-bold text-text mb-2">{title}</h2>
        <div className="mb-6">{body}</div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} disabled={isPending} className="btn btn-ghost">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isPending} className="btn btn-danger">
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}