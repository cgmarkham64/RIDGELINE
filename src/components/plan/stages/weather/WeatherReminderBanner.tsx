import { IconAlertTriangle } from '../../../icons'

const REMINDER_ICON_SIZE = 12

export function WeatherReminderBanner() {
  return (
    <div className="flex items-start gap-2.5 px-3 py-3 bg-amber-dim border border-amber-border rounded-lg">
      <IconAlertTriangle size={REMINDER_ICON_SIZE} className="text-amber mt-0.5" />
      <p className="text-fine text-text-mid leading-relaxed">
        <span className="font-semibold text-amber block mb-0.5">Re-check forecast 72 hrs before departure.</span>
        Conditions can shift fast in the mountains.
      </p>
    </div>
  )
}
