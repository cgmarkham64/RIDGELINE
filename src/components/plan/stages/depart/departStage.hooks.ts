import { useState, useRef, useEffect } from 'react'
import type { StageBodyProps } from '../../types'
import {
  type Reminder, type Contact, type MapLayer, type ChecklistItem,
  PERCENT_MULTIPLIER, DEFAULT_REMINDERS, DEFAULT_CONTACTS, DEFAULT_MAP_LAYERS, DEFAULT_CHECKLIST,
} from './departStage.constants'

export function useDepartStage({ plan, onChange }: StageBodyProps) {
  const d = plan?.depart

  const [reminders, setReminders] = useState<Reminder[]>(() => d?.reminders ?? (plan !== undefined ? [] : DEFAULT_REMINDERS))
  const [contacts]                = useState<Contact[]>(() => d?.contacts   ?? (plan !== undefined ? [] : DEFAULT_CONTACTS))
  const [mapLayers, setMapLayers] = useState<MapLayer[]>(() => d?.mapLayers ?? (plan !== undefined ? [] : DEFAULT_MAP_LAYERS))
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => d?.checklist ?? (plan !== undefined ? [] : DEFAULT_CHECKLIST))

  const isMounted   = useRef(false)
  useEffect(() => () => { isMounted.current = false }, [])
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    onChangeRef.current?.({ depart: { reminders, contacts, mapLayers, checklist } })
  }, [reminders, contacts, mapLayers, checklist])

  const days = plan?.route?.segments ?? null

  function toggleReminder(i: number) { setReminders(prev => prev.map((r, idx) => idx !== i ? r : { ...r, set: !r.set })) }
  function downloadLayer(i: number) { setMapLayers(prev => prev.map((m, idx) => idx !== i ? m : { ...m, ok: true, size: m.size.replace('— · pending', 'downloading…') })) }
  function toggleChecklist(i: number) { setChecklist(prev => prev.map((c, idx) => idx !== i ? c : { ...c, done: !c.done, pending: false })) }

  const readyCount = mapLayers.filter(m => m.ok).length
  const doneCount  = checklist.filter(c => c.done).length
  const progress   = Math.round((doneCount / checklist.length) * PERCENT_MULTIPLIER)

  return {
    reminders, contacts, mapLayers, checklist, days,
    toggleReminder, downloadLayer, toggleChecklist,
    readyCount, doneCount, progress,
  }
}
