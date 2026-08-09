export function RouteTableEmptyState({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="px-4 py-8 text-center">
      <p className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1.5">No segments yet</p>
      <p className="text-body-sm text-text-mid">
        {canEdit
          ? 'Click "Add segment" above, then click two points on the map to define a leg.'
          : 'No segments have been added to this route.'}
      </p>
    </div>
  )
}
