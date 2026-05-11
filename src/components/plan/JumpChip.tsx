interface JumpChipProps {
  to: string
  onJump: (id: string) => void
  children: React.ReactNode
}

export function JumpChip({ to, onJump, children }: JumpChipProps) {
  return (
    <button
      onClick={() => onJump(to)}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-glow border border-amber-border rounded text-amber font-sans text-[11px] font-semibold cursor-pointer leading-snug hover:bg-amber-dim transition-colors"
      title={`Jump to ${to}`}
    >
      {children}
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </button>
  )
}