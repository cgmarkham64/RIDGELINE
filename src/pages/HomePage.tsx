import { useState } from 'react'
import type { Trip } from '../types'
import { TripSidebar } from '../components/trip/TripSidebar'
import { TripModal } from '../components/trip/TripModal'
import { DeleteConfirm } from '../components/trip/DeleteConfirm'
import { JournalSection } from '../components/journal/JournalSection'
import { GpxMapSection } from '../components/trip/GpxMapSection'

type ModalState = { mode: 'create' } | { mode: 'edit'; trip: Trip }

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' }
  const full: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', full)}`
  }
  return `${s.toLocaleDateString('en-US', full)} – ${e.toLocaleDateString('en-US', full)}`
}

function tripDays(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1
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

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', textAlign: 'center', padding: '2rem',
    }}>
      <div style={{ fontSize: 40, marginBottom: 20, opacity: 0.3 }}>⛰</div>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
        No trip selected
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24, maxWidth: 260 }}>
        Pick a trip from the sidebar, or create a new one to get started.
      </p>
      <button onClick={onNew} className="btn btn-primary">+ New trip</button>
    </div>
  )
}

// ─── Trip detail ──────────────────────────────────────────────────────────────

function TripDetail({
  trip,
  onEdit,
  onDelete,
  onTripUpdated,
}: {
  trip: Trip
  onEdit: () => void
  onDelete: () => void
  onTripUpdated: (trip: Trip) => void
}) {
  const days = tripDays(trip.startDate, trip.endDate)
  const [activeTab, setActiveTab] = useState<'journal' | 'map' | 'photos' | 'gear'>('journal')
  const [showShare, setShowShare] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div style={{ height: 240, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {/* Gradient background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, #1c1308 0%, #2e2618 22%, #3c3c2c 48%, #5a6858 72%, #8a9a88 100%)',
        }} />
        {/* Mountain silhouette */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}>
          <svg viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice"
            style={{ display: 'block', width: '100%', height: 200 }}>
            <polygon
              points="0,200 130,200 230,68 340,140 470,28 590,108 710,44 840,125 970,62 1100,138 1200,90 1200,200"
              fill="#0f0d0b" opacity="0.97"
            />
            <polygon
              points="0,200 80,200 170,105 280,160 400,55 510,122 630,50 760,130 890,68 1020,148 1130,88 1200,120 1200,200"
              fill="#13100a" opacity="0.52"
            />
          </svg>
        </div>
        {/* Vignette overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(15,13,11,1) 0%, rgba(15,13,11,0.55) 32%, rgba(15,13,11,0.1) 65%, transparent 100%)',
        }} />
        {/* Hero body */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '20px 26px',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14,
        }}>
          {/* Left: location, title, dates */}
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--amber)', marginBottom: 6,
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <span style={{ display: 'inline-block', width: 12, height: 1, background: 'var(--amber)', opacity: 0.5 }} />
              {trip.location}
            </div>
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 800,
              color: 'var(--text)', lineHeight: 1.05, letterSpacing: '-0.01em', marginBottom: 5,
            }}>
              {trip.title}
            </h1>
            <div style={{ fontSize: 13, fontWeight: 300, fontStyle: 'italic', color: 'var(--text-mid)' }}>
              {formatDateRange(trip.startDate, trip.endDate)} &nbsp;·&nbsp; {days} {days === 1 ? 'day' : 'days'}
            </div>
          </div>
          {/* Right: action buttons + stat blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={onEdit} className="btn btn-ghost btn-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  style={{ width: 13, height: 13, strokeWidth: 2, flexShrink: 0 }}>
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Trip
              </button>
              <button onClick={() => setShowShare(true)} className="btn btn-sky btn-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  style={{ width: 13, height: 13, strokeWidth: 2, flexShrink: 0 }}>
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <button onClick={onDelete} className="btn btn-danger btn-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  style={{ width: 13, height: 13, strokeWidth: 2, flexShrink: 0 }}>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" />
                </svg>
                Delete
              </button>
            </div>
            {/* Stat pill strip */}
            <div style={{ display: 'flex', gap: 1, borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
              <StatBlock value={String(days)} label={days === 1 ? 'day' : 'days'} />
              {trip.distanceMiles != null && (
                <StatBlock value={String(trip.distanceMiles)} label="miles" />
              )}
              {trip.elevationGainFt != null && (
                <StatBlock value={`+${trip.elevationGainFt.toLocaleString()}`} label="elev. gain" />
              )}
              {(trip.distanceMiles == null && trip.elevationGainFt == null) && null}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab row ───────────────────────────────────────── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', padding: '0 26px',
        flexShrink: 0, overflowX: 'auto',
      }}>
        {(['journal', 'map', 'photos', 'gear'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontFamily: 'var(--font-heading)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              padding: '12px 16px', whiteSpace: 'nowrap', flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === tab ? 'var(--amber)' : 'transparent'}`,
              marginBottom: -1,
              color: activeTab === tab ? 'var(--amber)' : 'var(--text-dim)',
              transition: 'color 0.12s, border-color 0.12s',
            }}
            onMouseEnter={e => { if (activeTab !== tab) (e.target as HTMLElement).style.color = 'var(--text-mid)' }}
            onMouseLeave={e => { if (activeTab !== tab) (e.target as HTMLElement).style.color = 'var(--text-dim)' }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Content split: center pane + right panel ─────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Column 2 — active tab content, scrolls independently */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', minWidth: 0 }}>
          {activeTab === 'journal' && (
            <>
              {trip.description && (
                <p style={{
                  fontSize: 13, lineHeight: 1.7, color: 'var(--text-dim)',
                  marginBottom: 24, borderLeft: '2px solid var(--border)', paddingLeft: 14,
                }}>
                  {trip.description}
                </p>
              )}
              <JournalSection trip={trip} />
            </>
          )}
          {activeTab !== 'journal' && (
            <TabComingSoon label={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
          )}
        </div>

        {/* Column 3 — persistent summary panel, scrolls independently */}
        <div style={{
          width: 300, flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          background: 'var(--surface)',
          overflowY: 'auto', padding: '18px 14px',
        }}>
          <RpSection label="Route Map">
            <GpxMapSection trip={trip} onTripUpdated={onTripUpdated} />
          </RpSection>
          <RpSection label="Elevation Profile">
            <ComingSoon />
          </RpSection>
          <RpSection label="Waypoints">
            <ComingSoon />
          </RpSection>
          <RpSection label="Weight Breakdown">
            <ComingSoon />
          </RpSection>

          {/* Map tile attribution */}
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.06em',
            color: 'var(--text-dim)', lineHeight: 1.7, paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}>
            Map data &copy;{' '}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer"
              style={{ color: 'var(--text-dim)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
              OpenStreetMap
            </a>{' '}contributors, tiles by{' '}
            <a href="https://carto.com/attributions" target="_blank" rel="noreferrer"
              style={{ color: 'var(--text-dim)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
              CARTO
            </a>
          </div>
        </div>
      </div>

      {showShare && (
        <ShareDialog trip={trip} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}

// ─── Share dialog ─────────────────────────────────────────────────────────────

function ShareDialog({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border-mid)',
          borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 420, margin: '0 16px',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
              Share trip
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginTop: 3 }}>
              {trip.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 'var(--r-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-dim)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 14, height: 14, strokeWidth: 2 }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Copy link */}
          <div style={{
            border: `1px solid ${copied ? 'var(--pine-border)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)', padding: '14px 16px',
            background: copied ? 'var(--pine-dim)' : 'var(--surface2)',
            transition: 'all 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                  Copy link
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
                  Share a direct link to this trip
                </div>
              </div>
              <button onClick={copyLink} className={`btn btn-sm ${copied ? 'btn-ghost' : 'btn-sky'}`} style={{ flexShrink: 0 }}>
                {copied ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 12, height: 12, strokeWidth: 2.5, color: 'var(--pine)' }}>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span style={{ color: 'var(--pine)' }}>Copied</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 12, height: 12, strokeWidth: 2 }}>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Export PDF */}
          <div style={{
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            padding: '14px 16px', background: 'var(--surface2)', opacity: 0.6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                  Export as PDF
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
                  Styled trip report with journal, map &amp; stats
                </div>
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--text-dim)',
                border: '1px solid var(--border)', borderRadius: 3,
                padding: '3px 7px', flexShrink: 0,
              }}>
                Coming soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Right-panel section wrapper ─────────────────────────────────────────────

function RpSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontFamily: 'var(--font-heading)', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)',
        paddingBottom: 8, marginBottom: 12, borderBottom: '1px solid var(--border)',
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function TabComingSoon({ label }: { label: string }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 10, color: 'var(--text-dim)',
    }}>
      <div style={{
        fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800,
        color: 'var(--text)', opacity: 0.15,
      }}>
        {label}
      </div>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)',
      }}>
        Coming soon
      </p>
    </div>
  )
}

function ComingSoon() {
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px dashed var(--border)',
      borderRadius: 'var(--r-md)', padding: '22px 16px', textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--text-dim)',
      }}>
        Coming soon
      </p>
    </div>
  )
}

// ─── Stat block ───────────────────────────────────────────────────────────────

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div style={{
      background: 'rgba(15,13,11,0.82)',
      border: '1px solid var(--border)',
      padding: '9px 14px',
      textAlign: 'center',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    }}>
      <div style={{
        fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 800,
        color: 'var(--amber)', lineHeight: 1, marginBottom: 3,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 7,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)',
      }}>
        {label}
      </div>
    </div>
  )
}