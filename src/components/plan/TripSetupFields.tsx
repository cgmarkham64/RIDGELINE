const inputCls = 'w-full px-3 py-2 border border-border focus:border-border-mid rounded-sm text-body-sm bg-surface-2 text-text outline-none transition-[border-color] duration-[140ms] placeholder:text-text-dim'
const labelCls = 'font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1.5 block'

export function TripSetupFields({
  title, setTitle,
  location, setLocation,
  startDate, setStartDate,
  endDate, setEndDate,
}: {
  title: string; setTitle: (v: string) => void
  location: string; setLocation: (v: string) => void
  startDate: string; setStartDate: (v: string) => void
  endDate: string; setEndDate: (v: string) => void
}) {
  return (
    <>
      <div>
        <label className={labelCls}>Trip name *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Sierra High Route"
          className={inputCls}
          autoFocus
        />
      </div>

      <div>
        <label className={labelCls}>Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. John Muir Wilderness, CA"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Start date *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value) }}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>End date *</label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
    </>
  )
}
