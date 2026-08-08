import { useState } from 'react'
import { usePermitFormFields } from './usePermitFormFields'
import { useCriticalDatesDraft } from './useCriticalDatesDraft'
import { buildPermitFromDraft } from './freeformDialog.helpers'
import type { AiPrefillInfo } from './freeformDialog.types'
import type { Permit } from './permitsStage.types'
import type { PermitTypeName } from '../../types'

export function useFreeformDialog(
  initialPermit: Permit | undefined,
  aiPrefill: AiPrefillInfo | undefined,
  partySize: number,
  onSave: (permit: Permit) => void,
) {
  const isEditing = !!initialPermit && !aiPrefill
  const [step, setStep] = useState<'type' | 'details'>(isEditing ? 'details' : 'type')
  const [selectedType, setSelectedType] = useState<PermitTypeName | null>(initialPermit?.type ?? null)

  const fields = usePermitFormFields(initialPermit)
  const dates = useCriticalDatesDraft(initialPermit)

  function handleTypeSelect(type: PermitTypeName) {
    setSelectedType(type)
    dates.resetForType(type)
  }

  function handleSave() {
    if (!selectedType || !fields.name.trim()) return
    onSave(buildPermitFromDraft({
      initialPermit, selectedType, partySize,
      name: fields.name, agency: fields.agency, notes: fields.notes,
      confirmNum: fields.confirmNum, trailhead: fields.trailhead,
      draftZones: fields.draftZones, url: fields.url, draftDates: dates.draftDates,
    }))
  }

  return { isEditing, step, setStep, selectedType, handleTypeSelect, fields, dates, handleSave }
}
