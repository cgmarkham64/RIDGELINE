import { IconPlus, IconX } from '../../../icons'
import { INPUT_CLS, TONE_BTNS } from './freeformDialog.helpers'
import type { CustomDraftInput, DraftDate } from './freeformDialog.types'
import type { PermitTone } from './permitsStage.types'
import { useCriticalDatesDraft } from './useCriticalDatesDraft'

function ToneButtonGroup({ value, onChange }: { value: PermitTone; onChange: (t: PermitTone) => void }) {
  return (
    <div className="flex gap-1 shrink-0">
      {TONE_BTNS.map((tb) => (
        <button
          key={tb.value}
          onClick={() => onChange(tb.value)}
          className={`px-2 py-0.5 rounded border font-mono text-label font-bold tracking-[0.06em] uppercase transition-colors cursor-pointer ${
            value === tb.value ? tb.cls : 'bg-transparent border-border text-text-dim hover:border-border-mid'
          }`}
        >
          {tb.label}
        </button>
      ))}
    </div>
  )
}

function DateTimeInputs({ dateStr, timeStr, onDateChange, onTimeChange }: {
  dateStr: string
  timeStr: string
  onDateChange: (v: string) => void
  onTimeChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input type="date" value={dateStr} onChange={(e) => onDateChange(e.target.value)} className={`flex-1 ${INPUT_CLS}`} />
      <input type="time" value={timeStr} onChange={(e) => onTimeChange(e.target.value)} className={`w-28 shrink-0 ${INPUT_CLS}`} />
    </div>
  )
}

function PresetDateRow({ date, onChange }: { date: DraftDate; onChange: (patch: Partial<DraftDate>) => void }) {
  return (
    <div className="flex flex-col gap-2 px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-label text-text-dim leading-tight">{date.label}</span>
        <ToneButtonGroup value={date.tone} onChange={(tone) => onChange({ tone })} />
      </div>
      <DateTimeInputs
        dateStr={date.dateStr}
        timeStr={date.timeStr}
        onDateChange={(dateStr) => onChange({ dateStr })}
        onTimeChange={(timeStr) => onChange({ timeStr })}
      />
    </div>
  )
}

function CustomDateRow({ date, onChange, onRemove }: {
  date: DraftDate
  onChange: (patch: Partial<DraftDate>) => void
  onRemove: () => void
}) {
  return (
    <div className="flex flex-col gap-2 px-3.5 py-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={date.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Label"
          className={`flex-1 ${INPUT_CLS}`}
        />
        <ToneButtonGroup value={date.tone} onChange={(tone) => onChange({ tone })} />
        <button onClick={onRemove} className="text-text-dim hover:text-red transition-colors p-0.5 bg-transparent border-none cursor-pointer shrink-0" title="Remove">
          <IconX size={12} />
        </button>
      </div>
      <DateTimeInputs
        dateStr={date.dateStr}
        timeStr={date.timeStr}
        onDateChange={(dateStr) => onChange({ dateStr })}
        onTimeChange={(timeStr) => onChange({ timeStr })}
      />
    </div>
  )
}

function AddCustomDateForm({ draft, onChange, onCommit, onCancel }: {
  draft: CustomDraftInput
  onChange: (updater: (c: CustomDraftInput) => CustomDraftInput) => void
  onCommit: () => void
  onCancel: () => void
}) {
  function patch(fields: Partial<CustomDraftInput>) {
    onChange((c) => ({ ...c, ...fields }))
  }

  return (
    <div className="flex flex-col gap-2 px-3.5 py-3 bg-surface-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft.label}
          onChange={(e) => patch({ label: e.target.value })}
          placeholder="Label"
          autoFocus
          className={`flex-1 ${INPUT_CLS}`}
        />
        <ToneButtonGroup value={draft.tone} onChange={(tone) => patch({ tone })} />
      </div>
      <DateTimeInputs
        dateStr={draft.date}
        timeStr={draft.time}
        onDateChange={(date) => patch({ date })}
        onTimeChange={(time) => patch({ time })}
      />
      <div className="flex gap-2 pt-0.5">
        <button
          onClick={onCommit}
          disabled={!draft.date || !draft.label.trim()}
          className="font-mono text-label text-pine hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
        <button onClick={onCancel} className="font-mono text-label text-text-dim hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0">
          Cancel
        </button>
      </div>
    </div>
  )
}

export function CriticalDatesSection({ dates }: { dates: ReturnType<typeof useCriticalDatesDraft> }) {
  const hasRows = dates.presetRows.length > 0 || dates.customRows.length > 0 || dates.addingCustom

  return (
    <div className="mt-5">
      <div className="h-px bg-border mb-4" />
      <div className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-3">Critical dates</div>

      {hasRows && (
        <div className="border border-border rounded-lg overflow-hidden divide-y divide-border mb-2.5">
          {dates.presetRows.map((d) => (
            <PresetDateRow key={d.key} date={d} onChange={(patch) => dates.updateDraftDate(d.key, patch)} />
          ))}
          {dates.customRows.map((d) => (
            <CustomDateRow key={d.key} date={d} onChange={(patch) => dates.updateDraftDate(d.key, patch)} onRemove={() => dates.removeDraftDate(d.key)} />
          ))}
          {dates.addingCustom && (
            <AddCustomDateForm
              draft={dates.customDraft}
              onChange={dates.setCustomDraft}
              onCommit={dates.commitCustomDate}
              onCancel={() => dates.setAddingCustom(false)}
            />
          )}
        </div>
      )}

      {!dates.addingCustom && (
        <button
          onClick={() => dates.setAddingCustom(true)}
          className="inline-flex items-center gap-1 font-mono text-label text-text-dim hover:text-text transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          <IconPlus size={9} /> Add critical date
        </button>
      )}
    </div>
  )
}
