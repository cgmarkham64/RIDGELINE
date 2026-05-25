export function TripEmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">⛰</div>
      <h2 className="empty-state__title">No trip selected</h2>
      <p className="empty-state__body">
        Pick a trip from the sidebar, or start planning a new one.
      </p>
      <button onClick={onNew} className="btn btn-primary">
        + New trip
      </button>
    </div>
  )
}