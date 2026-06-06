import { useState } from 'react'
import { IconX, IconSparkle, IconPlus, IconChevronLeft, IconChevronRight } from '../../../icons'
import { TypeChip } from './PermitAtoms'
import { PERMIT_TYPES, TONE_CLS, PERMIT_DATE_PRESETS } from './permitsStage.constants'
import { toDateInputValue, toTimeInputValue, toDateMs } from './criticalDates.helpers'
import type { Permit, PermitTone } from './permitsStage.types'
import type { PermitTypeName, PlanCriticalDate } from '../../types'

// ── Draft date shape used only inside this dialog ─────────────────────────────

type DraftDate = {
  key:      string
  label:    string
  dateStr:  string   // YYYY-MM-DD from type="date" input
  timeStr:  string   // HH:MM from type="time" input, empty string if not set
  tone:     PermitTone
  isPreset: boolean
}

function buildDraftDates(type: PermitTypeName, existing: PlanCriticalDate[]): DraftDate[] {
  const presets    = PERMIT_DATE_PRESETS[type]
  const byLabel    = Object.fromEntries(existing.map(d => [d.label, d]))
  const presetKeys = new Set(presets.map(p => p.label))

  const presetRows: DraftDate[] = presets.map(p => {
    const ex = byLabel[p.label]
    return {
      key:      p.key,
      label:    p.label,
      dateStr:  ex?.dateMs ? toDateInputValue(ex.dateMs) : '',
      timeStr:  ex?.hasTime && ex.dateMs ? toTimeInputValue(ex.dateMs) : '',
      tone:     (ex?.tone as PermitTone | undefined) ?? p.tone,
      isPreset: true,
    }
  })

  const customRows: DraftDate[] = existing
    .filter(d => !presetKeys.has(d.label))
    .map((d, i) => ({
      key:      `custom_${i}`,
      label:    d.label,
      dateStr:  d.dateMs ? toDateInputValue(d.dateMs) : '',
      timeStr:  d.hasTime && d.dateMs ? toTimeInputValue(d.dateMs) : '',
      tone:     d.tone as PermitTone,
      isPreset: false,
    }))

  return [...presetRows, ...customRows]
}

function toCriticalDates(permitId: string, rows: DraftDate[]): PlanCriticalDate[] {
  return rows
    .filter(d => d.dateStr && d.label.trim())
    .map((d, i) => ({
      id:      d.isPreset ? `pcd_${permitId}_${d.key}` : `pcd_${permitId}_custom_${i}`,
      dateMs:  toDateMs(d.dateStr, d.timeStr || undefined),
      hasTime: !!d.timeStr,
      label:   d.label.trim(),
      tone:    d.tone,
      source:  'permit' as const,
    }))
}

const TONE_BTNS: { value: PermitTone; label: string; cls: string }[] = [
  { value: 'amber', label: 'Deadline', cls: 'bg-amber-dim border-amber-border text-amber' },
  { value: 'sky',   label: 'Booking',  cls: 'bg-sky-dim border-sky-border text-sky'       },
  { value: 'pine',  label: 'Info',     cls: 'bg-pine-dim border-pine-border text-pine'     },
]

const INPUT_CLS = 'px-2.5 py-1.5 bg-surface-2 border border-border rounded font-mono text-fine text-text outline-none focus:border-border-mid transition-[border-color]'

// ── Component ─────────────────────────────────────────────────────────────────

export function FreeformDialog({ onClose, onSave, partySize, initialPermit, aiPrefill }: {
  onClose:        () => void
  onSave:         (permit: Permit) => void
  partySize:      number
  initialPermit?: Permit
  aiPrefill?:     { confidence: 'high' | 'medium' | 'low'; verificationNote: string }
}) {
  const isEditing = !!initialPermit && !aiPrefill

  const [step, setStep]                 = useState<'type' | 'details'>(isEditing ? 'details' : 'type')
  const [selectedType, setSelectedType] = useState<PermitTypeName | null>(initialPermit?.type ?? null)
  const [name, setName]                 = useState(initialPermit?.name ?? '')
  const [agency, setAgency]             = useState(initialPermit?.agency ?? '')
  const [notes, setNotes]               = useState(initialPermit?.why ?? '')
  const [draftDates, setDraftDates]     = useState<DraftDate[]>(() =>
    initialPermit ? buildDraftDates(initialPermit.type, initialPermit.criticalDates ?? []) : []
  )
  const [addingCustom, setAddingCustom] = useState(false)
  const [customLabel, setCustomLabel]   = useState('')
  const [customDate, setCustomDate]     = useState('')
  const [customTime, setCustomTime]     = useState('')
  const [customTone, setCustomTone]     = useState<PermitTone>('amber')

  function handleTypeSelect(type: PermitTypeName) {
    setSelectedType(type)
    setDraftDates(buildDraftDates(type, initialPermit?.criticalDates ?? []))
  }

  function updateDraftDate(key: string, patch: Partial<DraftDate>) {
    setDraftDates(prev => prev.map(d => d.key === key ? { ...d, ...patch } : d))
  }

  function removeDraftDate(key: string) {
    setDraftDates(prev => prev.filter(d => d.key !== key))
  }

  function commitCustomDate() {
    if (!customDate || !customLabel.trim()) return
    const idx = draftDates.filter(d => !d.isPreset).length
    setDraftDates(prev => [...prev, {
      key:      `custom_${idx}_${Date.now()}`,
      label:    customLabel.trim(),
      dateStr:  customDate,
      timeStr:  customTime,
      tone:     customTone,
      isPreset: false,
    }])
    setCustomLabel('')
    setCustomDate('')
    setCustomTime('')
    setCustomTone('amber')
    setAddingCustom(false)
  }

  function handleSave() {
    if (!selectedType || !name.trim()) return
    const permitId = initialPermit?.id ?? `custom_${Date.now()}`
    onSave({
      id:            permitId,
      type:          selectedType,
      name:          name.trim(),
      agency:        agency.trim(),
      why:           notes.trim(),
      fields:        initialPermit?.fields ?? {},
      party:         partySize,
      zones:         initialPermit?.zones,
      url:           initialPermit?.url,
      zoneId:        initialPermit?.zoneId,
      confidence:    initialPermit?.confidence,
      criticalDates: toCriticalDates(permitId, draftDates),
    })
  }

  const presetRows = draftDates.filter(d => d.isPreset)
  const customRows = draftDates.filter(d => !d.isPreset)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(10,9,8,0.78)]">
      <div className="bg-surface border border-border rounded-xl w-full max-w-160 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border shrink-0">
          <span className="font-heading text-body-sm font-extrabold text-text flex-1">
            {isEditing ? 'Edit permit' : 'Add permit'}
          </span>
          {!isEditing && (
            <div className="flex items-center gap-1.5 mr-2">
              {(['type', 'details'] as const).map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={`font-mono text-label tracking-widest uppercase ${
                    step === s ? 'text-amber' : (step === 'details' && s === 'type') ? 'text-pine' : 'text-text-dim'
                  }`}>
                    {s === 'type' ? 'Type' : 'Details'}
                  </span>
                  {i < 1 && <span className="text-border text-caption">·</span>}
                </span>
              ))}
            </div>
          )}
          <button onClick={onClose} className="text-text-dim hover:text-text p-1 transition-colors">
            <IconX size={16} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1">
          <div className="p-5">

            {/* Step: Type */}
            {step === 'type' && (
              <>
                <p className="text-body-sm text-text-mid mb-4 leading-relaxed">What kind of permit do you need?</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(PERMIT_TYPES) as [PermitTypeName, typeof PERMIT_TYPES[PermitTypeName]][]).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => handleTypeSelect(key)}
                      className={`flex flex-col items-start gap-1.5 p-3 rounded border text-left transition-colors cursor-pointer ${
                        selectedType === key ? TONE_CLS[t.tone] : 'bg-transparent border-border text-text-mid hover:border-border-mid'
                      }`}
                    >
                      <span className="font-mono text-label tracking-widest uppercase font-semibold">{t.label}</span>
                      <span className="text-caption text-text-dim leading-snug">{t.hint}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-start gap-2.5 px-3 py-2.5 bg-amber-dim border border-amber-border rounded text-fine text-text-mid">
                  <span className="text-amber shrink-0 mt-0.5"><IconSparkle /></span>
                  <div>
                    <span className="font-semibold text-text">AI-assisted fill coming soon.</span>{' '}
                    Enter a permit name and Claude will look up key dates, agency info, and booking links for you.
                  </div>
                </div>
              </>
            )}

            {/* Step: Details */}
            {step === 'details' && selectedType && (
              <>
                {aiPrefill && (
                  <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded border mb-4 ${
                    aiPrefill.confidence === 'high'
                      ? 'bg-pine-dim border-pine-border'
                      : aiPrefill.confidence === 'medium'
                        ? 'bg-amber-dim border-amber-border'
                        : 'bg-red-dim border-red-border'
                  }`}>
                    <span className={`font-mono text-label font-bold tracking-widest uppercase shrink-0 mt-0.5 ${
                      aiPrefill.confidence === 'high' ? 'text-pine' : aiPrefill.confidence === 'medium' ? 'text-amber' : 'text-red'
                    }`}>
                      {aiPrefill.confidence === 'high' ? 'Verify' : aiPrefill.confidence === 'medium' ? 'Review carefully' : 'Low confidence'}
                    </span>
                    <span className="text-caption text-text-mid leading-relaxed">{aiPrefill.verificationNote}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <TypeChip type={selectedType} />
                  {!isEditing && (
                    <button
                      onClick={() => setStep('type')}
                      className="font-mono text-label text-text-dim hover:text-text transition-colors uppercase tracking-widest bg-transparent border-none cursor-pointer p-0"
                    >
                      Change
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1.5 block">Permit name *</label>
                    <input
                      className="w-full px-3 py-2 border border-border rounded text-body bg-surface-2 text-text outline-none focus:border-border-mid transition-colors"
                      placeholder="e.g. Mt. Whitney overnight permit"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      autoFocus={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1.5 block">Agency / issuer</label>
                    <input
                      className="w-full px-3 py-2 border border-border rounded text-body bg-surface-2 text-text outline-none focus:border-border-mid transition-colors"
                      placeholder="e.g. Inyo NF · recreation.gov"
                      value={agency}
                      onChange={e => setAgency(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="font-mono text-label tracking-[0.14em] uppercase text-text-dim mb-1.5 block">Notes</label>
                    <textarea
                      className="w-full px-3 py-2 border border-border rounded text-body bg-surface-2 text-text outline-none focus:border-border-mid transition-colors resize-none"
                      placeholder="Why this permit is needed, key dates, links…"
                      rows={3}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Critical dates section */}
                <div className="mt-5">
                  <div className="h-px bg-border mb-4" />
                  <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-3">Critical dates</div>

                  {(presetRows.length > 0 || customRows.length > 0 || addingCustom) && (
                    <div className="border border-border rounded-lg overflow-hidden divide-y divide-border mb-2.5">

                      {/* Preset rows */}
                      {presetRows.map(d => (
                        <div key={d.key} className="flex flex-col gap-2 px-3.5 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-label text-text-dim leading-tight">{d.label}</span>
                            <div className="flex gap-1 shrink-0">
                              {TONE_BTNS.map(tb => (
                                <button
                                  key={tb.value}
                                  onClick={() => updateDraftDate(d.key, { tone: tb.value })}
                                  className={`px-2 py-0.5 rounded border font-mono text-label font-bold tracking-[0.06em] uppercase transition-colors cursor-pointer ${
                                    d.tone === tb.value ? tb.cls : 'bg-transparent border-border text-text-dim hover:border-border-mid'
                                  }`}
                                >
                                  {tb.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={d.dateStr}
                              onChange={e => updateDraftDate(d.key, { dateStr: e.target.value })}
                              className={`flex-1 ${INPUT_CLS}`}
                            />
                            <input
                              type="time"
                              value={d.timeStr}
                              onChange={e => updateDraftDate(d.key, { timeStr: e.target.value })}
                              className={`w-28 shrink-0 ${INPUT_CLS}`}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Custom rows */}
                      {customRows.map(d => (
                        <div key={d.key} className="flex flex-col gap-2 px-3.5 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={d.label}
                              onChange={e => updateDraftDate(d.key, { label: e.target.value })}
                              placeholder="Label"
                              className={`flex-1 ${INPUT_CLS}`}
                            />
                            <div className="flex gap-1 shrink-0">
                              {TONE_BTNS.map(tb => (
                                <button
                                  key={tb.value}
                                  onClick={() => updateDraftDate(d.key, { tone: tb.value })}
                                  className={`px-2 py-0.5 rounded border font-mono text-label font-bold tracking-[0.06em] uppercase transition-colors cursor-pointer ${
                                    d.tone === tb.value ? tb.cls : 'bg-transparent border-border text-text-dim hover:border-border-mid'
                                  }`}
                                >
                                  {tb.label}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => removeDraftDate(d.key)}
                              className="text-text-dim hover:text-red transition-colors p-0.5 bg-transparent border-none cursor-pointer shrink-0"
                              title="Remove"
                            >
                              <IconX size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={d.dateStr}
                              onChange={e => updateDraftDate(d.key, { dateStr: e.target.value })}
                              className={`flex-1 ${INPUT_CLS}`}
                            />
                            <input
                              type="time"
                              value={d.timeStr}
                              onChange={e => updateDraftDate(d.key, { timeStr: e.target.value })}
                              className={`w-28 shrink-0 ${INPUT_CLS}`}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Inline custom date form */}
                      {addingCustom && (
                        <div className="flex flex-col gap-2 px-3.5 py-3 bg-surface-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={customLabel}
                              onChange={e => setCustomLabel(e.target.value)}
                              placeholder="Label"
                              autoFocus
                              className={`flex-1 ${INPUT_CLS}`}
                            />
                            <div className="flex gap-1 shrink-0">
                              {TONE_BTNS.map(tb => (
                                <button
                                  key={tb.value}
                                  onClick={() => setCustomTone(tb.value)}
                                  className={`px-2 py-0.5 rounded border font-mono text-label font-bold tracking-[0.06em] uppercase transition-colors cursor-pointer ${
                                    customTone === tb.value ? tb.cls : 'bg-transparent border-border text-text-dim hover:border-border-mid'
                                  }`}
                                >
                                  {tb.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={customDate}
                              onChange={e => setCustomDate(e.target.value)}
                              className={`flex-1 ${INPUT_CLS}`}
                            />
                            <input
                              type="time"
                              value={customTime}
                              onChange={e => setCustomTime(e.target.value)}
                              className={`w-28 shrink-0 ${INPUT_CLS}`}
                            />
                          </div>
                          <div className="flex gap-2 pt-0.5">
                            <button
                              onClick={commitCustomDate}
                              disabled={!customDate || !customLabel.trim()}
                              className="font-mono text-label text-pine hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => setAddingCustom(false)}
                              className="font-mono text-label text-text-dim hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!addingCustom && (
                    <button
                      onClick={() => setAddingCustom(true)}
                      className="inline-flex items-center gap-1 font-mono text-label text-text-dim hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0"
                    >
                      <IconPlus size={9} /> Add critical date
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="font-mono text-caption tracking-widest uppercase text-text-dim hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0"
          >
            Cancel
          </button>
          {step === 'type' ? (
            <button
              onClick={() => selectedType && setStep('details')}
              disabled={!selectedType}
              className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <IconChevronRight />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setStep('type')}
                  className="inline-flex items-center gap-1 font-heading text-caption font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
                >
                  <IconChevronLeft /> Back
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-3 py-2 rounded border border-amber-border bg-amber-dim text-amber hover:bg-amber transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isEditing ? 'Save changes' : <><IconPlus size={10} /> Add to trip</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
