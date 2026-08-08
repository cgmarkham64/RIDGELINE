import type { PermitTone } from './permitsStage.types'
import type { ZoneStatus } from '../../types'

// Draft date shape used only inside FreeformDialog.
export interface DraftDate {
  key:      string
  label:    string
  dateStr:  string   // YYYY-MM-DD from type="date" input
  timeStr:  string   // HH:MM from type="time" input, empty string if not set
  tone:     PermitTone
  isPreset: boolean
}

export interface DraftZone {
  zone:   string
  status: ZoneStatus
}

export interface CustomDraftInput {
  label: string
  date:  string
  time:  string
  tone:  PermitTone
}

export interface AiPrefillInfo {
  confidence:       'high' | 'medium' | 'low'
  verificationNote: string
}
