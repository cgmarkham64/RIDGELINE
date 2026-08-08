import type { ContextMenuPayload } from './routeMapCard.helpers'

const MENU_OFFSET_PX = 6

type RouteMapContextMenuProps = {
  menu: ContextMenuPayload | null
  onSplit: (segN: number, edgeIdx: number, splitPoint: [number, number]) => void
  onDismiss: () => void
}

export function RouteMapContextMenu({ menu, onSplit, onDismiss }: RouteMapContextMenuProps) {
  if (!menu) return null

  return (
    <div
      className="absolute z-[1000] bg-surface border border-border rounded-lg shadow-2xl py-1 min-w-[160px]"
      style={{ left: menu.x + MENU_OFFSET_PX, top: menu.y + MENU_OFFSET_PX }}
    >
      <button
        className="w-full text-left px-3 py-2 font-mono text-fine text-text hover:bg-surface-2 transition-colors cursor-pointer bg-transparent border-none"
        onClick={() => {
          onSplit(menu.segN, menu.edgeIdx, menu.splitPoint)
          onDismiss()
        }}
      >
        Split segment here
      </button>
    </div>
  )
}
