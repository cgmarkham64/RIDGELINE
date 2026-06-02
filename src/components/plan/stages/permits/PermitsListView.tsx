import { useState } from 'react'
import { IconMap, IconCheck, IconSearch, IconPlus } from '../../../icons'
import { PermitCard } from './PermitCard'
import { SuggestionRow } from './SuggestionRow'
import { PERMIT_TYPES } from './permitsStage.constants'
import type { Permit } from './permitsStage.types'
import type { PermitTypeName, PermitSource } from '../../types'

const TIER_DOT: Record<string, string> = {
  official:  'bg-pine',
  partner:   'bg-amber',
  community: 'bg-border-mid',
}

const TIER_LABEL: Record<string, string> = {
  official:  'Official',
  partner:   'Partner org',
  community: 'Community',
}

function TierDot({ tier }: { tier?: string }) {
  const cls = TIER_DOT[tier ?? 'community'] ?? TIER_DOT.community
  return (
    <span
      className={`inline-block shrink-0 w-1.5 h-1.5 rounded-full mt-px ${cls}`}
      title={TIER_LABEL[tier ?? 'community']}
    />
  )
}

export function PermitsListView({ permits, suggestions, onAcceptAll, onAccept, onReject, onRemove, onViewMap, onAddFreeform, onUpdatePermit, canEdit, partySize, scanning, scanError, lastScanned, sources, onRescan, permitFree, onMarkPermitFree }: {
  permits: Permit[]
  suggestions: Permit[]
  onAcceptAll: () => void
  onAccept: (p: Permit) => void
  onReject: (p: Permit) => void
  onRemove: (id: string) => void
  onViewMap: (p: Permit) => void
  onAddFreeform: () => void
  onUpdatePermit: (id: string, key: string, value: string) => void
  canEdit: boolean
  partySize: number
  scanning: boolean
  scanError: string | null
  lastScanned: string | undefined
  sources: PermitSource[]
  onRescan: () => void
  permitFree: boolean
  onMarkPermitFree: () => void
}) {
  const [search, setSearch] = useState('')

  const allPermits        = [...permits, ...suggestions]
  const uniqueTypeCount   = new Set(allPermits.map(p => p.type)).size
  const uniqueAgencyCount = new Set(allPermits.map(p => p.agency).filter(Boolean)).size

  const bannerHeading = scanning
    ? 'Scanning your route for permits…'
    : scanError
      ? `Scan failed — ${scanError}`
      : allPermits.length > 0
        ? `Found ${uniqueTypeCount} permit type${uniqueTypeCount !== 1 ? 's' : ''} across ${uniqueAgencyCount} agenc${uniqueAgencyCount !== 1 ? 'ies' : 'y'}`
        : lastScanned
          ? 'Based on these sources, we do not believe permits are required for this trip'
          : 'Import a route in Stage 1 to get AI-powered permit suggestions'

  return (
    <div className="flex flex-col gap-[22px]">

      {/* Detection banner */}
      <div className={`flex items-center gap-3 px-4 py-3 border rounded-lg ${
        permitFree   ? 'bg-pine-dim border-pine-border' :
        scanError    ? 'bg-red-dim border-red-border'   :
                       'bg-amber-dim border-amber-border'
      }`}>
        <span className={`shrink-0 ${permitFree ? 'text-pine' : scanError ? 'text-red' : 'text-amber'}`}>
          {permitFree ? <IconCheck size={16} /> : <IconMap size={16} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className={`font-heading text-body-sm font-bold ${permitFree ? 'text-pine' : scanError ? 'text-red' : 'text-amber'}`}>
            {bannerHeading}
          </div>
        </div>
        {canEdit && !scanning && !permitFree && (
          <div className="flex items-center gap-1.5 shrink-0">
            {lastScanned && allPermits.length === 0 && (
              <button
                onClick={onMarkPermitFree}
                className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-pine-border text-pine bg-pine-dim hover:brightness-95 transition-all cursor-pointer"
              >
                <IconCheck size={10} /> Confirm permit-free
              </button>
            )}
            <button
              onClick={onRescan}
              className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
            >
              Re-scan
            </button>
          </div>
        )}
        {scanning && (
          <span className="w-4 h-4 rounded-full border-2 border-amber border-t-transparent animate-spin shrink-0" />
        )}
      </div>

      {/* AI results disclaimer */}
      {lastScanned && !scanning && (
        <div className="flex flex-col gap-2.5 px-3 py-3 bg-surface border border-border rounded text-label text-text-dim font-mono">
          <div className="flex items-start gap-2">
            <span className="shrink-0 mt-px">⚠</span>
            <span>AI-generated suggestions — always verify before booking. Follow these steps:</span>
          </div>
          <ol className="flex flex-col gap-1 pl-5 list-decimal marker:text-text-dim">
            <li>Open each permit's booking page and confirm it applies to your dates and trailhead.</li>
            <li>Check availability and quota windows for your travel window.</li>
            <li>If anything looks off, call or email the issuing agency directly.</li>
          </ol>
          {sources.length > 0 && (
            <div className="flex flex-col gap-1 pt-1 border-t border-border">
              <span className="tracking-[0.12em] uppercase text-text-dim">Sources consulted</span>
              {sources.map(s => (
                <div key={s.url} className="flex items-start gap-1.5">
                  <TierDot tier={s.tier} />
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sky hover:underline"
                    title={TIER_LABEL[s.tier ?? 'community']}
                  >
                    {s.title}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Suggested for your route</div>
            {canEdit && (
              <button
                onClick={onAcceptAll}
                className="inline-flex items-center gap-1 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
              >
                <IconCheck size={10} /> Accept all
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {suggestions.map(s => (
              <SuggestionRow
                key={s.id}
                permit={s}
                onAccept={() => onAccept(s)}
                onReject={() => onReject(s)}
                onViewMap={() => onViewMap(s)}
                canEdit={canEdit}
              />
            ))}
          </div>
        </section>
      )}

      {/* Added permits */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">
            On this trip{permits.length > 0 ? ` (${permits.length})` : ''}
          </div>
          {permits.length === 0 && (
            <span className="font-mono text-label text-text-dim">nothing added yet</span>
          )}
        </div>
        {permits.length > 0 ? (
          <div className="flex flex-col gap-3">
            {permits.map(p => (
              <PermitCard
                key={p.id}
                permit={p}
                onRemove={() => onRemove(p.id)}
                onViewMap={() => onViewMap(p)}
                onUpdatePermit={(key, val) => onUpdatePermit(p.id, key, val)}
                canEdit={canEdit}
                partySize={partySize}
              />
            ))}
          </div>
        ) : (
          <div className="px-6 py-6 text-center border border-dashed border-border rounded-lg text-body-sm text-text-dim">
            {canEdit ? 'Accept a suggestion above, or add one manually below.' : 'No permits added yet.'}
          </div>
        )}
      </section>

      {/* Add another — only visible to editors */}
      {canEdit && (
        <section className="pt-1">
          <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">Add another</div>
          <div className="flex gap-2.5 p-1 bg-surface border border-border rounded-lg">
            <div className="flex-1 flex items-center gap-2 px-3 text-text-dim">
              <IconSearch />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search agencies, units, or trailheads…"
                className="flex-1 bg-transparent border-none text-body-sm text-text outline-none py-2.5 placeholder:text-text-dim"
              />
            </div>
            <button
              onClick={onAddFreeform}
              className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-3.5 py-2 border-l border-border text-text-mid bg-transparent hover:text-text hover:bg-surface-2 transition-colors cursor-pointer rounded-r"
            >
              <IconPlus size={10} /> Free-form
            </button>
          </div>
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {(Object.entries(PERMIT_TYPES) as [PermitTypeName, typeof PERMIT_TYPES[PermitTypeName]][]).map(([key, t]) => (
              <button
                key={key}
                onClick={onAddFreeform}
                title={t.hint}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border text-text-mid text-caption font-medium bg-transparent hover:border-border-mid hover:text-text transition-colors cursor-pointer"
              >
                <IconPlus size={9} /> {t.label}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}