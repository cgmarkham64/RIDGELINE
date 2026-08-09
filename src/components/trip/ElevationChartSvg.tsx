import { type ReactNode, type RefObject, useState } from 'react'
import { ftToM, milesToKm } from '../../lib/units'
import type { UnitSystem } from '../../lib/units'
import { PAD, CH, VB_H, TOOLTIP_H, TOOLTIP_PAD_X, type buildElevationChartGeometry } from './elevationProfile.geometry'

const svgMonoStyle = { fontFamily: 'var(--font-mono)', fill: 'var(--text-dim)', letterSpacing: '0.05em' }

type Geometry = ReturnType<typeof buildElevationChartGeometry>

function useHoveredTooltip(waypointMarkers: Geometry['waypointMarkers'], cw: number) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const marker = hoveredId ? waypointMarkers.find((m) => m.id === hoveredId) : null

  let tooltip: ReactNode = null
  if (marker) {
    const { x, y, color, label } = marker
    const tooltipW = label.length * 5.5 + TOOLTIP_PAD_X * 2
    const tooltipX = Math.max(PAD.l, Math.min(x - tooltipW / 2, PAD.l + cw - tooltipW))
    const tooltipY = y - TOOLTIP_H - 5
    tooltip = (
      <g style={{ pointerEvents: 'none' }}>
        <rect x={tooltipX} y={tooltipY} width={tooltipW} height={TOOLTIP_H} rx="1.5" fill="#1a1814" stroke={color} strokeWidth="0.6" opacity="0.95" />
        <text x={tooltipX + tooltipW / 2} y={tooltipY + TOOLTIP_H - 3} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: color, letterSpacing: '0.04em' }}>
          {label}
        </text>
      </g>
    )
  }

  return { setHoveredId, tooltip }
}

export function ElevationChartSvg({ svgRef, containerW, geometry, sys, activeWaypointId, onWaypointClick }: {
  svgRef: RefObject<SVGSVGElement | null>
  containerW: number
  geometry: Geometry
  sys: UnitSystem
  activeWaypointId?: string | null
  onWaypointClick?: (id: string) => void
}) {
  const { cw, lineD, areaD, gridLines, distTicks, dividers, waypointMarkers, stats } = geometry
  const { minEle, maxEle } = stats
  const { setHoveredId, tooltip } = useHoveredTooltip(waypointMarkers, cw)

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${containerW} ${VB_H}`}
      width="100%"
      overflow="visible"
      style={{ display: 'block', height: VB_H }}
    >
      {gridLines.map(({ y }) => (
        <line key={y} x1={PAD.l} y1={y} x2={PAD.l + cw} y2={y} stroke="var(--border)" strokeWidth="0.5" />
      ))}

      <line x1={PAD.l} y1={PAD.t + CH} x2={PAD.l + cw} y2={PAD.t + CH} stroke="var(--border)" strokeWidth="0.7" />

      {([
        { eleFt: maxEle,                    y: PAD.t,          dominantBaseline: 'hanging'    },
        { eleFt: (maxEle + minEle) / 2,     y: PAD.t + CH / 2, dominantBaseline: 'middle'     },
        { eleFt: minEle,                    y: PAD.t + CH,     dominantBaseline: 'alphabetic' },
      ] as const).map(({ eleFt, y, dominantBaseline }) => (
        <text key={y} x={PAD.l - 4} y={y} textAnchor="end" dominantBaseline={dominantBaseline} style={{ ...svgMonoStyle, fontSize: 9 }}>
          {sys === 'metric' ? `${Math.round(ftToM(eleFt)).toLocaleString()}m` : `${Math.round(eleFt).toLocaleString()}'`}
        </text>
      ))}

      <path d={areaD} fill="var(--amber)" fillOpacity="0.12" />
      <path d={lineD} fill="none" stroke="var(--amber)" strokeWidth="1.2" strokeLinejoin="round" />

      {waypointMarkers.map(({ id, x, y, color }) => {
        const isActive = id === activeWaypointId
        return (
          <g
            key={id}
            style={{ cursor: 'pointer' }}
            onClick={() => onWaypointClick?.(id)}
            onMouseEnter={() => setHoveredId(id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <line x1={x} y1={y} x2={x} y2={PAD.t + CH} stroke={color} strokeWidth={isActive ? 1.2 : 0.8} strokeDasharray="1.5 1.5" opacity={isActive ? 0.9 : 0.6} />
            <circle cx={x} cy={y} r={isActive ? 3.5 : 2.5} fill={color} opacity="0.95" />
            {isActive && <circle cx={x} cy={y} r="5.5" fill={color} opacity="0.2" />}
          </g>
        )
      })}

      {tooltip}

      {dividers.map(({ x, label }) => (
        <g key={x}>
          <line x1={x} y1={PAD.t} x2={x} y2={PAD.t + CH} stroke="var(--border)" strokeWidth="1" strokeDasharray="2 2" />
          <text x={x + 2} y={PAD.t + 5} style={{ ...svgMonoStyle, fontSize: 9 }}>
            {label}
          </text>
        </g>
      ))}

      {distTicks.map(({ x, distLabel }) => (
        <text key={x} x={x} y={VB_H - 0.5} textAnchor={x <= PAD.l ? 'start' : x >= PAD.l + cw - 1 ? 'end' : 'middle'} style={{ ...svgMonoStyle, fontSize: 9 }}>
          {sys === 'metric' ? milesToKm(parseFloat(distLabel)).toFixed(1) : distLabel} {sys === 'metric' ? 'km' : 'mi'}
        </text>
      ))}
    </svg>
  )
}
