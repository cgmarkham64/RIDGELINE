import type { StageBodyProps } from '../types'

export function RouteStage(_: StageBodyProps) {
  void _
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl space-y-4">
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-3">Coming next</div>
          <h2 className="font-heading text-[18px] font-bold text-text mb-2">Route Stage</h2>
          <p className="text-[13px] text-text-mid leading-relaxed">
            Hero card with locked route summary + planned-route map placeholder + 4 stat fields (Distance / Gain / Loss / Segments).
            Elevation profile SVG. Segments table with 8 rows. Locked banner. Right rail with Partners list and source files.
          </p>
        </div>
        <StubMapPlaceholder />
      </div>
    </div>
  )
}

function StubMapPlaceholder() {
  return (
    <div
      className="rounded-lg border border-border overflow-hidden"
      style={{ height: 280, background: '#0e1810' }}
    >
      <svg viewBox="0 0 600 280" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
        <g fill="none" stroke="rgba(154,136,120,0.18)" strokeWidth="0.7">
          <path d="M 50 80 Q 200 30, 400 90 T 600 120" />
          <path d="M 30 130 Q 200 90, 420 140 T 600 170" />
          <path d="M 0 180 Q 180 150, 380 200 T 600 220" />
        </g>
        <path d="M 80 240 L 165 200 L 280 170 L 400 130 L 520 90" fill="none" stroke="var(--color-amber)" strokeWidth="2.5" strokeDasharray="6 4" strokeLinecap="round" opacity="0.7" />
        <text x="10" y="20" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', fill: 'var(--color-text-dim)', textTransform: 'uppercase' }}>PLANNED ROUTE · GPX</text>
      </svg>
    </div>
  )
}