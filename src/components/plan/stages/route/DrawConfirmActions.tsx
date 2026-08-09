type DrawConfirmActionsProps = {
  editingSeg: boolean
  disabled: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DrawConfirmActions({ editingSeg, disabled, onCancel, onConfirm }: DrawConfirmActionsProps) {
  return (
    <div className="flex gap-2 justify-end mt-1">
      <button
        onClick={onCancel}
        className="px-3 py-1.5 font-heading text-caption font-bold tracking-widest uppercase rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={disabled}
        className="px-3 py-1.5 font-heading text-caption font-bold tracking-widest uppercase rounded border cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}
      >
        {editingSeg ? 'Update segment' : 'Add segment'}
      </button>
    </div>
  )
}
