import type { ChangeEvent, RefObject } from 'react'
import type { User } from '../../../types/auth'
import { initials } from '../../../lib/utils'

export function ProfileTab({ user, fileRef, avatarSaving, avatarError, onAvatarChange, onRemoveAvatar }: {
  user: User
  fileRef: RefObject<HTMLInputElement | null>
  avatarSaving: boolean
  avatarError: string | null
  onAvatarChange: (e: ChangeEvent<HTMLInputElement>) => void
  onRemoveAvatar: () => void
}) {
  return (
    <>
      <div className="flex flex-col items-center gap-2.5">
        <button
          title="Change photo"
          onClick={() => fileRef.current?.click()}
          className="group w-20 h-20 rounded-full overflow-hidden cursor-pointer bg-surface-3 flex items-center justify-center relative shrink-0 p-0 border-2 border-border-mid hover:border-amber transition-[border-color] duration-30"
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover block" />
          ) : (
            <span className="font-heading text-[26px] font-extrabold text-amber leading-none">
              {initials(user.name)}
            </span>
          )}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-80"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" className="w-5 h-5" style={{ strokeWidth: 1.8 }}>
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        </button>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />

        <div className="flex gap-3 items-center">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarSaving}
            className="bg-transparent border-0 font-mono text-fine p-0 transition-colors duration-80 text-text-mid hover:text-amber"
            style={{ cursor: avatarSaving ? 'default' : 'pointer' }}
          >
            {avatarSaving ? 'Saving…' : 'Change photo'}
          </button>
          {user.avatarUrl && !avatarSaving && (
            <>
              <span className="text-border-mid text-caption">·</span>
              <button onClick={onRemoveAvatar} className="bg-transparent border-0 cursor-pointer p-0 font-mono text-fine transition-colors duration-30 text-text-dim hover:text-red">
                Remove
              </button>
            </>
          )}
        </div>
        {avatarError && <p className="font-mono text-caption text-red m-0">{avatarError}</p>}
      </div>

      <div className="border-t border-border pt-4 flex flex-col gap-3">
        <div>
          <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1.25 block">Name</label>
          <input value={user.name} readOnly className="w-full bg-surface-2 border border-border rounded-sm px-2.5 py-2 text-text-dim font-sans text-body outline-none cursor-default" />
        </div>
        <div>
          <label className="font-mono text-label tracking-[0.12em] uppercase text-text-dim mb-1.25 block">Email</label>
          <input value={user.email} readOnly className="w-full bg-surface-2 border border-border rounded-sm px-2.5 py-2 text-text-dim font-sans text-body outline-none cursor-default" />
        </div>
      </div>
    </>
  )
}
