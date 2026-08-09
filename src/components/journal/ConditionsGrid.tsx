import type { UseFormRegister } from 'react-hook-form'
import { CondCell } from './CondCell'
import { WEATHER_OPTIONS, condInputCls } from './journalEntryForm.helpers'
import type { FormValues } from './journalEntryForm.types'

export function ConditionsGrid({ register, sys }: { register: UseFormRegister<FormValues>; sys: 'imperial' | 'metric' }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 mb-5.5">
      <CondCell label={sys === 'metric' ? 'Km' : 'Miles'}>
        <input type="number" step="0.1" {...register('milesCovered')} placeholder="—" className={condInputCls} />
      </CondCell>
      <CondCell label={sys === 'metric' ? 'Elev. gain (m)' : 'Elev. gain (ft)'}>
        <input type="number" step="1" {...register('elevationGainFt')} placeholder="—" className={condInputCls} />
      </CondCell>
      <CondCell label={sys === 'metric' ? 'Temp Low (°C)' : 'Temp Low (°F)'}>
        <input type="number" step="1" {...register('tempLowF')} placeholder="—" className={condInputCls} />
      </CondCell>
      <CondCell label={sys === 'metric' ? 'Temp High (°C)' : 'Temp High (°F)'}>
        <input type="number" step="1" {...register('tempHighF')} placeholder="—" className={condInputCls} />
      </CondCell>
      <CondCell label="Weather">
        <>
          <input
            {...register('weatherNotes')}
            list="weather-options"
            placeholder="Clear, Rain…"
            autoComplete="off"
            className={condInputCls}
            onFocus={(e) => { e.target.style.borderColor = 'var(--border-mid)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
          />
          <datalist id="weather-options">
            {WEATHER_OPTIONS.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </>
      </CondCell>
    </div>
  )
}
