import type { ReactNode } from 'react'

export function CondCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-surface-2 border border-border rounded-md px-2.75 py-2.25">
      <div className="font-mono text-label tracking-[0.12em] uppercase text-text-mid mb-1.25">
        {label}
      </div>
      {children}
    </div>
  )
}
