import type { ReactNode, MouseEvent } from 'react'

interface Props {
  children: ReactNode
  panelClassName: string
  backdropClassName?: string
  zIndexClassName?: string
  onClose?: () => void
}

const DEFAULT_BACKDROP = 'bg-black/70'
const DEFAULT_Z_INDEX = 'z-50'

export function Modal({
  children,
  panelClassName,
  backdropClassName = DEFAULT_BACKDROP,
  zIndexClassName = DEFAULT_Z_INDEX,
  onClose,
}: Props) {
  return (
    <div
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center ${backdropClassName}`}
      onClick={onClose}
    >
      <div className={panelClassName} onClick={(e: MouseEvent) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
