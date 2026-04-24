import { useState } from 'react'
import type { Trip } from '../../types'
import { TripHero } from './TripHero'
import { TripRightPanel } from './TripRightPanel'
import { ShareDialog } from './ShareDialog'
import { JournalSection } from '../journal/JournalSection'
import { MapTab } from '../map/MapTab'

type Tab = 'journal' | 'map' | 'photos' | 'gear'
const TABS: Tab[] = ['journal', 'map', 'photos', 'gear']

function tripDays(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1
}

interface Props {
  trip: Trip
  onEdit: () => void
  onDelete: () => void
  onTripUpdated: (trip: Trip) => void
}

export function TripDetail({ trip, onEdit, onDelete, onTripUpdated }: Props) {
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
        <div
          className="center-pane"
          style={activeTab === 'map' ? { padding: 0, overflow: 'hidden' } : undefined}
        >
          {activeTab === 'journal' ? (
            <>
              {trip.description && <p className="trip-description">{trip.description}</p>}
              <JournalSection trip={trip} />
            </>
          ) : activeTab === 'map' ? (
            <MapTab trip={trip} onTripUpdated={onTripUpdated} />
          ) : (
            <TabComingSoon label={activeTab} />
          )}
        </div>

        <TripRightPanel trip={trip} onTripUpdated={onTripUpdated} activeTab={activeTab} />
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

// ─── Tab coming-soon placeholder ──────────────────────────────────────────────

function TabComingSoon({ label }: { label: string }) {
  return (
    <div className="tab-coming-soon">
      <div className="tab-coming-soon__name">{label.charAt(0).toUpperCase() + label.slice(1)}</div>
      <p className="tab-coming-soon__label">Coming soon</p>
    </div>
  )
}
