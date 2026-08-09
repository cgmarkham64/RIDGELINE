import type { ComponentProps } from 'react'
import { PermitsListView } from './PermitsListView'

type PermitsMainPanelProps = {
  locationLabel: string
} & ComponentProps<typeof PermitsListView>

export function PermitsMainPanel({ locationLabel, ...listViewProps }: PermitsMainPanelProps) {
  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-heading text-body-lg font-extrabold text-text">Permits &amp; access</div>
          {locationLabel && (
            <div className="font-mono text-label text-text-dim mt-0.5">{locationLabel}</div>
          )}
        </div>
      </div>

      <PermitsListView {...listViewProps} />
    </div>
  )
}
