import { IconCheck } from '../../../icons'

interface ConfirmPartyRowProps {
  partyConfirmed: boolean
  onConfirmParty: () => void
}

export function ConfirmPartyRow({ partyConfirmed, onConfirmParty }: ConfirmPartyRowProps) {
  return (
    <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
      {partyConfirmed ? (
        <span className="font-mono text-label text-pine flex items-center gap-1.5">
          <IconCheck size={10} /> Party confirmed
        </span>
      ) : (
        <button
          onClick={onConfirmParty}
          className="inline-flex items-center gap-1.5 font-heading text-caption font-bold tracking-[0.08em] uppercase px-2.5 py-1.5 rounded border border-border text-text-mid bg-transparent hover:border-border-mid transition-colors cursor-pointer"
        >
          Confirm party
        </button>
      )}
    </div>
  )
}
