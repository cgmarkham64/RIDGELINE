import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { Trip } from '../types'
import { TripSidebar } from '../components/trip/TripSidebar'
import { DeleteConfirm } from '../components/trip/DeleteConfirm'
import { LeaveConfirm } from '../components/trip/LeaveConfirm'
import { TripDetail } from '../components/trip/TripDetail'

export function HomePage() {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null)
  const [leaveTarget, setLeaveTarget] = useState<Trip | null>(null)
  const navigate = useNavigate()

  function handleSelect(trip: Trip) {
    // planning/ready trips open in the wizard; everything else shows TripDetail
    if (trip.status === 'planning' || trip.status === 'ready') {
      navigate({ to: '/plan', search: { id: trip._id, stage: undefined } })
    } else {
      setSelectedTrip(trip)
    }
  }

  function handleEdit(trip: Trip) {
    navigate({ to: '/plan', search: { id: trip._id, stage: undefined } })
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
        onSelect={handleSelect}
        onNew={() => navigate({ to: '/plan', search: { id: undefined, stage: undefined } })}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
      />

      <main className="home-main">
        {selectedTrip ? (
          <TripDetail
            trip={selectedTrip}
            onEdit={() => handleEdit(selectedTrip)}
            onDelete={() => setDeleteTarget(selectedTrip)}
            onLeave={() => setLeaveTarget(selectedTrip)}
            onTripUpdated={setSelectedTrip}
          />
        ) : (
          <EmptyState onNew={() => navigate({ to: '/plan', search: { id: undefined, stage: undefined } })} />
        )}
      </main>

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

function EmptyState({ onNew }: { onNew: () => void }) {
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