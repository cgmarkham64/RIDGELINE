import type { Ref } from 'react'
import type { Waypoint } from '../../types'
import { WaypointIcon } from '../map/WaypointIcon'
import { WAYPOINT_COLOR, WAYPOINT_LABEL } from '../map/constants'

const COORD_DISPLAY_DECIMALS = 4

export function WaypointListItem({
  wp,
  isActive,
  activeRef,
  onClick,
}: {
  wp: Waypoint
  isActive: boolean
  activeRef: Ref<HTMLDivElement>
  onClick?: () => void
}) {
  const color = WAYPOINT_COLOR[wp.type]

  return (
    <div
      ref={isActive ? activeRef : null}
      onClick={onClick}
      className="flex flex-col gap-0 px-2.5 py-[7px] rounded-md cursor-pointer transition-[background,border-color] duration-150"
      style={{
        background: isActive ? `${color}12` : 'var(--surface2)',
        border: `1px solid ${isActive ? color + '66' : color + '33'}`,
      }}
    >
      <div className="flex items-center gap-2">
        <WaypointIcon type={wp.type} size={16} />
        <div className="flex-1 min-w-0">
          <div className="font-sans text-body-sm text-text overflow-hidden text-ellipsis whitespace-nowrap">
            {wp.label}
          </div>
          <div className="flex items-center gap-1.5 mt-[2px]">
            <span className="font-mono text-label tracking-[0.08em] uppercase" style={{ color }}>
              {WAYPOINT_LABEL[wp.type]}
            </span>
            <span className="font-mono text-label tracking-[0.04em] text-text-dim">
              {wp.lat.toFixed(COORD_DISPLAY_DECIMALS)}, {wp.lon.toFixed(COORD_DISPLAY_DECIMALS)}
            </span>
          </div>
        </div>
      </div>
      {isActive && wp.notes && (
        <div
          className="mt-[7px] pt-[7px] font-sans text-fine text-text-dim leading-normal"
          style={{ borderTop: `1px solid ${color}33` }}
        >
          {wp.notes}
        </div>
      )}
    </div>
  )
}
