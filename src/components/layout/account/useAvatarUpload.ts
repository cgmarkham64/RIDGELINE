import { useRef, useState, type ChangeEvent, type RefObject } from 'react'
import { useAuthStore } from '../../../store/auth'
import { uploadAvatar, removeAvatar } from '../../../lib/auth'
import { apiError } from './accountDialog.helpers'

const AVATAR_RESIZE_PX = 200
const AVATAR_JPEG_QUALITY = 0.85
const BYTES_PER_KB = 1024
const KB_PER_MB = 1024
const MAX_AVATAR_MB = 5
const MAX_AVATAR_BYTES = MAX_AVATAR_MB * KB_PER_MB * BYTES_PER_KB

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const size = AVATAR_RESIZE_PX
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      const scale = Math.max(size / img.width, size / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', AVATAR_JPEG_QUALITY))
    }
    img.onerror = reject
    img.src = url
  })
}

interface AvatarDeps {
  setAvatarSaving: (v: boolean) => void
  setAvatarError: (v: string | null) => void
  updateUser: (patch: { avatarUrl?: string }) => void
  fileRef: RefObject<HTMLInputElement | null>
}

async function submitAvatarFile(file: File | undefined, deps: AvatarDeps) {
  const { setAvatarSaving, setAvatarError, updateUser, fileRef } = deps
  if (!file) return
  if (!file.type.startsWith('image/')) {
    setAvatarError('File must be an image (JPEG, PNG, WEBP, etc.)')
    if (fileRef.current) fileRef.current.value = ''
    return
  }
  if (file.size > MAX_AVATAR_BYTES) {
    setAvatarError(`File is too large (${(file.size / KB_PER_MB / BYTES_PER_KB).toFixed(1)} MB). Maximum size is ${MAX_AVATAR_MB} MB.`)
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

async function submitAvatarRemoval(deps: Omit<AvatarDeps, 'fileRef'>) {
  const { setAvatarSaving, setAvatarError, updateUser } = deps
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

export function useAvatarUpload() {
  const { user, updateUser } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const deps = { setAvatarSaving, setAvatarError, updateUser, fileRef }

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    void submitAvatarFile(e.target.files?.[0], deps)
  }
  function handleRemoveAvatar() {
    void submitAvatarRemoval(deps)
  }

  return { user, fileRef, avatarSaving, avatarError, handleAvatarChange, handleRemoveAvatar }
}
