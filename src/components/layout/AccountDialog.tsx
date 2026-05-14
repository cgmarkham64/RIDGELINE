import React, { useRef, useState } from 'react'
import { useAuthStore } from '../../store/auth'
import { uploadAvatar, removeAvatar } from '../../lib/auth'
import { initials } from '../../lib/utils'
import { IconX } from '../icons'

interface Props {
  onClose: () => void
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const size = 200
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      const scale = Math.max(size / img.width, size / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

function apiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { error?: string } } }).response
    if (res?.data?.error) return res.data.error
  }
  return fallback
}


export function AccountDialog({ onClose }: Props) {
  const { user, updateUser } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)

  // Avatar
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)


  if (!user) return null

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate before any async work
    if (!file.type.startsWith('image/')) {
      setAvatarError('File must be an image (JPEG, PNG, WEBP, etc.)')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    const MAX_BYTES = 5 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      setAvatarError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 5 MB.`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setAvatarSaving(true)
    setAvatarError(null)
    try {
      const dataUrl = await resizeImage(file)
      const updated = await uploadAvatar(dataUrl)
      updateUser({ avatarUrl: updated.avatarUrl ?? undefined })
    } catch (err: unknown) {
      setAvatarError(apiError(err, 'Upload failed. Please try again.'))
    } finally {
      setAvatarSaving(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleRemoveAvatar() {
    setAvatarSaving(true)
    setAvatarError(null)
    try {
      await removeAvatar()
      updateUser({ avatarUrl: undefined })
    } catch (err: unknown) {
      setAvatarError(apiError(err, 'Remove failed'))
    } finally {
      setAvatarSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-1001 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-mid rounded-lg w-full max-w-95 mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface z-1">
          <span className="font-heading text-sm font-extrabold text-text">
            Account
          </span>
          <button onClick={onClose} className="w-7 h-7 rounded-sm flex items-center justify-center bg-surface-2 border border-border cursor-pointer text-text-dim">
            <IconX size={14} />
          </button>
        </div>

        <div className="px-5 py-6 flex flex-col gap-5">

          {/* ── Avatar ─────────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-2.5">
            <button
              title="Change photo"
              onClick={() => fileRef.current?.click()}
              className="group w-20 h-20 rounded-full overflow-hidden cursor-pointer bg-surface-3 flex items-center justify-center relative shrink-0 p-0 border-2 border-border-mid hover:border-amber transition-[border-color] duration-30"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name}
                  className="w-full h-full object-cover block" />
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

            <input ref={fileRef} type="file" accept="image/*"
              className="hidden" onChange={handleAvatarChange} />

            <div className="flex gap-3 items-center">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarSaving}
                className="bg-transparent border-0 font-mono text-[11px] p-0 transition-colors duration-80 text-text-mid hover:text-amber"
                style={{ cursor: avatarSaving ? 'default' : 'pointer' }}
              >
                {avatarSaving ? 'Saving…' : 'Change photo'}
              </button>
              {user.avatarUrl && !avatarSaving && (
                <>
                  <span className="text-border-mid text-[10px]">·</span>
                  <button
                    onClick={handleRemoveAvatar}
                    className="bg-transparent border-0 cursor-pointer p-0 font-mono text-[11px] transition-colors duration-30 text-text-dim hover:text-red"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
            {avatarError && (
              <p className="font-mono text-[10px] text-red m-0">
                {avatarError}
              </p>
            )}
          </div>

          {/* ── Profile ────────────────────────────────────────────────────── */}
          <div className="border-t border-border pt-4 flex flex-col gap-3">
            <div>
              <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1.25 block">Name</label>
              <input value={user.name} readOnly className="w-full bg-surface-2 border border-border rounded-sm px-2.5 py-2 text-text-dim font-sans text-[13px] outline-none cursor-default" />
            </div>
            <div>
              <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-text-dim mb-1.25 block">Email</label>
              <input value={user.email} readOnly className="w-full bg-surface-2 border border-border rounded-sm px-2.5 py-2 text-text-dim font-sans text-[13px] outline-none cursor-default" />
            </div>
          </div>


        </div>
      </div>

    </div>
  )
}