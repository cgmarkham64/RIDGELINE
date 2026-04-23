import { useState } from 'react'
import type { Trip } from '../types'
import { TripSidebar } from '../components/trip/TripSidebar'
import { TripModal } from '../components/trip/TripModal'
import { DeleteConfirm } from '../components/trip/DeleteConfirm'
import { TripHero } from '../components/trip/TripHero'
import { TripRightPanel } from '../components/trip/TripRightPanel'
import { ShareDialog } from '../components/trip/ShareDialog'
import { JournalSection } from '../components/journal/JournalSection'

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalState = { mode: 'create' } | { mode: 'edit'; trip: Trip }
type Tab = 'journal' | 'map' | 'photos' | 'gear'
const TABS: Tab[] = ['journal', 'map', 'photos', 'gear']

function tripDays(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1
}

// ─── Page root ────────────────────────────────────────────────────────────────

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
    </div>
  )
}

// ─── Trip detail ──────────────────────────────────────────────────────────────

function TripDetail({
  trip, onEdit, onDelete, onTripUpdated,
}: {
  trip: Trip
  onEdit: () => void
  onDelete: () => void
  onTripUpdated: (trip: Trip) => void
}) {
  const days = tripDays(trip.startDate, trip.endDate)
  const [activeTab, setActiveTab] = useState<Tab>('journal')
  const [showShare, setShowShare] = useState(false)

  return (
    <div className="trip-detail">
      <TripHero
        trip={trip}
        days={days}
        onEdit={onEdit}
        onDelete={onDelete}
        onShare={() => setShowShare(true)}
      />

      <TabRow activeTab={activeTab} onChange={setActiveTab} />

      <div className="content-split">
        <div className="center-pane">
          {activeTab === 'journal' ? (
            <>
              {trip.description && (
                <p className="trip-description">{trip.description}</p>
              )}
              <JournalSection trip={trip} />
            </>
          ) : (
            <TabComingSoon label={activeTab} />
          )}
        </div>

        <TripRightPanel trip={trip} onTripUpdated={onTripUpdated} />
      </div>

      {showShare && <ShareDialog trip={trip} onClose={() => setShowShare(false)} />}
    </div>
  )
}

// ─── Tab row ──────────────────────────────────────────────────────────────────

function TabRow({ activeTab, onChange }: { activeTab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="tab-row">
      {TABS.map((tab) => (
        <button
          key={tab}
          className={`tab-btn${activeTab === tab ? ' active' : ''}`}
          onClick={() => onChange(tab)}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  )
}

// ─── Placeholder states ───────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">⛰</div>
      <h2 className="empty-state__title">No trip selected</h2>
      <p className="empty-state__body">
        Pick a trip from the sidebar, or create a new one to get started.
      </p>
      <button onClick={onNew} className="btn btn-primary">+ New trip</button>
    </div>
  )
}

function TabComingSoon({ label }: { label: string }) {
  return (
    <div className="tab-coming-soon">
      <div className="tab-coming-soon__name">
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </div>
      <p className="tab-coming-soon__label">Coming soon</p>
    </div>
  )
}