import { useState } from 'react'
import { permitFormFieldDefaults } from './freeformDialog.helpers'
import type { Permit } from './permitsStage.types'
import type { DraftZone } from './freeformDialog.types'

export function usePermitFormFields(initialPermit?: Permit) {
  const defaults = permitFormFieldDefaults(initialPermit)
  const [name, setName] = useState(defaults.name)
  const [agency, setAgency] = useState(defaults.agency)
  const [url, setUrl] = useState(defaults.url)
  const [confirmNum, setConfirmNum] = useState(defaults.confirmNum)
  const [trailhead, setTrailhead] = useState(defaults.trailhead)
  const [notes, setNotes] = useState(defaults.notes)
  const [draftZones, setDraftZones] = useState<DraftZone[]>(defaults.draftZones)

  function addZone() {
    setDraftZones((prev) => [...prev, { zone: '', status: 'available' }])
  }

  function updateZone(i: number, patch: Partial<DraftZone>) {
    setDraftZones((prev) => prev.map((z, idx) => (idx === i ? { ...z, ...patch } : z)))
  }

  function removeZone(i: number) {
    setDraftZones((prev) => prev.filter((_, idx) => idx !== i))
  }

  return {
    name, setName, agency, setAgency, url, setUrl,
    confirmNum, setConfirmNum, trailhead, setTrailhead, notes, setNotes,
    draftZones, addZone, updateZone, removeZone,
  }
}
