import type { StageBodyProps } from '../../types'

export type PartnersCardTrip = StageBodyProps['trip']

export interface PartnerEntry {
  sub: string
  name: string
  pending: boolean
}

export type InviteMessage = { text: string; tone: 'pine' | 'red' }
