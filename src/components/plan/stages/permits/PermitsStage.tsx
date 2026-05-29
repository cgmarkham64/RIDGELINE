import { useState, useEffect, useRef } from 'react'
import { IconX, IconCheck, IconList, IconLayers } from '../../../icons'
import { ProgressBar } from '../../ProgressBar'
import { CheckItem } from '../../CheckItem'
import { PermitsListView } from './PermitsListView'
import { PermitsMapView, MapModal } from './PermitsMapView'
import { FreeformDialog } from './FreeformDialog'
import { PartnersCard } from '../route/PartnersCard'
import { INITIAL_PERMITS, CRITICAL_DATES, TONE_CLS } from './permitsStage.constants'
import { suggestPermits } from '../../../../lib/permits'
import { extractApiError } from '../../../../lib/utils'
import type { Permit, PermitTone, ViewMode } from './permitsStage.types'
import type { StageBodyProps } from '../../types'

function DateRow({ date, label, tone, last }: { date: string; label: string; tone: PermitTone; last?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 py-2 ${last ? '' : 'border-b border-border'}`}>
      <span className={`font-mono text-caption font-bold px-1.5 py-0.5 rounded border shrink-0 ${TONE_CLS[tone]}`}>{date}</span>
      <span className="text-fine text-text-mid flex-1">{label}</span>
    </div>
  )
}

export function PermitsStage({ onJump, plan, onChange, onProgress, trip, canEdit = true }: StageBodyProps) {
  const [viewMode, setViewMode]         = useState<ViewMode>('list')
  const [permits, setPermits]           = useState<Permit[]>(() => (plan?.permits?.permits as Permit[] | undefined) ?? (plan !== undefined ? [] : INITIAL_PERMITS))
  const [suggestions, setSuggestions]   = useState<Permit[]>(() => (plan?.permits?.suggestions as Permit[] | undefined) ?? [])
  const [sources, setSources]           = useState(() => plan?.permits?.sources ?? [])
  const [lastScanned, setLastScanned]   = useState<string | undefined>(() => plan?.permits?.lastScanned)
  const [scanning, setScanning]         = useState(false)
  const [scanError, setScanError]       = useState<string | null>(null)
  const [mapModalPermit, setMapModal]   = useState<Permit | null>(null)
  const [freeformOpen, setFreeformOpen] = useState(false)
  const [permitFree, setPermitFree]     = useState(() => plan?.permits?.permitFree ?? false)
  const [partyConfirmed, setPartyConfirmed] = useState(false)
  const remindersSet  = false
  const backupPlanned = false

  const isMounted    = useRef(false)
  useEffect(() => () => { isMounted.current = false }, [])
  const onChangeRef   = useRef(onChange)
  const onProgressRef = useRef(onProgress)
  useEffect(() => { onChangeRef.current   = onChange   }, [onChange])
  useEffect(() => { onProgressRef.current = onProgress }, [onProgress])
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ permits: { permits, permitFree, suggestions, lastScanned, sources } })
  }, [permits, permitFree, suggestions, lastScanned, sources])

  async function runScan() {
    if (!trip?._id || scanning) return
    setScanning(true)
    setScanError(null)
    try {
      const { permits: found, sources: foundSources } = await suggestPermits(trip._id)
      setSuggestions(found as Permit[])
      setSources(foundSources)
      setLastScanned(new Date().toISOString())
    } catch (err) {
      setScanError(extractApiError(err) ?? 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  const autoScannedRef = useRef(false)
  useEffect(() => {
    if (trip?._id && trip.gpxPlanned && !lastScanned && !autoScannedRef.current) {
      autoScannedRef.current = true
      runScan()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?._id])

  function accept(p: Permit) {
    setPermits(prev => prev.some(x => x.id === p.id) ? prev : [...prev, p])
    setSuggestions(prev => prev.filter(x => x.id !== p.id))
  }
  function acceptAll() {
    setPermits(prev => [...prev, ...suggestions.filter(s => !prev.some(p => p.id === s.id))])
    setSuggestions([])
  }
  function reject(p: Permit) { setSuggestions(prev => prev.filter(x => x.id !== p.id)) }
  function remove(id: string) { setPermits(prev => prev.filter(p => p.id !== id)) }
  function addCustom(p: Permit) { setPermits(prev => [...prev, p]); setFreeformOpen(false) }
  function updatePermitField(id: string, key: string, value: string) {
    setPermits(prev => prev.map(p => p.id === id ? { ...p, fields: { ...p.fields, [key]: value } } : p))
  }

  const item1 = permits.length > 0
  const item2 = suggestions.length === 0
  const item3 = partyConfirmed
  const item4 = remindersSet
  const item5 = backupPlanned
  const doneCount = [item1, item2, item3, item4, item5].filter(Boolean).length
  const progress  = Math.round((doneCount / 5) * 100)

  useEffect(() => {
    onProgressRef.current?.(permitFree ? 2 : doneCount, permitFree ? 2 : 5)
  }, [doneCount, permitFree])

  const partySize    = (trip?.sharedWith?.length ?? 0) + 1
  const locationLabel = trip?.location ?? trip?.title ?? ''

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8 pb-20">
        <div className="grid gap-7 max-w-[1100px] grid-cols-[1fr_320px]">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-[18px]">

            {/* Section header + List ⇄ Map toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-heading text-body-lg font-extrabold text-text">Permits & access</div>
                {locationLabel && (
                  <div className="font-mono text-label text-text-dim mt-0.5">{locationLabel}</div>
                )}
              </div>
              <div className="flex items-stretch bg-surface-2 border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-caption font-heading font-bold tracking-[0.06em] uppercase transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-amber-dim text-amber'
                      : 'bg-transparent text-text-mid hover:text-text hover:bg-surface-3'
                  }`}
                >
                  <IconList /> List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-caption font-heading font-bold tracking-[0.06em] uppercase transition-colors cursor-pointer border-l border-border ${
                    viewMode === 'map'
                      ? 'bg-amber-dim text-amber'
                      : 'bg-transparent text-text-mid hover:text-text hover:bg-surface-3'
                  }`}
                >
                  <IconLayers /> Map
                </button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <PermitsListView
                permits={permits}
                suggestions={suggestions}
                onAcceptAll={acceptAll}
                onAccept={accept}
                onReject={reject}
                onRemove={remove}
                onViewMap={p => setMapModal(p)}
                onAddFreeform={() => setFreeformOpen(true)}
                onUpdatePermit={updatePermitField}
                partyConfirmed={partyConfirmed}
                onConfirmParty={() => setPartyConfirmed(true)}
                onJump={onJump}
                canEdit={canEdit}
                partySize={partySize}
                scanning={scanning}
                scanError={scanError}
                lastScanned={lastScanned}
                sources={sources}
                onRescan={runScan}
              />
            ) : (
              <PermitsMapView
                permits={permits}
                suggestions={suggestions}
                onAccept={accept}
                onViewMap={p => setMapModal(p)}
                onJump={onJump}
                canEdit={canEdit}
              />
            )}
          </div>

          {/* ── Right rail ── */}
          <aside className="flex flex-col gap-3.5">

            <div className="bg-surface border border-border rounded-lg p-3.5">
              <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
              {permitFree ? (
                <>
                  <CheckItem text="Route reviewed for permits" done />
                  <CheckItem text="Confirmed — no permits required" done />
                </>
              ) : (
                <>
                  <CheckItem text="At least one permit added"  done={item1} />
                  <CheckItem text="All suggestions reviewed"   done={item2} />
                  <CheckItem text="Party size confirmed"       done={item3} />
                  <CheckItem text="Reminders set"              done={item4} />
                  <CheckItem text="Walk-up backup planned"     done={item5} />
                </>
              )}
              <div className="h-px bg-border my-3" />
              <ProgressBar value={permitFree ? 100 : progress} tone={permitFree ? 'pine' : 'amber'} />
              <div className="font-mono text-label text-text-dim text-center mt-1.5">
                {permitFree ? '2 of 2 · permit-free' : `${doneCount} of 5`}
              </div>
            </div>

            <PartnersCard
              trip={trip}
              canEdit={canEdit}
              onInviteSent={() => {}}
              onNoPartners={() => {}}
            />

            {!permitFree && (
              <div className="bg-surface border border-border rounded-lg p-3.5">
                <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-1">Critical dates</div>
                {CRITICAL_DATES.map((d, i) => (
                  <DateRow key={d.label} {...d} last={i === CRITICAL_DATES.length - 1} />
                ))}
              </div>
            )}

            {canEdit && (!permitFree ? (
              <div className="flex items-start gap-2.5 px-3 py-3 bg-pine-dim border border-pine-border rounded-lg">
                <span className="text-pine shrink-0 mt-0.5"><IconCheck size={14} /></span>
                <div className="text-fine text-text-mid">
                  <span className="font-semibold text-text">No permit needed?</span>{' '}
                  If you've reviewed and your trip is permit-free, mark this stage complete.
                  <button
                    onClick={() => setPermitFree(true)}
                    className="block mt-2 font-mono text-label tracking-[0.12em] uppercase text-pine hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0"
                  >
                    Mark as permit-free →
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 px-3 py-3 bg-pine-dim border border-pine-border rounded-lg">
                <span className="text-pine shrink-0 mt-0.5"><IconCheck size={14} /></span>
                <div className="flex-1 text-fine text-text-mid">
                  <span className="font-semibold text-text">Stage complete — permit-free trip.</span>
                </div>
                <button
                  onClick={() => setPermitFree(false)}
                  className="text-text-dim hover:text-text p-0.5 transition-colors bg-transparent border-none cursor-pointer shrink-0"
                  title="Undo"
                >
                  <IconX size={12} />
                </button>
              </div>
            ))}
          </aside>
        </div>
      </div>

      {mapModalPermit && (
        <MapModal permit={mapModalPermit} onClose={() => setMapModal(null)} />
      )}
      {freeformOpen && (
        <FreeformDialog onClose={() => setFreeformOpen(false)} onAdd={addCustom} partySize={partySize} />
      )}
    </>
  )
}