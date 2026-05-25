import type { DrawState, SegRow } from './routeStage.types'
import { shenandoahScore } from '../../../lib/trailDifficulty'
import { EXP_LABEL } from './routeStage.helpers'

const EXP_CLS: Record<string, string> = {
  low:     'text-pine border-pine-border bg-pine-dim',
  med:     'text-sky border-sky-border bg-sky-dim',
  high:    'text-amber border-amber-border bg-amber-dim',
  extreme: 'text-red border-red-border bg-red-dim',
}

function ElevSparkline({ elevs }: { elevs: number[] }) {
  if (elevs.length < 2) return null
  const min = Math.min(...elevs)
  const max = Math.max(...elevs)
  const range = max - min || 1
  const W = 1000, H = 60, PAD = 4
  const pts = elevs.map((e, i): [number, number] => [
    (i / (elevs.length - 1)) * W,
    H - PAD - ((e - min) / range) * (H - PAD * 2),
  ])
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const fill = `${d} L${W},${H} L0,${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 44 }} preserveAspectRatio="none">
      <path d={fill} fill="var(--amber)" fillOpacity={0.08} />
      <path d={d} fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type DrawConfirmTrayProps = {
  drawState: Extract<DrawState, { phase: 'active' }>
  setDrawState: React.Dispatch<React.SetStateAction<DrawState>>
  onCancel: () => void
  onConfirm: () => void
}

function set<K extends keyof Extract<DrawState, { phase: 'active' }>>(
  setDrawState: DrawConfirmTrayProps['setDrawState'],
  key: K,
  value: Extract<DrawState, { phase: 'active' }>[K],
) {
  setDrawState(prev => prev.phase === 'active' ? { ...prev, [key]: value } : prev)
}

export function DrawConfirmTray({ drawState, setDrawState, onCancel, onConfirm }: DrawConfirmTrayProps) {
  const score = drawState.result ? shenandoahScore(drawState.result.mi, drawState.result.gain) : null
  const suggestedHard = score !== null && score >= 350

  return (
    <div className="mt-3 rounded border border-border bg-surface-2 p-3">
      <div className="flex items-center gap-3 mb-2.5">
        {drawState.loading ? (
          <span className="font-mono text-[9px] text-text-dim tracking-widest">Calculating…</span>
        ) : drawState.result ? (
          <>
            <span className="font-mono text-[11px] font-bold text-amber">
              {drawState.result.mi.toFixed(1)} mi
            </span>
            <span className="font-mono text-[10px] text-text-mid">
              +{drawState.result.gain.toLocaleString()} ft gain
            </span>
            {drawState.result.sparkElevs.length > 1 && (
              <span className="font-mono text-[9px] text-text-dim">(drag pins to recalculate)</span>
            )}
            {!drawState.showMore && drawState.hard && (
              <span className="ml-auto font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-[0.08em] text-amber border-amber-border bg-amber-dim">
                tough
              </span>
            )}
            {!drawState.showMore && !drawState.hard && suggestedHard && (
              <span className="ml-auto font-mono text-[9px] text-text-dim italic">suggested: tough day</span>
            )}
          </>
        ) : drawState.error ? (
          <span className="font-mono text-[9px] text-text-dim">{drawState.error}</span>
        ) : null}
      </div>

      {drawState.result?.sparkElevs && drawState.result.sparkElevs.length > 1 && (
        <div className="mb-2.5 rounded overflow-hidden" style={{ background: 'var(--surface)' }}>
          <ElevSparkline elevs={drawState.result.sparkElevs} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div>
          <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1 block">
            Segment name
          </label>
          <input
            className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm font-mono text-[11px] text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color]"
            value={drawState.name}
            onChange={e =>
              setDrawState(prev =>
                prev.phase === 'active' ? { ...prev, name: e.target.value, nameAuto: false } : prev
              )
            }
            placeholder="e.g. Onion Valley → Kearsarge Pass"
            autoFocus
          />
        </div>
        <div>
          <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1 block">Notes</label>
          <input
            className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm font-mono text-[11px] text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color]"
            value={drawState.notes}
            onChange={e => set(setDrawState, 'notes', e.target.value)}
            placeholder="Trail conditions, hazards…"
          />
        </div>

        {/* More / Less toggle */}
        <button
          type="button"
          onClick={() => set(setDrawState, 'showMore', !drawState.showMore)}
          className="self-start font-mono text-[9px] text-text-dim hover:text-text transition-colors cursor-pointer bg-transparent border-none px-0 flex items-center gap-1"
        >
          {drawState.showMore ? '▴ Less' : '▾ Day details'}
        </button>

        {drawState.showMore && (
          <div className="flex flex-col gap-2 pt-1 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1 block">Water</label>
                <select
                  className="w-full px-2 py-1.5 bg-surface border border-border rounded-sm font-mono text-[11px] text-text outline-none focus:border-border-mid transition-[border-color]"
                  value={drawState.water ?? ''}
                  onChange={e => {
                    const v = e.target.value
                    set(setDrawState, 'water', v === '' ? undefined : v as SegRow['water'])
                  }}
                >
                  <option value="">— not set —</option>
                  <option value="reliable">Reliable</option>
                  <option value="caches">Caches</option>
                  <option value="dry">Dry</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1 block">Exposure</label>
                <select
                  className="w-full px-2 py-1.5 bg-surface border border-border rounded-sm font-mono text-[11px] text-text outline-none focus:border-border-mid transition-[border-color]"
                  value={drawState.exp ?? ''}
                  onChange={e => {
                    const v = e.target.value
                    set(setDrawState, 'exp', v === '' ? undefined : v as SegRow['exp'])
                  }}
                >
                  <option value="">— not set —</option>
                  <option value="low">Low</option>
                  <option value="med">Moderate</option>
                  <option value="high">High</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>
            </div>
            <div>
              <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1 block">Pass / col</label>
              <input
                className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-sm font-mono text-[11px] text-text placeholder:text-text-dim outline-none focus:border-border-mid transition-[border-color]"
                value={drawState.pass ?? ''}
                onChange={e => set(setDrawState, 'pass', e.target.value || undefined)}
                placeholder="e.g. Glen Pass · 11,978 ft"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="sr-only"
                checked={drawState.hard ?? false}
                onChange={e => set(setDrawState, 'hard', e.target.checked || undefined)}
              />
              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${drawState.hard ? 'bg-amber-dim border-amber-border' : 'bg-surface border-border'}`}>
                {drawState.hard && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className="font-mono text-[10px] text-text">Tough day</span>
              {suggestedHard && !drawState.hard && (
                <span className="font-mono text-[9px] text-text-dim">(suggested)</span>
              )}
              {drawState.exp && (
                <span className={`ml-auto font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-[0.08em] ${EXP_CLS[drawState.exp]}`}>
                  {EXP_LABEL[drawState.exp]}
                </span>
              )}
            </label>
          </div>
        )}

        <div className="flex gap-2 justify-end mt-1">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 font-heading text-[10px] font-bold tracking-widest uppercase rounded border border-border text-text-dim hover:text-text hover:border-border-mid transition-colors cursor-pointer bg-transparent"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!drawState.name.trim() || drawState.loading}
            className="px-3 py-1.5 font-heading text-[10px] font-bold tracking-widest uppercase rounded border cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}
          >
            {drawState.editingSeg ? 'Update segment' : 'Add segment'}
          </button>
        </div>
      </div>
    </div>
  )
}