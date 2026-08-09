import type { StageBodyProps } from '../../types'
import { GearMainPanel } from './GearMainPanel'
import { GearRightRail } from './GearRightRail'
import { useGearStageState } from './gearStage.hooks'

export function GearStage({ onJump, plan, onChange, canEdit = true }: StageBodyProps) {
  const s = useGearStageState(plan, onChange)

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 max-w-[1100px] grid-cols-[1fr_320px]">
        <GearMainPanel
          onJump={onJump}
          weather={plan?.weather}
          isWeatherRisk={s.isWeatherRisk}
          categories={s.categories}
          onToggleItem={s.toggleItem}
          selectedCanId={s.selectedCanId}
          onSelectCan={s.setSelectedCanId}
          customCanName={s.customCanName}
          onCustomCanName={s.setCustomCanName}
        />
        <GearRightRail
          onJump={onJump}
          checkedCount={s.checkedCount}
          totalCount={s.totalCount}
          baseLb={s.baseLb}
          foodLb={s.foodLb}
          totalLb={s.totalLb}
          unlockChecklist={s.unlockChecklist}
          onToggleUnlock={s.toggleUnlock}
          unlockDone={s.unlockDone}
          unlockProgress={s.unlockProgress}
          weather={plan?.weather}
          isWeatherRisk={s.isWeatherRisk}
          onChange={onChange}
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}
