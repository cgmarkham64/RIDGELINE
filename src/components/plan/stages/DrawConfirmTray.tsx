import type { DrawState } from './routeStage.types'

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

export function DrawConfirmTray({ drawState, setDrawState, onCancel, onConfirm }: DrawConfirmTrayProps) {
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
            onChange={e =>
              setDrawState(prev =>
                prev.phase === 'active' ? { ...prev, notes: e.target.value } : prev
              )
            }
            placeholder="Trail conditions, hazards…"
          />
        </div>
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