import { Fragment } from 'react'
import { IconPlus } from '../../../icons'
import { SegmentStrip } from './SegmentStrip'
import { ResupplyStopCard, type OrderedStop } from './ResupplyStopCard'
import type { Waypoint } from '../../../../types'
import type { ResupplyStop } from '../../types'
import type { MealRow } from './foodStage.types'

type ResupplySectionProps = {
  waypoints: Waypoint[]
  stops: ResupplyStop[]
  meals: MealRow[]
  onStopsChange: (stops: ResupplyStop[]) => void
  onRemoveWaypoint: (waypointId: string) => void
  onAddStop: () => void
}

function getStopData(stops: ResupplyStop[], waypointId: string): ResupplyStop {
  return stops.find(s => s.id === waypointId) ?? {
    id: waypointId, name: '', resupplyDay: '', shipBy: '', daysInBox: '', holdAddress: '', status: 'unconfirmed',
  }
}

function orderStops(waypoints: Waypoint[], stops: ResupplyStop[]): OrderedStop[] {
  return waypoints
    .map(wp => ({ wp, stop: getStopData(stops, wp.id), day: parseInt(getStopData(stops, wp.id).resupplyDay) || 0 }))
    .sort((a, b) => {
      if (a.day > 0 && b.day > 0) return a.day - b.day
      if (a.day > 0) return -1
      if (b.day > 0) return 1
      return 0
    })
}

function boxRange(item: OrderedStop, nextItem: OrderedStop | undefined, totalDays: number): { from: number | null; to: number | null } {
  const from = item.day > 0 ? item.day + 1 : null
  const to = nextItem ? (nextItem.day > 0 ? nextItem.day : null) : (totalDays > 0 ? totalDays : null)
  return { from, to }
}

export function ResupplySection({ waypoints, stops, meals, onStopsChange, onRemoveWaypoint, onAddStop }: ResupplySectionProps) {
  function updateStop(waypointId: string, patch: Partial<ResupplyStop>) {
    const existing = stops.find(s => s.id === waypointId)
    if (existing) {
      onStopsChange(stops.map(s => s.id === waypointId ? { ...s, ...patch } : s))
    } else {
      onStopsChange([...stops, { ...getStopData(stops, waypointId), ...patch }])
    }
  }

  function removeStop(waypointId: string) {
    onStopsChange(stops.filter(s => s.id !== waypointId))
    onRemoveWaypoint(waypointId)
  }

  const stopsOrdered  = orderStops(waypoints, stops)
  const totalDays     = meals.length
  const firstValidDay = stopsOrdered.find(s => s.day > 0)?.day ?? 0
  const showTimeline  = firstValidDay > 0 && totalDays > 0

  return (
    <div className="flex flex-col gap-3">
      {waypoints.length === 0 && (
        <div className="bg-surface border border-dashed border-border rounded-lg px-4 py-6 text-center">
          <p className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1.5">No resupply stops</p>
          <p className="text-body-sm text-text-mid">Add a resupply waypoint to the route map — it will appear here for planning.</p>
        </div>
      )}

      {showTimeline && <SegmentStrip label="Carry in" fromDay={1} toDay={firstValidDay} meals={meals} />}

      {stopsOrdered.map((item, i) => {
        const { from: boxFromDay, to: boxToDay } = boxRange(item, stopsOrdered[i + 1], totalDays)
        const showBox = showTimeline && boxFromDay !== null && boxToDay !== null && boxFromDay <= boxToDay

        return (
          <Fragment key={item.wp.id}>
            <ResupplyStopCard item={item} onUpdate={updateStop} onRemove={removeStop} />
            {showBox && <SegmentStrip label={`Box ${i + 1}`} fromDay={boxFromDay!} toDay={boxToDay!} meals={meals} />}
          </Fragment>
        )
      })}

      <button
        type="button"
        onClick={onAddStop}
        className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer self-start"
      >
        <IconPlus size={10} /> Add resupply stop
      </button>
    </div>
  )
}
