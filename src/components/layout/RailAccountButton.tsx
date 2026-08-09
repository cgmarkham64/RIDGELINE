import type { User } from '../../types/auth'
import { initials } from '../../lib/utils'

export function RailAccountButton({ user, onClick }: { user: User; onClick: () => void }) {
  return (
    <div className="rail-tip-wrap shrink-0">
      <button
        onClick={onClick}
        className="w-9 h-9 rounded-full overflow-hidden border-[1.5px] border-border-mid hover:border-amber cursor-pointer bg-surface-3 flex items-center justify-center p-0 shrink-0 transition-[border-color] duration-150"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover block"
          />
        ) : (
          <span className="font-heading text-body-sm font-extrabold text-amber leading-none">
            {initials(user.name)}
          </span>
        )}
      </button>
      <span className="rail-tip">Account</span>
    </div>
  )
}
