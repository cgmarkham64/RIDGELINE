import type { TimePreference } from '../../../types/auth'
import { InfoTooltip } from './InfoTooltip'

const selectCls = 'bg-surface-2 border border-border rounded-sm px-2 py-1.5 text-text font-mono text-fine outline-none focus:border-amber cursor-pointer shrink-0'
const inputCls  = 'bg-surface-2 border border-border rounded-sm px-2 py-1.5 text-text font-mono text-fine outline-none focus:border-amber text-center shrink-0'

export function TimePrefRow({ label, pref, onChange }: {
  label: string
  pref: TimePreference
  onChange: (patch: Partial<TimePreference>) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-fine text-text-mid w-[58px] shrink-0">{label}</span>
      <select
        value={pref.mode}
        onChange={e => onChange({ mode: e.target.value as TimePreference['mode'], staticTime: undefined, anchor: 'sunrise', offsetMinutes: 0 })}
        className={selectCls + ' w-[100px]'}
      >
        <option value="relative">Relative</option>
        <option value="static">Fixed time</option>
      </select>
      {pref.mode === 'relative' ? (
        <>
          <select
            value={pref.anchor ?? 'sunrise'}
            onChange={e => onChange({ anchor: e.target.value as 'sunrise' | 'sunset' })}
            className={selectCls + ' w-[74px]'}
          >
            <option value="sunrise">Sunrise</option>
            <option value="sunset">Sunset</option>
          </select>
          <input
            type="number"
            value={pref.offsetMinutes ?? 0}
            onChange={e => onChange({ offsetMinutes: parseInt(e.target.value, 10) || 0 })}
            className={inputCls + ' w-[56px]'}
          />
          <span className="font-mono text-caption text-text-dim shrink-0">min</span>
          <InfoTooltip align="right" text="Negative = before the anchor. −60 means 60 min before sunrise/sunset." />
        </>
      ) : (
        <input
          type="time"
          value={pref.staticTime ?? '06:00'}
          onChange={e => onChange({ staticTime: e.target.value })}
          className={inputCls + ' w-[108px]'}
        />
      )}
    </div>
  )
}
