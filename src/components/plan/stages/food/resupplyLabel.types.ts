export type ResupplyLabelItem = { name: string; qty: number; weightOz: number }

export type ResupplyLabelData = {
  tripTitle: string
  stopName: string
  boxLabel: string
  fromDay: number
  toDay: number
  shipBy: string
  holdAddress: string
  items: ResupplyLabelItem[]
  kcalTotal: number
  weightOz: number
}
