import type { StageBodyProps } from '../types'

export function DepartStage({ onJump }: StageBodyProps) {
  void onJump
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl">
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-text-dim mb-3">Coming next</div>
          <h2 className="font-heading text-[18px] font-bold text-text mb-2">Depart Stage</h2>
          <p className="text-[13px] text-text-mid leading-relaxed">
            Reminders card: calendar reminders with date pill, description, and Set button.
            Emergency contacts card: home base, SAR offices, Garmin IERCC — phone numbers and
            tone-coded avatars. Offline maps card: CalTopo / Gaia / NOAA / OnX with size, status,
            and Download button. Right rail: auto-generated one-pager preview thumbnail + PDF export;
            Take-it-with-you checklist.
          </p>
        </div>
      </div>
    </div>
  )
}