import type { StageBodyProps } from '../../types'
import { useDepartStage } from './departStage.hooks'
import { RemindersCard } from './RemindersCard'
import { EmergencyContactsCard } from './EmergencyContactsCard'
import { OfflineMapsCard } from './OfflineMapsCard'
import { OnePagerCard } from './OnePagerCard'
import { TakeItWithYouCard } from './TakeItWithYouCard'

export function DepartStage(props: StageBodyProps) {
  const {
    reminders, contacts, mapLayers, checklist, days,
    toggleReminder, downloadLayer, toggleChecklist,
    readyCount, doneCount, progress,
  } = useDepartStage(props)

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-20">
      <div className="grid gap-7 max-w-[1100px] grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-[18px]">
          <RemindersCard reminders={reminders} onToggle={toggleReminder} />
          <EmergencyContactsCard contacts={contacts} />
          <OfflineMapsCard mapLayers={mapLayers} readyCount={readyCount} onDownload={downloadLayer} />
        </div>

        <aside className="flex flex-col gap-3.5">
          <OnePagerCard days={days} contacts={contacts} />
          <TakeItWithYouCard checklist={checklist} onToggle={toggleChecklist} doneCount={doneCount} progress={progress} />
        </aside>
      </div>
    </div>
  )
}
