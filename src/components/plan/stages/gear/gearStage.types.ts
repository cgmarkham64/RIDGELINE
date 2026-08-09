export interface GearItem {
  name: string
  weight: number // oz
  checked: boolean
}

export interface GearCategory {
  id: string
  label: string
  items: GearItem[]
}

export interface BearCanOption {
  id: string
  name: string
  capacity: string
  weight: string
  type: 'hard' | 'soft'
  note?: string
  recommended?: boolean
}

export interface UnlockChecklistItem {
  text: string
  done: boolean
}
