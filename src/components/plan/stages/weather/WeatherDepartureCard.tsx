import { IconCheck, IconAlertTriangle } from '../../../icons'
import { fmtShortDate } from './weatherStage.helpers'
import type { DepartureRiskFactor, RiskLevel, RiskStyle } from './weatherStage.types'

const VERDICT_ICON_SIZE = 22

function VerdictHeader({ risk, riskStyle }: { risk: RiskLevel; riskStyle: RiskStyle }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 px-[18px] py-5 border-b ${riskStyle.border}`}>
      <div className={riskStyle.text}>
        {risk === 'low' ? <IconCheck size={VERDICT_ICON_SIZE} /> : <IconAlertTriangle size={VERDICT_ICON_SIZE} className={riskStyle.text} />}
      </div>
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">Departure window</div>
      <div className={`font-heading text-h2 font-extrabold leading-tight ${riskStyle.text}`}>{riskStyle.label}</div>
    </div>
  )
}

function FactorsList({ factors, elevFt }: { factors: DepartureRiskFactor[]; elevFt: number | null }) {
  if (factors.length === 0) {
    return <p className="text-body text-text-mid text-center">No significant weather risks in the forecast window.</p>
  }
  return (
    <>
      <ul className="flex flex-col gap-2 text-center">
        {factors.map((f, i) => (
          <li key={i}>
            <span className="font-mono text-caption text-text-dim">{fmtShortDate(f.date)}</span>
            <span className="font-mono text-caption text-text-dim mx-1.5">·</span>
            <span className="text-body text-text-mid">{f.label}</span>
          </li>
        ))}
      </ul>
      {elevFt !== null && (
        <p className="font-mono text-label text-text-dim mt-2.5 text-center">
          Temps adjusted for avg. trip elevation (~{Math.round(elevFt).toLocaleString()} ft)
        </p>
      )}
    </>
  )
}

type WeatherDepartureCardProps = {
  risk: RiskLevel | null
  riskStyle: RiskStyle | null
  factors: DepartureRiskFactor[] | undefined
  elevFt: number | null
}

export function WeatherDepartureCard({ risk, riskStyle, factors, elevFt }: WeatherDepartureCardProps) {
  if (!risk || !riskStyle || !factors) return null

  return (
    <div className={`border rounded-lg overflow-hidden ${riskStyle.border} ${riskStyle.bg}`}>
      <VerdictHeader risk={risk} riskStyle={riskStyle} />
      <div className="px-[18px] py-3.5">
        <FactorsList factors={factors} elevFt={elevFt} />
      </div>
    </div>
  )
}
