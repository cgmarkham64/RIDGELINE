import { z } from 'zod'

export const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export const journalEntrySchema = z.object({
  title: z.string().optional(),
  weatherNotes: z.string().optional(),
  tempLowF: z.string().optional(),
  tempHighF: z.string().optional(),
  milesCovered: z.string().optional(),
  elevationGainFt: z.string().optional(),
  wakeActual: z.string().refine(v => !v || HHMM_RE.test(v), 'Use HH:MM format'),
  onTrailActual: z.string().refine(v => !v || HHMM_RE.test(v), 'Use HH:MM format'),
  campActual: z.string().refine(v => !v || HHMM_RE.test(v), 'Use HH:MM format'),
  body: z.string().min(1, 'Write something before saving'),
})

export type FormValues = z.infer<typeof journalEntrySchema>

export type SegmentTimes = { n: number; wakeTime?: string; onTrailTime?: string; campByTime?: string }

export type PlannedTimeField = 'wakeActual' | 'onTrailActual' | 'campActual'

export type PlannedTimeRow = { label: string; planned: string | undefined; field: PlannedTimeField }
