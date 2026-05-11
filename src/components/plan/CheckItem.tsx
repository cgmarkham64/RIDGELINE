export function CheckItem({ text, done = false }: { text: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${done ? 'bg-pine-dim border-pine-border text-pine' : 'border-border text-text-dim'}`}>
        {done && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span className={`text-[12px] ${done ? 'text-text' : 'text-text-dim'}`}>{text}</span>
    </div>
  )
}