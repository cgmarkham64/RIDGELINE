import { useState } from 'react'
import { IconMap, IconCheck, IconSearch, IconPlus, IconAlertTriangle, IconExternalLink } from '../../../icons'
import { PermitCard } from './PermitCard'
import type { Permit } from './permitsStage.types'
import type { PermitLink } from '../../types'

function linkDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

const isBookable = (url: string) => linkDomain(url) === 'recreation.gov'

export function PermitsListView({
  permits, links, onRemove, onEditPermit, onAddFreeform, onUpdatePermit,
  canEdit, partySize, scanning, scanError, lastScanned, onRescan,
  permitFree, onMarkPermitFree,
  onSearch, lookupLoading, lookupError, canLookup,
}: {
  permits:          Permit[]
  links:            PermitLink[]
  onRemove:         (id: string) => void
  onEditPermit:     (id: string) => void
  onAddFreeform:    () => void
  onUpdatePermit:   (id: string, key: string, value: string) => void
  canEdit:          boolean
  partySize:        number
  scanning:         boolean
  scanError:        string | null
  lastScanned:      string | undefined
  onRescan:         () => void
  permitFree:       boolean
  onMarkPermitFree: () => void
  onSearch:         (name: string) => void
  lookupLoading:    boolean
  lookupError:      string | null
  canLookup:        boolean
}) {
  const [search, setSearch] = useState('')

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim() && canLookup && !lookupLoading) onSearch(search.trim())
  }

  const bannerHeading = scanning
    ? 'Searching for permit and booking resources…'
    : scanError
      ? `Scan failed — ${scanError}`
      : links.length > 0
        ? `Found ${links.length} permit resource${links.length !== 1 ? 's' : ''} for this area`
        : lastScanned
          ? 'No permit resources detected — verify with the land manager before assuming permit-free'
          : 'Import a route in Stage 1 to find permit resources for your area'

  return (
    <div className="flex flex-col gap-[22px]">

      {/* Detection banner */}
      <div className={`flex items-center gap-3 px-4 py-3 border rounded-lg ${
        permitFree ? 'bg-pine-dim border-pine-border' :
        scanError  ? 'bg-red-dim border-red-border'   :
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
            {lastScanned && links.length === 0 && (
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

      {/* Disclaimer */}
      {lastScanned && !scanning && (
        <div className="flex items-start gap-2 px-3 py-3 bg-surface border border-border rounded text-caption text-text-dim font-mono">
          <IconAlertTriangle size={13} className="shrink-0 mt-px text-amber" />
          <span>
            AI-generated links — open each one and confirm it applies to your specific trailhead,
            dates, and party size. Call or email the issuing agency if anything is unclear.
          </span>
        </div>
      )}

      {/* Permit resource links */}
      {links.length > 0 && (
        <section>
          <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">Permit &amp; access resources</div>
          <div className="flex flex-col gap-2">
            {links.map((link, i) => {
              const bookable = isBookable(link.url)
              const domain   = linkDomain(link.url)
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 px-3 py-2 border rounded-lg transition-colors ${
                    bookable
                      ? 'bg-surface border-border hover:border-border-mid hover:bg-surface-2'
                      : 'bg-surface-2 border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded border font-mono text-label tracking-[0.06em] uppercase font-semibold shrink-0 ${
                    bookable ? 'bg-pine-dim border-pine-border text-pine' : 'bg-transparent border-border text-text-dim'
                  }`}>
                    {domain}
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 font-heading text-body-sm font-bold text-text hover:text-amber transition-colors truncate no-underline"
                  >
                    {link.title}
                  </a>
                  {bookable && canEdit && canLookup && (
                    <button
                      onClick={() => onSearch(link.title)}
                      disabled={lookupLoading}
                      title="Look up and add this permit"
                      className="inline-flex items-center gap-1 font-mono text-label tracking-[0.06em] uppercase text-text-dim hover:text-amber transition-colors bg-transparent border-none cursor-pointer shrink-0 px-1 py-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <IconPlus size={9} /> Add
                    </button>
                  )}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-text-dim hover:text-amber transition-colors"
                  >
                    <IconExternalLink size={12} />
                  </a>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Add manually — only visible to editors */}
      {canEdit && (
        <section className="pt-1">
          <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2.5">Add a permit</div>
          <form onSubmit={handleSearchSubmit} className="flex gap-2.5 p-1 bg-surface border border-border rounded-lg">
            <div className="flex-1 flex items-center gap-2 px-3 text-text-dim">
              {lookupLoading
                ? <span className="w-3.5 h-3.5 rounded-full border-2 border-amber border-t-transparent animate-spin shrink-0" />
                : <IconSearch />
              }
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Permit name (e.g. Whitney overnight permit)…"
                disabled={lookupLoading}
                className="flex-1 bg-transparent border-none text-body-sm text-text outline-none py-2.5 placeholder:text-text-dim disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={!search.trim() || lookupLoading || !canLookup}
              className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-3.5 py-2 border-l border-border text-amber bg-transparent hover:bg-amber-dim transition-colors cursor-pointer rounded-r disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {lookupLoading ? 'Searching…' : 'Look up'}
            </button>
          </form>
          {lookupError && (
            <div className="mt-1.5 font-mono text-label text-red">{lookupError}</div>
          )}
          {!canLookup && (
            <div className="mt-1.5 font-mono text-label text-text-dim">Link a trip in Stage 1 to enable AI permit lookup.</div>
          )}
          <button
            onClick={onAddFreeform}
            className="mt-2 inline-flex items-center gap-1 font-mono text-label text-text-dim hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0"
          >
            <IconPlus size={9} /> Add without AI lookup
          </button>
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
                onEdit={() => onEditPermit(p.id)}
                onUpdatePermit={(key, val) => onUpdatePermit(p.id, key, val)}
                canEdit={canEdit}
                partySize={partySize}
              />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-lg overflow-hidden">
            <div className="px-6 py-5 text-center text-body-sm text-text-dim">
              No permits added yet.
            </div>
            {canEdit && !permitFree && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-dashed border-border bg-pine-dim">
                <span className="text-fine text-text-mid">Trip is permit-free?</span>
                <button
                  onClick={onMarkPermitFree}
                  className="font-mono text-label tracking-[0.12em] uppercase text-pine hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  Mark as permit-free →
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
