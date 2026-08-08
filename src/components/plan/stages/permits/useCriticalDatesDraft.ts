import { useState } from 'react'
import { buildCustomDraftDate, buildDraftDates } from './freeformDialog.helpers'
import type { CustomDraftInput, DraftDate } from './freeformDialog.types'
import type { Permit } from './permitsStage.types'
import type { PermitTypeName } from '../../types'

const EMPTY_CUSTOM_DRAFT: CustomDraftInput = { label: '', date: '', time: '', tone: 'amber' }

function initialDraftDates(initialPermit?: Permit): DraftDate[] {
  if (!initialPermit) return []
  return buildDraftDates(initialPermit.type, initialPermit.criticalDates ?? [])
}

export function useCriticalDatesDraft(initialPermit?: Permit) {
  const [draftDates, setDraftDates] = useState<DraftDate[]>(() => initialDraftDates(initialPermit))
  const [addingCustom, setAddingCustom] = useState(false)
  const [customDraft, setCustomDraft] = useState<CustomDraftInput>(EMPTY_CUSTOM_DRAFT)

  function resetForType(type: PermitTypeName) {
    setDraftDates(buildDraftDates(type, initialPermit?.criticalDates ?? []))
  }

  function updateDraftDate(key: string, patch: Partial<DraftDate>) {
    setDraftDates((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)))
  }

  function removeDraftDate(key: string) {
    setDraftDates((prev) => prev.filter((d) => d.key !== key))
  }

  function commitCustomDate() {
    if (!customDraft.date || !customDraft.label.trim()) return
    const idx = draftDates.filter((d) => !d.isPreset).length
    setDraftDates((prev) => [...prev, buildCustomDraftDate(customDraft, idx)])
    setCustomDraft(EMPTY_CUSTOM_DRAFT)
    setAddingCustom(false)
  }

  return {
    draftDates,
    presetRows: draftDates.filter((d) => d.isPreset),
    customRows: draftDates.filter((d) => !d.isPreset),
    addingCustom, setAddingCustom,
    customDraft, setCustomDraft,
    resetForType, updateDraftDate, removeDraftDate, commitCustomDate,
  }
}
