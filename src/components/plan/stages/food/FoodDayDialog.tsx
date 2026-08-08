import type { Dispatch, SetStateAction } from 'react'
import { DayMealDialog } from './DayMealDialog'
import { deepCopyItems } from './foodStage.helpers'
import type { MealRow } from './foodStage.types'

type FoodDayDialogProps = {
  meals: MealRow[]
  setMeals: Dispatch<SetStateAction<MealRow[]>>
  activeDayIdx: number | null
  setActiveDayIdx: Dispatch<SetStateAction<number | null>>
}

export function FoodDayDialog({ meals, setMeals, activeDayIdx, setActiveDayIdx }: FoodDayDialogProps) {
  if (activeDayIdx === null) return null

  return (
    <DayMealDialog
      day={meals[activeDayIdx]}
      dayIndex={activeDayIdx}
      totalDays={meals.length}
      onSave={updated => setMeals(prev => prev.map((m, i) => i === activeDayIdx ? updated : m))}
      onCopyTo={indices => {
        const source = meals[activeDayIdx]
        setMeals(prev => prev.map((m, i) => indices.includes(i) ? { ...m, items: deepCopyItems(source.items) } : m))
      }}
      onClose={() => setActiveDayIdx(null)}
    />
  )
}
