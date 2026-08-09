const INPUT_CLS = 'px-2.5 py-1.5 bg-surface-2 border border-border rounded font-mono text-fine text-text outline-none focus:border-border-mid transition-[border-color]'

type CriticalDateFieldsProps = {
  label: string
  date: string
  time: string
  onLabelChange: (v: string) => void
  onDateChange: (v: string) => void
  onTimeChange: (v: string) => void
}

export function CriticalDateFields({ label, date, time, onLabelChange, onDateChange, onTimeChange }: CriticalDateFieldsProps) {
  return (
    <>
      <input
        type="text"
        value={label}
        onChange={e => onLabelChange(e.target.value)}
        placeholder="Description"
        autoFocus
        className={`w-full ${INPUT_CLS}`}
      />
      <div className="flex gap-2">
        <input type="date" value={date} onChange={e => onDateChange(e.target.value)} className={`flex-1 ${INPUT_CLS}`} />
        <input type="time" value={time} onChange={e => onTimeChange(e.target.value)} className={`w-28 shrink-0 ${INPUT_CLS}`} />
      </div>
    </>
  )
}
