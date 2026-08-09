import { IconFile } from '../../../icons'
import type { Contact } from './departStage.constants'
import { OnePagerPreview } from './OnePagerPreview'

export function OnePagerCard({ days, contacts }: {
  days: { n: number; name: string; mi: number; hard?: boolean }[] | null
  contacts: Contact[]
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="font-mono text-label tracking-[0.16em] uppercase text-text-dim">One-pager</span>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1.5 font-heading text-label font-bold tracking-[0.08em] uppercase px-2 py-1 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
        >
          <IconFile /> PDF
        </button>
      </div>
      <OnePagerPreview days={days} contacts={contacts} />
      <p className="font-mono text-label text-text-dim italic mt-2 leading-relaxed">
        Auto-generated from Route, Days, Permits, Food. Print &amp; leave with Sam.
      </p>
    </div>
  )
}
