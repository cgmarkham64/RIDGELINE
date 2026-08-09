export interface DayMeta {
  dayNumber: number
  date: string // YYYY-MM-DD, local time
}

export type Cell = DayMeta | null
export interface MonthGroup {
  label: string
  weeks: Cell[][]
  nextLabel: string | null // trip continues into this month name
}
