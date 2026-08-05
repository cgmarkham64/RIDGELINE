import { useState, useEffect, useRef, useMemo } from 'react'
import { ProgressBar } from '../../ProgressBar'
import { CheckItem } from '../../CheckItem'
import { PermitsListView } from './PermitsListView'
import { FreeformDialog } from './FreeformDialog'
import { PartnersCard } from './PartnersCard'
import { CriticalDatesCard } from './CriticalDatesCard'
import { extractScanDates } from './criticalDates.helpers'
import { INITIAL_PERMITS } from './permitsStage.constants'
import { suggestPermits, lookupPermit, pickZoneProduct } from '../../../../lib/permits'
import type { PermitLookupResult } from '../../../../lib/permits'
import {
  detectZoneStays, buildZonePermit, buildLotteryProduct, buildAdvanceReservationProduct,
  buildSelfRegisterPermit, requireSeasonBound, routeSignature, zoneNeedId,
} from './zoneDetection.helpers'
import { extractApiError } from '../../../../lib/utils'
import { toDateMs } from './criticalDates.helpers'
import { HikerOverlay } from '../../../ui/HikerOverlay'
import { randomPermitSaying } from '../../../ui/sayings'
import type { Permit } from './permitsStage.types'
import type { StageBodyProps, PlanCriticalDate } from '../../types'

const CHECKLIST_TOTAL = 3
const PERCENT_MULTIPLIER = 100

export function PermitsStage({ plan, onChange, onProgress, trip, canEdit = true }: StageBodyProps) {
  const permitSaying = useMemo(() => randomPermitSaying(), [])

  const [permits, setPermits]               = useState<Permit[]>(() => (plan?.permits?.permits as Permit[] | undefined) ?? (plan !== undefined ? [] : INITIAL_PERMITS))
  const [links, setLinks]                   = useState(() => plan?.permits?.links ?? [])
  const [lastScanned, setLastScanned]       = useState<string | undefined>(() => plan?.permits?.lastScanned)
  const [scanning, setScanning]             = useState(false)
  const [scanError, setScanError]           = useState<string | null>(null)
  const [freeformOpen, setFreeformOpen]     = useState(false)
  const [editingPermit, setEditingPermit]   = useState<Permit | null>(null)
  const [aiPrefill, setAiPrefill]           = useState<{ confidence: PermitLookupResult['confidence']; verificationNote: string } | null>(null)
  const [lookupLoading, setLookupLoading]   = useState(false)
  const [lookupError, setLookupError]       = useState<string | null>(null)
  const [permitFree, setPermitFree]         = useState(() => plan?.permits?.permitFree ?? false)
  const [partyConfirmed, setPartyConfirmed] = useState(() => plan?.permits?.partyConfirmed ?? false)
  const [backupPlanned, setBackupPlanned]   = useState(() => plan?.permits?.backupPlanned ?? false)
  const [criticalDates, setCriticalDates]   = useState<PlanCriticalDate[]>(() => plan?.permits?.criticalDates ?? [])
  const [zoneDetectedAt, setZoneDetectedAt] = useState<string | undefined>(() => plan?.permits?.zoneDetectedAt)
  const [zoneDetectedSignature, setZoneDetectedSignature] =
    useState<string | undefined>(() => plan?.permits?.zoneDetectedSignature)
  const [zoneDetecting, setZoneDetecting]   = useState(false)
  const [zoneDetectError, setZoneDetectError] = useState<string | null>(null)

  const partySize = (trip?.sharedWith?.length ?? 0) + 1

  const scanDates = useMemo(() => extractScanDates(permits), [permits])

  const isMounted     = useRef(false)
  useEffect(() => () => { isMounted.current = false }, [])
  const onChangeRef   = useRef(onChange)
  const onProgressRef = useRef(onProgress)
  useEffect(() => { onChangeRef.current   = onChange   }, [onChange])
  useEffect(() => { onProgressRef.current = onProgress }, [onProgress])
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({
      permits: {
        permits, permitFree, partyConfirmed, backupPlanned, links, lastScanned, criticalDates,
        zoneDetectedAt, zoneDetectedSignature,
      },
    })
  }, [
    permits, permitFree, partyConfirmed, backupPlanned, links, lastScanned, criticalDates,
    zoneDetectedAt, zoneDetectedSignature,
  ])

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

  // Auto-detect zone-stay permits from route geometry. Re-runs whenever the route's
  // camp nights actually change (routeSignature), not just once ever — so editing the
  // route after visiting this stage keeps zone permits in sync instead of going stale.
  // Geometry decides which zones/nights are ground truth; the AI call only picks the
  // recgov product + copy. `force` lets the manual "Re-detect" button retry even when
  // the signature hasn't changed (e.g. after a transient AI failure).
  const zoneDetectingRef = useRef(false)
  async function runZoneDetection(force = false) {
    const segments = plan?.route?.segments
    if (!trip?._id || !trip.startDate || !segments || segments.length < 2 || zoneDetectingRef.current) return
    const signature = routeSignature(segments, trip.startDate)
    if (!force && signature === zoneDetectedSignature) return

    zoneDetectingRef.current = true
    setZoneDetecting(true)
    setZoneDetectError(null)

    try {
      const { needs, selfRegister } = detectZoneStays(segments, trip.startDate)
      const allNeeds = [...needs, ...selfRegister]
      const currentNeedIds = new Set(allNeeds.map(zoneNeedId))

      // Drop auto-detected permits whose zone-stay no longer exists on the route.
      // Never touches manually-added permits or ones a user has since edited away
      // from autoDetected — only ids we generated ourselves for a need that's gone.
      setPermits(prev => prev.filter(p => !(p.autoDetected && p.id.startsWith('zone_') && !currentNeedIds.has(p.id))))

      const existingIds = new Set(permits.filter(p => currentNeedIds.has(p.id)).map(p => p.id))
      const toAdd        = needs.filter(n => !existingIds.has(zoneNeedId(n)))
      const toAddSelfReg = selfRegister.filter(n => !existingIds.has(zoneNeedId(n)))

      // Self-register stays never need a booking product — build them straight away.
      const detected: Permit[] = toAddSelfReg.map(buildSelfRegisterPermit)
      let failures = 0
      for (const need of toAdd) {
        const p = need.zone.properties
        try {
          const product = p.overnight_permit.allocation === 'lottery'
            ? buildLotteryProduct(p)
            : p.overnight_permit.allocation === 'advance-reservation'
              ? buildAdvanceReservationProduct(p)
              : await pickZoneProduct(trip._id, {
                  zoneName:             p.name,
                  agency:               p.agency,
                  nights:               need.nights.length,
                  seasonStart:          requireSeasonBound(p.overnight_permit.season_start, p.name),
                  seasonEnd:            requireSeasonBound(p.overnight_permit.season_end, p.name),
                  recgov:               p.recgov,
                  campfiresAllowed:     p.campfires_allowed,
                  bearCanisterRequired: p.bear_canister_required,
                  designatedSitesOnly:  p.designated_sites_only,
                })
          detected.push(buildZonePermit(need, partySize, product))
        } catch {
          failures++
        }
      }
      if (detected.length > 0) {
        setPermits(prev => [...prev, ...detected.filter(d => !prev.some(p => p.id === d.id))])
      }
      setZoneDetectError(failures > 0
        ? `Couldn't auto-fill ${failures} zone permit${failures !== 1 ? 's' : ''} — try Re-detect, or add ${failures !== 1 ? 'them' : 'it'} manually.`
        : null)
      setZoneDetectedSignature(signature)
    } catch {
      setZoneDetectError('Zone detection failed — try Re-detect, or add permits manually.')
    } finally {
      setZoneDetecting(false)
      setZoneDetectedAt(new Date().toISOString())
      zoneDetectingRef.current = false
    }
  }

  useEffect(() => {
    // Deferred a tick so the detection's state updates don't fire synchronously
    // within this effect — also means a rapid second dep change here cancels the
    // stale run before it starts, instead of letting it kick off unnecessarily.
    const timer = setTimeout(() => { runZoneDetection() }, 0)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?._id, trip?.startDate, plan?.route?.segments])

  function remove(id: string) { setPermits(prev => prev.filter(p => p.id !== id)) }

  function handleDialogSave(p: Permit) {
    const isExisting = permits.some(existing => existing.id === p.id)
    if (isExisting) {
      setPermits(prev => prev.map(existing => existing.id === p.id ? p : existing))
    } else {
      setPermits(prev => [...prev, p])
    }
    setEditingPermit(null)
    setAiPrefill(null)
    setFreeformOpen(false)
  }

  function openEdit(id: string) {
    const permit = permits.find(p => p.id === id)
    if (permit) { setEditingPermit(permit); setAiPrefill(null); setFreeformOpen(true) }
  }

  async function handleSearch(permitName: string) {
    if (!trip?._id || lookupLoading) return
    setLookupLoading(true)
    setLookupError(null)
    try {
      const result = await lookupPermit(trip._id, permitName, links)
      const permitId = `lookup_${Date.now()}`
      const prefilled: Permit = {
        id:            permitId,
        type:          result.type,
        name:          result.name,
        agency:        result.agency,
        why:           result.why,
        url:           result.url,
        fields:        {},
        party:         partySize,
        confidence:    result.confidence,
        criticalDates: result.criticalDates
          .filter(d => !!d.dateStr)
          .map((d, i) => ({
            id:      `pcd_${permitId}_${i}`,
            dateMs:  toDateMs(d.dateStr!, d.timeStr),
            hasTime: !!d.timeStr,
            label:   d.label,
            tone:    d.tone,
            source:  'permit' as const,
          })),
      }
      setEditingPermit(prefilled)
      setAiPrefill({ confidence: result.confidence, verificationNote: result.verificationNote })
      setFreeformOpen(true)
    } catch (err) {
      setLookupError(extractApiError(err) ?? 'Lookup failed — try a different name or add manually')
    } finally {
      setLookupLoading(false)
    }
  }

  function updatePermitField(id: string, key: string, value: string) {
    setPermits(prev => prev.map(p => p.id === id ? { ...p, fields: { ...p.fields, [key]: value } } : p))
  }

  // scanDateId format from extractScanDates: permit__${permitId}__${cdId}
  function removeScanDate(scanDateId: string) {
    const [, permitId, cdId] = scanDateId.split('__')
    if (!permitId || !cdId) return
    setPermits(prev => prev.map(p =>
      p.id !== permitId ? p : { ...p, criticalDates: p.criticalDates?.filter(cd => cd.id !== cdId) ?? [] }
    ))
  }

  const item1 = permits.length > 0
  const item2 = partyConfirmed
  const item3 = backupPlanned
  const doneCount = [item1, item2, item3].filter(Boolean).length
  const progress  = Math.round((doneCount / CHECKLIST_TOTAL) * PERCENT_MULTIPLIER)

  useEffect(() => {
    onProgressRef.current?.(permitFree ? 2 : doneCount, permitFree ? 2 : CHECKLIST_TOTAL)
  }, [doneCount, permitFree])

  const locationLabel = trip?.location ?? trip?.title ?? ''

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8 pb-20">
        <div className="grid gap-7 grid-cols-[1fr_360px]">

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
              onAddFreeform={() => { setEditingPermit(null); setAiPrefill(null); setFreeformOpen(true) }}
              onUpdatePermit={updatePermitField}
              canEdit={canEdit}
              partySize={partySize}
              scanning={scanning}
              scanError={scanError}
              lastScanned={lastScanned}
              onRescan={runScan}
              permitFree={permitFree}
              onMarkPermitFree={() => setPermitFree(true)}
              onSearch={handleSearch}
              lookupLoading={lookupLoading}
              lookupError={lookupError}
              canLookup={!!trip?._id}
              zoneDetecting={zoneDetecting}
              zoneDetectError={zoneDetectError}
              zoneDetectedAt={zoneDetectedAt}
              onRedetectZones={() => runZoneDetection(true)}
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
                  <CheckItem text="Walk-up backup planned"     done={item3} onToggle={canEdit ? () => setBackupPlanned(v => !v) : undefined} />
                </>
              )}
              <div className="h-px bg-border my-3" />
              <ProgressBar value={permitFree ? PERCENT_MULTIPLIER : progress} tone={permitFree ? 'pine' : 'amber'} />
              <div className="font-mono text-label text-text-dim text-center mt-1.5">
                {permitFree ? '2 of 2 · permit-free' : `${doneCount} of ${CHECKLIST_TOTAL}`}
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
              onRemove={id => {
                if (id.startsWith('permit__')) removeScanDate(id)
                else setCriticalDates(prev => prev.filter(d => d.id !== id))
              }}
            />
          </aside>
        </div>
      </div>

      {lookupLoading && (
        <HikerOverlay label="Looking up permit details…" saying={permitSaying} />
      )}

      {zoneDetecting && (
        <HikerOverlay label="Checking your route against known permit zones…" saying={permitSaying} />
      )}

      {freeformOpen && (
        <FreeformDialog
          onClose={() => { setFreeformOpen(false); setEditingPermit(null); setAiPrefill(null) }}
          onSave={handleDialogSave}
          partySize={partySize}
          initialPermit={editingPermit ?? undefined}
          aiPrefill={aiPrefill ?? undefined}
        />
      )}
    </>
  )
}
