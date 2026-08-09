import { useRef, useState } from 'react'

const TOOLTIP_HIDE_DELAY_MS = 80

export function InfoTooltip({ text, align = 'center' }: { text: string; align?: 'center' | 'right' }) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pos = align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'

  function show() {
    if (timer.current) clearTimeout(timer.current)
    setOpen(true)
  }
  function hide() {
    timer.current = setTimeout(() => setOpen(false), TOOLTIP_HIDE_DELAY_MS)
  }

  return (
    <div className="relative inline-flex items-center shrink-0">
      <span
        onMouseEnter={show} onMouseLeave={hide}
        className="w-3.5 h-3.5 rounded-full border border-text-dim/50 flex items-center justify-center cursor-default text-text-dim hover:border-amber hover:text-amber transition-colors duration-80"
      >
        <span className="font-mono text-[8px] leading-none select-none">i</span>
      </span>
      <div
        onMouseEnter={show} onMouseLeave={hide}
        className={`absolute bottom-full mb-2 w-48 bg-surface-3 border border-border-mid rounded px-2.5 py-2 font-mono text-caption text-text-mid leading-relaxed z-50 whitespace-normal transition-opacity duration-200 ease-out ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${pos}`}
      >
        {text}
      </div>
    </div>
  )
}
