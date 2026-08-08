import { IconAlertTriangle } from '../../../icons'

export function WeatherMissingDatesGate({ onEditTrip }: { onEditTrip?: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-[480px] mx-auto mt-16">
        <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-3">Stage 2 · Weather</div>
        <h2 className="font-heading text-h2 font-extrabold text-text mb-2">Start and end dates required.</h2>
        <p className="text-body text-text-mid leading-relaxed mb-5">
          Weather analysis, sunrise/sunset times, and the forecast window all depend on knowing when your trip starts and ends.
        </p>
        <div className="flex items-start gap-3 px-4 py-3 bg-red-dim border border-red-border rounded-lg mb-5">
          <IconAlertTriangle size={14} className="text-red" />
          <p className="text-body-sm text-text-mid leading-relaxed">
            <span className="font-semibold text-red">Trip dates are not set.</span>{' '}
            Add start and end dates to enable this stage.
          </p>
        </div>
        {onEditTrip && (
          <button type="button" onClick={onEditTrip}
            className="px-4 py-2 font-heading text-caption font-bold tracking-widest uppercase rounded border cursor-pointer transition-colors"
            style={{ background: 'var(--amber-dim)', borderColor: 'var(--amber-border)', color: 'var(--amber)' }}>
            Set trip dates
          </button>
        )}
      </div>
    </div>
  )
}
