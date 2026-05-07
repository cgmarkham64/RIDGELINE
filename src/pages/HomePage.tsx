import { useState } from 'react'
import type { Trip } from '../types'
import { TripSidebar } from '../components/trip/TripSidebar'
import { TripModal } from '../components/trip/TripModal'
import { DeleteConfirm } from '../components/trip/DeleteConfirm'
import { LeaveConfirm } from '../components/trip/LeaveConfirm'
import { TripDetail } from '../components/trip/TripDetail'

type ModalState = { mode: 'create' } | { mode: 'edit'; trip: Trip }

// ─── Page root ────────────────────────────────────────────────────────────────

export function HomePage() {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null)
  const [leaveTarget, setLeaveTarget] = useState<Trip | null>(null)

  function handleTripSaved(trip: Trip) {
    setModal(null)
    setSelectedTrip(trip)
  }

  function handleDeleted() {
    if (selectedTrip && deleteTarget && selectedTrip._id === deleteTarget._id) {
      setSelectedTrip(null)
    }
    setDeleteTarget(null)
  }

  function handleLeft() {
    setSelectedTrip(null)
    setLeaveTarget(null)
  }

  return (
    <div className="home-layout">
      <TripSidebar
        selectedId={selectedTrip?._id ?? null}
        onSelect={setSelectedTrip}
        onNew={() => setModal({ mode: 'create' })}
        onEdit={(trip) => setModal({ mode: 'edit', trip })}
        onDelete={setDeleteTarget}
      />

      <main className="home-main">
        {selectedTrip ? (
          <TripDetail
            trip={selectedTrip}
            onEdit={() => setModal({ mode: 'edit', trip: selectedTrip })}
            onDelete={() => setDeleteTarget(selectedTrip)}
            onLeave={() => setLeaveTarget(selectedTrip)}
            onTripUpdated={setSelectedTrip}
          />
        ) : (
          <EmptyState onNew={() => setModal({ mode: 'create' })} />
        )}
      </main>

      {modal && (
        <TripModal
          trip={modal.mode === 'edit' ? modal.trip : undefined}
          onClose={() => setModal(null)}
          onSaved={handleTripSaved}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          trip={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
      {leaveTarget && (
        <LeaveConfirm
          trip={leaveTarget}
          onClose={() => setLeaveTarget(null)}
          onLeft={handleLeft}
        />
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">⛰</div>
      <h2 className="empty-state__title">No trip selected</h2>
      <p className="empty-state__body">
        Pick a trip from the sidebar, or create a new one to get started.
      </p>
      <button onClick={onNew} className="btn btn-primary">
        + New trip
      </button>
    </div>
  )
}
