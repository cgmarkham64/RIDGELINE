export function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col items-center justify-center h-full bg-bg gap-3">
      <div className="font-mono text-label tracking-[0.2em] uppercase text-text-dim">
        Coming soon
      </div>
      <div className="font-heading text-h1 font-extrabold text-text tracking-[-0.01em]">
        {label}
      </div>
    </div>
  )
}