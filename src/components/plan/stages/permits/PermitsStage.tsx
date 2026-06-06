import { useState, useEffect, useRef, useMemo } from 'react'
import { ProgressBar } from '../../ProgressBar'
import { CheckItem } from '../../CheckItem'
import { PermitsListView } from './PermitsListView'
import { FreeformDialog } from './FreeformDialog'
import { PartnersCard } from './PartnersCard'
import { CriticalDatesCard } from './CriticalDatesCard'
import { extractScanDates } from './criticalDates.helpers'
import { INITIAL_PERMITS } from './permitsStage.constants'
import { suggestPermits } from '../../../../lib/permits'
import { extractApiError } from '../../../../lib/utils'
import type { Permit } from './permitsStage.types'
import type { StageBodyProps, PlanCriticalDate } from '../../types'

export function PermitsStage({ plan, onChange, onProgress, trip, canEdit = true }: StageBodyProps) {
  const [permits, setPermits]               = useState<Permit[]>(() => (plan?.permits?.permits as Permit[] | undefined) ?? (plan !== undefined ? [] : INITIAL_PERMITS))
  const [links, setLinks]                   = useState(() => plan?.permits?.links ?? [])
  const [lastScanned, setLastScanned]       = useState<string | undefined>(() => plan?.permits?.lastScanned)
  const [scanning, setScanning]             = useState(false)
  const [scanError, setScanError]           = useState<string | null>(null)
  const [freeformOpen, setFreeformOpen]     = useState(false)
  const [editingPermit, setEditingPermit]   = useState<Permit | null>(null)
  const [permitFree, setPermitFree]         = useState(() => plan?.permits?.permitFree ?? false)
  const [partyConfirmed, setPartyConfirmed] = useState(() => plan?.permits?.partyConfirmed ?? false)
  const [remindersSet, setRemindersSet]     = useState(() => plan?.permits?.remindersSet ?? false)
  const [backupPlanned, setBackupPlanned]   = useState(() => plan?.permits?.backupPlanned ?? false)
  const [criticalDates, setCriticalDates]   = useState<PlanCriticalDate[]>(() => plan?.permits?.criticalDates ?? [])

  const scanDates = useMemo(() => extractScanDates(permits), [permits])

  const isMounted     = useRef(false)
  useEffect(() => () => { isMounted.current = false }, [])
  const onChangeRef   = useRef(onChange)
  const onProgressRef = useRef(onProgress)
  useEffect(() => { onChangeRef.current   = onChange   }, [onChange])
  useEffect(() => { onProgressRef.current = onProgress }, [onProgress])
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ permits: { permits, permitFree, partyConfirmed, remindersSet, backupPlanned, links, lastScanned, criticalDates } })
  }, [permits, permitFree, partyConfirmed, remindersSet, backupPlanned, links, lastScanned, criticalDates])

  async function runScan() {
    if (!trip?._id || scanning) return
    setScanning(true)
    setScanError(null)
    try {
      const { links: found } = await suggestPermits(trip._id)
      setLinks(found)
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

  function remove(id: string) { setPermits(prev => prev.filter(p => p.id !== id)) }

  function handleDialogSave(p: Permit) {
    if (editingPermit) {
      setPermits(prev => prev.map(existing => existing.id === p.id ? p : existing))
    } else {
      setPermits(prev => [...prev, p])
    }
    setEditingPermit(null)
    setFreeformOpen(false)
  }

  function openEdit(id: string) {
    const permit = permits.find(p => p.id === id)
    if (permit) { setEditingPermit(permit); setFreeformOpen(true) }
  }

  function updatePermitField(id: string, key: string, value: string) {
    setPermits(prev => prev.map(p => p.id === id ? { ...p, fields: { ...p.fields, [key]: value } } : p))
  }

  const item1 = permits.length > 0
  const item2 = partyConfirmed
  const item3 = remindersSet
  const item4 = backupPlanned
  const doneCount = [item1, item2, item3, item4].filter(Boolean).length
  const progress  = Math.round((doneCount / 4) * 100)

  useEffect(() => {
    onProgressRef.current?.(permitFree ? 2 : doneCount, permitFree ? 2 : 4)
  }, [doneCount, permitFree])

  const partySize     = (trip?.sharedWith?.length ?? 0) + 1
  const locationLabel = trip?.location ?? trip?.title ?? ''

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8 pb-20">
        <div className="grid gap-7 grid-cols-[1fr_320px]">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-[18px]">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-heading text-body-lg font-extrabold text-text">Permits &amp; access</div>
                {locationLabel && (
                  <div className="font-mono text-label text-text-dim mt-0.5">{locationLabel}</div>
                )}
              </div>
            </div>

            <PermitsListView
              permits={permits}
              links={links}
              onRemove={remove}
              onEditPermit={openEdit}
              onAddFreeform={() => { setEditingPermit(null); setFreeformOpen(true) }}
              onUpdatePermit={updatePermitField}
              canEdit={canEdit}
              partySize={partySize}
              scanning={scanning}
              scanError={scanError}
              lastScanned={lastScanned}
              onRescan={runScan}
              permitFree={permitFree}
              onMarkPermitFree={() => setPermitFree(true)}
            />
          </div>

          {/* ── Right rail ── */}
          <aside className="flex flex-col gap-3.5">

            <div className="bg-surface border border-border rounded-lg p-3.5">
              <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">This stage</div>
              {permitFree ? (
                <>
                  <CheckItem text="Route reviewed for permits" done />
                  <CheckItem text="Confirmed — no permits required" done onToggle={canEdit ? () => setPermitFree(false) : undefined} />
                </>
              ) : (
                <>
                  <CheckItem text="At least one permit added"  done={item1} />
                  <CheckItem text="Party size confirmed"       done={item2} onToggle={canEdit ? () => setPartyConfirmed(v => !v) : undefined} />
                  <CheckItem text="Reminders set"              done={item3} onToggle={canEdit ? () => setRemindersSet(v => !v) : undefined} />
                  <CheckItem text="Walk-up backup planned"     done={item4} onToggle={canEdit ? () => setBackupPlanned(v => !v) : undefined} />
                </>
              )}
              <div className="h-px bg-border my-3" />
              <ProgressBar value={permitFree ? 100 : progress} tone={permitFree ? 'pine' : 'amber'} />
              <div className="font-mono text-label text-text-dim text-center mt-1.5">
                {permitFree ? '2 of 2 · permit-free' : `${doneCount} of 4`}
              </div>
            </div>

            <PartnersCard
              trip={trip}
              canEdit={canEdit}
              onInviteSent={() => {}}
              onNoPartners={() => setPartyConfirmed(true)}
              partyConfirmed={partyConfirmed}
              onConfirmParty={() => setPartyConfirmed(true)}
            />

            <CriticalDatesCard
              manualDates={criticalDates}
              scanDates={scanDates}
              canEdit={canEdit}
              onAdd={d => setCriticalDates(prev => [...prev, d])}
              onRemove={id => setCriticalDates(prev => prev.filter(d => d.id !== id))}
            />
          </aside>
        </div>
      </div>

      {freeformOpen && (
        <FreeformDialog
          onClose={() => { setFreeformOpen(false); setEditingPermit(null) }}
          onSave={handleDialogSave}
          partySize={partySize}
          initialPermit={editingPermit ?? undefined}
        />
      )}
    </>
  )
}
