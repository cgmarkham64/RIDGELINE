type RouteTableColumnHeaderProps = {
  gridTemplate: string
  isDraggable: boolean
  canEdit: boolean
}

export function RouteTableColumnHeader({ gridTemplate, isDraggable, canEdit }: RouteTableColumnHeaderProps) {
  return (
    <div className="grid items-center px-4 py-1.5 gap-3 border-b border-border" style={{ gridTemplateColumns: gridTemplate }}>
      {isDraggable && <span />}
      <span />
      <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Name</span>
      <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">From TH</span>
      <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Next camp</span>
      <span className="font-mono text-label tracking-[0.12em] uppercase text-text-dim">Next water</span>
      {canEdit && <span />}
    </div>
  )
}
