import { useRef, useState } from 'react'
import { useAuthStore } from '../../store/auth'
import { api } from '../../lib/api'
import { uploadAvatar, removeAvatar } from '../../lib/auth'
import type { AuthResponse } from '../../types/auth'

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

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)',
  padding: '8px 10px',
  color: 'var(--text)',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-dim)',
  marginBottom: 5,
  display: 'block',
}

const sectionStyle: React.CSSProperties = {
  borderTop: '1px solid var(--border)',
  paddingTop: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

export function AccountDialog({ onClose }: Props) {
  const { user, updateUser, setAuth } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)

  // Name form
  const [name, setName] = useState(user?.name ?? '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  // Password form
  const [pwOpen, setPwOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  if (!user) return null

  const nameDirty = name.trim() !== user.name

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarHovered, setAvatarHovered] = useState(false)

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
    } catch (err: any) {
      setAvatarError(err?.response?.data?.error ?? 'Upload failed. Please try again.')
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
    } catch (err: any) {
      setAvatarError(err?.response?.data?.error ?? 'Remove failed')
    } finally {
      setAvatarSaving(false)
    }
  }

  // ── Name save ───────────────────────────────────────────────────────────────
  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!nameDirty || !user) return
    const currentUser = user
    setNameSaving(true)
    setNameError(null)
    try {
      const { data } = await api.put<AuthResponse>('/api/auth/me', { name: name.trim() })
      setAuth(data.token, { id: data.user.id, email: data.user.email, name: data.user.name, avatarUrl: currentUser.avatarUrl })
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 2500)
    } catch (err: any) {
      setNameError(err?.response?.data?.error ?? 'Failed to save')
    } finally {
      setNameSaving(false)
    }
  }

  // ── Password change ──────────────────────────────────────────────────────────
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const currentUser = user
    setPwError(null)
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters'); return }
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    setPwSaving(true)
    try {
      const { data } = await api.put<AuthResponse>('/api/auth/me', {
        currentPassword: currentPw,
        newPassword: newPw,
      })
      setAuth(data.token, { id: data.user.id, email: data.user.email, name: data.user.name, avatarUrl: currentUser.avatarUrl })
      setPwSuccess(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => { setPwSuccess(false); setPwOpen(false) }, 2500)
    } catch (err: any) {
      setPwError(err?.response?.data?.error ?? 'Failed to update password')
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-mid)',
          borderRadius: 'var(--r-lg)',
          width: '100%', maxWidth: 380,
          margin: '0 16px',
          overflow: 'hidden',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1,
        }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
            Account
          </span>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 'var(--r-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            cursor: 'pointer', color: 'var(--text-dim)',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 14, height: 14, strokeWidth: 2 }}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Avatar ─────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <button
              title="Change photo"
              onClick={() => fileRef.current?.click()}
              onMouseEnter={() => setAvatarHovered(true)}
              onMouseLeave={() => setAvatarHovered(false)}
              style={{
                width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                border: `2px solid ${avatarHovered ? 'var(--amber)' : 'var(--border-mid)'}`,
                cursor: 'pointer', background: 'var(--surface3)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', position: 'relative', flexShrink: 0, padding: 0,
                transition: 'border-color 0.08s',
              }}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: 'var(--amber)', lineHeight: 1 }}>
                  {initials(user.name)}
                </span>
              )}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: avatarHovered ? 1 : 0,
                transition: 'opacity 0.08s',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" style={{ width: 20, height: 20, strokeWidth: 1.8 }}>
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </button>

            <input ref={fileRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={handleAvatarChange} />

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarSaving}
                style={{
                  background: 'none', border: 'none', cursor: avatarSaving ? 'default' : 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: 11, padding: 0,
                  color: avatarHovered ? 'var(--amber)' : 'var(--text-mid)',
                  transition: 'color 0.08s',
                }}
              >
                {avatarSaving ? 'Saving…' : 'Change photo'}
              </button>
              {user.avatarUrl && !avatarSaving && (
                <>
                  <span style={{ color: 'var(--border-mid)', fontSize: 10 }}>·</span>
                  <button
                    onClick={handleRemoveAvatar}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)',
                      transition: 'color 0.08s',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--red)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-dim)')}
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
            {avatarError && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)', margin: 0 }}>
                {avatarError}
              </p>
            )}
          </div>

          {/* ── Profile ────────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(null); setNameSuccess(false) }}
                  style={fieldStyle}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input value={user.email} readOnly style={{ ...fieldStyle, color: 'var(--text-dim)', cursor: 'default' }} />
              </div>
              {nameError && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)', margin: 0 }}>
                  {nameError}
                </p>
              )}
              <button
                type="submit"
                disabled={!nameDirty || nameSaving}
                style={{
                  alignSelf: 'flex-end',
                  padding: '7px 16px',
                  borderRadius: 'var(--r-md)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: nameDirty ? 'pointer' : 'default',
                  background: nameSuccess ? 'var(--pine-dim)' : nameDirty ? 'var(--amber)' : 'var(--surface3)',
                  color: nameSuccess ? 'var(--pine)' : nameDirty ? '#000' : 'var(--text-dim)',
                  border: nameSuccess ? '1px solid var(--pine-border)' : nameDirty ? '1px solid transparent' : '1px solid var(--border)',
                  transition: 'all 0.15s',
                }}
              >
                {nameSaving ? 'Saving…' : nameSuccess ? 'Saved' : 'Save name'}
              </button>
            </form>
          </div>

          {/* ── Password ───────────────────────────────────────────────────── */}
          <div style={sectionStyle}>
            <button
              onClick={() => { setPwOpen((o) => !o); setPwError(null) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%',
              }}
            >
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                Change password
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                style={{
                  width: 14, height: 14, strokeWidth: 2, color: 'var(--text-dim)',
                  transform: pwOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
                }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {pwOpen && (
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Current password</label>
                  <input type="password" value={currentPw} onChange={(e) => { setCurrentPw(e.target.value); setPwError(null) }}
                    style={fieldStyle} autoComplete="current-password" />
                </div>
                <div>
                  <label style={labelStyle}>New password</label>
                  <input type="password" value={newPw} onChange={(e) => { setNewPw(e.target.value); setPwError(null) }}
                    style={fieldStyle} autoComplete="new-password" />
                </div>
                <div>
                  <label style={labelStyle}>Confirm new password</label>
                  <input type="password" value={confirmPw} onChange={(e) => { setConfirmPw(e.target.value); setPwError(null) }}
                    style={fieldStyle} autoComplete="new-password" />
                </div>
                {pwError && (
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)', margin: 0 }}>
                    {pwError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                  style={{
                    alignSelf: 'flex-end',
                    padding: '7px 16px',
                    borderRadius: 'var(--r-md)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: pwSaving || !currentPw || !newPw || !confirmPw ? 'default' : 'pointer',
                    background: pwSuccess ? 'var(--pine-dim)' : 'var(--surface3)',
                    color: pwSuccess ? 'var(--pine)' : 'var(--text)',
                    border: pwSuccess ? '1px solid var(--pine-border)' : '1px solid var(--border)',
                    transition: 'all 0.15s',
                  }}
                >
                  {pwSaving ? 'Updating…' : pwSuccess ? 'Password updated' : 'Update password'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}