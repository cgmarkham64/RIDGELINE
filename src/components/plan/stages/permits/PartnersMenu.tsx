import { useRef, useState } from 'react'
import { useClickOutside } from '../../../../hooks/useClickOutside'
import { IconPlus, IconMinus, IconMoreVertical } from '../../../icons'

interface PartnersMenuProps {
  show: boolean
  isOwner: boolean
  soloTrip: boolean
  onAddPartner: () => void
  onNoPartners: () => void
}

export function PartnersMenu({ show, isOwner, soloTrip, onAddPartner, onNoPartners }: PartnersMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useClickOutside(menuRef, () => setOpen(false))

  if (!show) return null

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1 rounded text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none"
      >
        <IconMoreVertical size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-border-mid rounded shadow-xl z-20 overflow-hidden min-w-40">
          <button
            onMouseDown={() => { setOpen(false); onAddPartner() }}
            className="w-full flex items-center gap-2 px-3 py-2 font-heading text-caption font-bold tracking-[0.08em] uppercase text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none text-left"
          >
            <IconPlus size={10} />
            Add partner
          </button>
          {isOwner && soloTrip && (
            <button
              onMouseDown={() => { setOpen(false); onNoPartners() }}
              className="w-full flex items-center gap-2 px-3 py-2 font-heading text-caption font-bold tracking-[0.08em] uppercase text-text-dim hover:text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none text-left border-t border-border"
            >
              <IconMinus size={10} />
              No partners
            </button>
          )}
        </div>
      )}
    </div>
  )
}
