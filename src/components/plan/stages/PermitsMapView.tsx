import { useId, useState } from 'react'
import { IconX, IconCheck, IconPlus, IconMap, IconChevronLeft, IconChevronRight } from '../../icons'
import { TypeChip, Field, PermitTypeIcon } from './PermitAtoms'
import { PERMIT_TYPES, TONE_CLS, MAP_ZONES, MAP_ROUTE, ZONE_PERMIT_MAP } from './permitsStage.constants'
import type { Permit } from './permitsStage.types'
import { JumpChip } from '../JumpChip'

// ─── MapZoneSvg ───────────────────────────────────────────────────────────────

export function MapZoneSvg({ highlightId }: { highlightId?: string }) {
  const uid = useId()
  const patternId = `topo-modal-${uid}`
  return (
    <div className="relative rounded border border-border overflow-hidden h-[240px] bg-[#0e1810]">
      <svg viewBox="0 0 440 240" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 pointer-events-none">
        <defs>
          <pattern id={patternId} width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="440" height="240" fill={`url(#${patternId})`} />
        {MAP_ZONES.map(zone => (
          <polygon
            key={zone.id}
            points={zone.poly}
            fill={zone.color}
            fillOpacity={highlightId === zone.id ? 0.32 : 0.12}
            stroke={zone.color}
            strokeOpacity={highlightId === zone.id ? 0.9 : 0.4}
            strokeWidth={highlightId === zone.id ? 2 : 1}
          />
        ))}
        <polyline points={MAP_ROUTE} fill="none" stroke="var(--color-amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {MAP_ZONES.map(zone => {
          const pts = zone.poly.split(' ').map(p => p.split(',').map(Number))
          const cx = pts.reduce((a, [x]) => a + x, 0) / pts.length
          const cy = pts.reduce((a, [, y]) => a + y, 0) / pts.length
          return (
            <text key={zone.id} x={cx} y={cy} textAnchor="middle" fontSize="9"
              fontFamily="JetBrains Mono, monospace" fill={zone.color} fontWeight="600">
              {zone.name}
            </text>
          )
        })}
      </svg>
      <div className="absolute bottom-2.5 left-2.5 flex gap-3 px-2.5 py-1.5 rounded border border-border font-mono text-[9px] text-text-dim bg-[rgba(15,13,11,0.8)]">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-px bg-amber" /> route</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 border border-sky bg-[rgba(90,180,220,0.25)] opacity-60" /> zone</span>
      </div>
    </div>
  )
}

// ─── MapModal ─────────────────────────────────────────────────────────────────

export function MapModal({ permit, onClose }: { permit: Permit; onClose: () => void }) {
  const t = PERMIT_TYPES[permit.type]
  const matchingZone = MAP_ZONES.find(z =>
    (z.id === 'whitney' && permit.id === 'sgt_whitney') ||
    (z.id === 'inyo'    && permit.id === 'sgt_inyo') ||
    (z.id === 'seki'    && permit.id === 'sgt_canister')
  )
  const fields = Object.entries(permit.fields)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(10,9,8,0.78)]">
      <div className="bg-surface border border-border rounded-xl w-full max-w-[640px] overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
          <span className={`w-7 h-7 rounded flex items-center justify-center border shrink-0 ${TONE_CLS[t.tone]}`}>
            <PermitTypeIcon type={permit.type} size={13} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-heading text-[13px] font-bold text-text truncate">{permit.name}</div>
            <div className="font-mono text-[9px] text-text-dim mt-0.5">{permit.agency}</div>
          </div>
          <TypeChip type={permit.type} />
          <button onClick={onClose} className="text-text-dim hover:text-text p-1 transition-colors ml-1">
            <IconX size={16} />
          </button>
        </div>
        <div className="p-5">
          <MapZoneSvg highlightId={matchingZone?.id} />
          {permit.why && (
            <div className="mt-3.5 text-[11px] text-text-mid italic leading-relaxed">{permit.why}</div>
          )}
          {fields.length > 0 && (
            <div className="grid gap-2.5 mt-3.5" style={{ gridTemplateColumns: `repeat(${Math.min(fields.length, 3)}, 1fr)` }}>
              {fields.map(([k, v]) => <Field key={k} label={k} value={v} readOnly />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── PermitsMapView ───────────────────────────────────────────────────────────

export function PermitsMapView({ permits, suggestions, onAccept, onViewMap, onJump }: {
  permits: Permit[]
  suggestions: Permit[]
  onAccept: (p: Permit) => void
  onViewMap: (p: Permit) => void
  onJump: (id: string) => void
}) {
  const uid = useId()
  const patternId = `topo-mv-${uid}`
  const [activeIdx, setActiveIdx] = useState(0)
  const z = MAP_ZONES[activeIdx]

  const allPermits = [...permits, ...suggestions]
  const linkedPermit = allPermits.find(p => p.id === ZONE_PERMIT_MAP[z.id])
  const isAdded = linkedPermit ? permits.some(p => p.id === linkedPermit.id) : false

  return (
    <div className="flex flex-col gap-[18px]">

      {/* Map SVG panel */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
          <span className="text-amber shrink-0"><IconMap size={14} /></span>
          <div className="flex-1 min-w-0">
            <div className="font-heading text-[13px] font-bold text-text">Permit zones along your route</div>
            <div className="font-mono text-[9px] text-text-dim mt-0.5">
              Sierra High Route · {MAP_ZONES.length} zones · tap a zone to view its permit
            </div>
          </div>
        </div>
        <div className="relative h-[300px] bg-[#0e1810]">
          <svg
            viewBox="0 0 440 300"
            width="100%" height="100%"
            preserveAspectRatio="xMidYMid meet"
            className="block"
          >
            <defs>
              <pattern id={patternId} width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="440" height="300" fill={`url(#${patternId})`} />
            {MAP_ZONES.map((zone, i) => (
              <polygon
                key={zone.id}
                points={zone.poly}
                fill={zone.color}
                fillOpacity={i === activeIdx ? 0.28 : 0.12}
                stroke={zone.color}
                strokeOpacity={i === activeIdx ? 0.9 : 0.4}
                strokeWidth={i === activeIdx ? 2 : 1}
                className="cursor-pointer transition-all duration-150"
                onClick={() => setActiveIdx(i)}
              />
            ))}
            <polyline
              points={MAP_ROUTE}
              fill="none" stroke="var(--color-amber)"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            />
            {MAP_ZONES.map(zone => {
              const pts = zone.poly.split(' ').map(p => p.split(',').map(Number))
              const cx = pts.reduce((a, [x]) => a + x, 0) / pts.length
              const cy = pts.reduce((a, [, y]) => a + y, 0) / pts.length
              return (
                <g key={zone.id}>
                  <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9"
                    fontFamily="JetBrains Mono, monospace" fill={zone.color} fontWeight="600">
                    {zone.name}
                  </text>
                  <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8"
                    fontFamily="Karla, sans-serif" fill="rgba(255,255,255,0.45)">
                    Night {zone.night}
                  </text>
                </g>
              )
            })}
          </svg>
          <div className="absolute bottom-2.5 left-2.5 flex gap-3 px-2.5 py-1.5 rounded border border-border font-mono text-[9px] text-text-dim bg-[rgba(15,13,11,0.8)]">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-px bg-amber" /> route</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 border border-sky bg-[rgba(90,180,220,0.25)] opacity-60" /> zone</span>
          </div>
        </div>
      </div>

      {/* Active zone detail */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-surface-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: z.color }} />
          <span className="font-mono text-[9px] text-text-dim uppercase tracking-widest">
            Zone {activeIdx + 1} of {MAP_ZONES.length}
          </span>
          <span className="font-heading text-[13px] font-bold text-text">{z.name}</span>
          <div className="flex gap-1 ml-auto">
            <button
              onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="p-1.5 border border-border rounded text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconChevronLeft />
            </button>
            <button
              onClick={() => setActiveIdx(i => Math.min(MAP_ZONES.length - 1, i + 1))}
              disabled={activeIdx === MAP_ZONES.length - 1}
              className="p-1.5 border border-border rounded text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <IconChevronRight />
            </button>
          </div>
        </div>
        <div className="p-4">
          {linkedPermit ? (
            isAdded ? (
              <div className="flex items-center gap-2 text-[12px] text-text-mid">
                <span className="text-pine shrink-0"><IconCheck size={14} /></span>
                <span>
                  Permit added —{' '}
                  <button
                    onClick={() => onViewMap(linkedPermit)}
                    className="text-sky hover:underline bg-transparent border-none cursor-pointer p-0 text-[12px]"
                  >
                    view detail
                  </button>
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <TypeChip type={linkedPermit.type} />
                  <span className="font-heading text-[13px] font-bold text-text">{linkedPermit.name}</span>
                </div>
                <div className="text-[11px] text-text-mid italic leading-relaxed mb-3">{linkedPermit.why}</div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => onAccept(linkedPermit)}
                    className="inline-flex items-center gap-1 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer"
                  >
                    <IconPlus size={10} /> Add to trip
                  </button>
                  <button
                    onClick={() => onViewMap(linkedPermit)}
                    className="inline-flex items-center gap-1 font-heading text-[10px] font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
                  >
                    <IconMap size={10} /> Focus detail
                  </button>
                </div>
              </>
            )
          ) : (
            <div className="text-[12px] text-text-mid italic">No permit detected for this zone.</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-surface border border-border rounded-lg text-[11px] text-text-mid">
        <span className="text-text-dim shrink-0"><IconMap size={14} /></span>
        <span className="flex-1">
          {permits.length} of {MAP_ZONES.length} zones covered.{' '}
          Re-routing in <JumpChip to="route" onJump={onJump}>Route</JumpChip> will rescan zones.
        </span>
      </div>
    </div>
  )
}