export function MapEmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2.5 bg-bg">
      <div className="text-[32px] opacity-[0.15]">🗺</div>
      <p className="font-mono text-label tracking-[0.12em] uppercase text-text-dim text-center max-w-[220px] leading-[1.8]">
        Import a planned route or GPS track in the right panel, or add a waypoint below to render
        the map
      </p>
    </div>
  )
}