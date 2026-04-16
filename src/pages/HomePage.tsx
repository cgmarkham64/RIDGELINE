import { useState } from 'react'
import type { Trip } from '../types'
import { TripSidebar } from '../components/trip/TripSidebar'
import { TripModal } from '../components/trip/TripModal'
import { DeleteConfirm } from '../components/trip/DeleteConfirm'
import { JournalSection } from '../components/journal/JournalSection'

type ModalState = { mode: 'create' } | { mode: 'edit'; trip: Trip }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function HomePage() {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null)

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

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      <TripSidebar
        selectedId={selectedTrip?._id ?? null}
        onSelect={setSelectedTrip}
        onNew={() => setModal({ mode: 'create' })}
        onEdit={(trip) => setModal({ mode: 'edit', trip })}
        onDelete={setDeleteTarget}
      />

      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
        {selectedTrip ? (
          <TripDetail
            trip={selectedTrip}
            onEdit={() => setModal({ mode: 'edit', trip: selectedTrip })}
            onDelete={() => setDeleteTarget(selectedTrip)}
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
    </div>
  )
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{ fontSize: 40, marginBottom: 20, opacity: 0.3 }}>⛰</div>
      <h2 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 20,
        fontWeight: 700,
        color: 'var(--text)',
        marginBottom: 8,
      }}>
        No trip selected
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24, maxWidth: 260 }}>
        Pick a trip from the sidebar, or create a new one to get started.
      </p>
      <button onClick={onNew} className="btn btn-primary">
        + New trip
      </button>
    </div>
  )
}

function TripDetail({
  trip,
  onEdit,
  onDelete,
}: {
  trip: Trip
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 32px 64px' }}>
      {/* Trip header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--amber)',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}>
          <span style={{ display: 'inline-block', width: 12, height: 1, background: 'var(--amber)', opacity: 0.5 }} />
          {trip.location}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 34,
          fontWeight: 800,
          color: 'var(--text)',
          lineHeight: 1.05,
          letterSpacing: '-0.01em',
          marginBottom: 5,
        }}>
          {trip.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 300, fontStyle: 'italic', color: 'var(--text-mid)' }}>
            {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onEdit} className="btn btn-ghost btn-sm">Edit</button>
            <button onClick={onDelete} className="btn btn-danger btn-sm">Delete</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {(trip.distanceMiles != null || trip.elevationGainFt != null) && (
        <div style={{ display: 'flex', gap: 1, marginBottom: 20 }}>
          {trip.distanceMiles != null && (
            <StatBlock value={`${trip.distanceMiles}`} label="Miles" />
          )}
          {trip.elevationGainFt != null && (
            <StatBlock value={`+${trip.elevationGainFt.toLocaleString()}`} label="Elev. gain ft" />
          )}
        </div>
      )}

      {/* Description */}
      {trip.description && (
        <p style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: 'var(--text-mid)',
          marginBottom: 28,
          borderLeft: '2px solid var(--border)',
          paddingLeft: 14,
        }}>
          {trip.description}
        </p>
      )}

      {/* Journal */}
      <div style={{ marginTop: 40 }}>
        <JournalSection trip={trip} />
      </div>

      {/* Future sections */}
      <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PlaceholderSection label="GPX track & map" />
        <PlaceholderSection label="Photos" />
        <PlaceholderSection label="Gear loadout" />
      </div>
    </div>
  )
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div style={{
      background: 'rgba(15,13,11,0.82)',
      border: '1px solid var(--border)',
      padding: '9px 16px',
      textAlign: 'center',
    }}
      className="stat-block"
    >
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 17,
        fontWeight: 800,
        color: 'var(--amber)',
        lineHeight: 1,
        marginBottom: 3,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 7,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-dim)',
      }}>
        {label}
      </div>
    </div>
  )
}

function PlaceholderSection({ label }: { label: string }) {
  return (
    <div style={{
      borderRadius: 'var(--r-md)',
      border: '1px dashed var(--border)',
      padding: '12px 16px',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-dim)',
      }}>
        {label} — coming soon
      </span>
    </div>
  )
}