const NOTES_ROWS = 3

type WeatherNotesCardProps = {
  notes: string
  canEdit: boolean
  onChange: (notes: string) => void
}

export function WeatherNotesCard({ notes, canEdit, onChange }: WeatherNotesCardProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-[18px]">
      <label className="font-mono text-label tracking-[0.16em] uppercase text-text-dim mb-2 block">Weather notes</label>
      <textarea
        className="w-full px-3 py-2 border border-border rounded-sm text-body-sm bg-surface-2 text-text outline-none focus:border-border-mid transition-colors resize-none leading-relaxed"
        rows={NOTES_ROWS}
        placeholder="Conditions, concerns, or anything worth noting…"
        value={notes}
        disabled={!canEdit}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
