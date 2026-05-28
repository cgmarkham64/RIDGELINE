import { Router } from 'express'
import { UserProfile, DEFAULT_PREFERENCES } from '../models/UserProfile'
import type { UserPreferences } from '../models/UserProfile'
import { asyncRoute, HttpError, formatUserResponse } from '../utils/routeHelpers'

const router = Router()

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

function validateTimePref(pref: unknown, field: string): void {
  if (!pref || typeof pref !== 'object') throw new HttpError(400, `${field}: must be an object`)
  const p = pref as Record<string, unknown>
  const allowed = new Set(['mode', 'anchor', 'offsetMinutes', 'staticTime'])
  for (const k of Object.keys(p)) {
    if (!allowed.has(k)) throw new HttpError(400, `${field}: unknown key '${k}'`)
  }
  if (p.mode !== 'relative' && p.mode !== 'static') {
    throw new HttpError(400, `${field}.mode: must be 'relative' or 'static'`)
  }
  if (p.mode === 'relative') {
    if (p.anchor !== 'sunrise' && p.anchor !== 'sunset') {
      throw new HttpError(400, `${field}.anchor: must be 'sunrise' or 'sunset' for relative mode`)
    }
    if (typeof p.offsetMinutes !== 'number' || !Number.isInteger(p.offsetMinutes)) {
      throw new HttpError(400, `${field}.offsetMinutes: must be an integer`)
    }
  }
  if (p.mode === 'static') {
    if (typeof p.staticTime !== 'string' || !/^\d{2}:\d{2}$/.test(p.staticTime)) {
      throw new HttpError(400, `${field}.staticTime: must be HH:MM`)
    }
  }
}

function validateWeatherTolerances(t: unknown): void {
  if (!t || typeof t !== 'object') throw new HttpError(400, 'weatherTolerances must be an object')
  const w = t as Record<string, unknown>
  const fields: Array<[string, number, number]> = [
    ['tempCautionF',    -100, 200],
    ['tempDelayF',      -100, 200],
    ['precipCautionPct', 0,   100],
    ['precipDelayPct',   0,   100],
    ['windCautionMph',   0,   300],
    ['windDelayMph',     0,   300],
  ]
  for (const [field, min, max] of fields) {
    const v = w[field]
    if (v !== null && (typeof v !== 'number' || v < min || v > max)) {
      throw new HttpError(400, `weatherTolerances.${field}: must be a number between ${min} and ${max}, or null`)
    }
  }
}

function validatePreferences(prefs: unknown): asserts prefs is UserPreferences {
  if (!prefs || typeof prefs !== 'object') throw new HttpError(400, 'preferences must be an object')
  const p = prefs as Record<string, unknown>
  const allowed = new Set(['wakeTime', 'onTrailTime', 'campByTime', 'weatherTolerances'])
  for (const k of Object.keys(p)) {
    if (!allowed.has(k)) throw new HttpError(400, `preferences: unknown key '${k}'`)
  }
  validateTimePref(p.wakeTime, 'wakeTime')
  validateTimePref(p.onTrailTime, 'onTrailTime')
  validateTimePref(p.campByTime, 'campByTime')
  validateWeatherTolerances(p.weatherTolerances)
}

// GET /me — syncs name + email from the token into UserProfile on every call,
// then returns the profile (which adds avatarUrl + preferences stored app-side).
router.get('/me', asyncRoute(async (req, res) => {
  const { sub, name, email } = req.user
  let profile = await UserProfile.findOneAndUpdate(
    { sub },
    { $set: { name, email } },
    { upsert: true, new: true }
  )
  // Lazy migration: backfill preferences for accounts that predate this field
  if (!profile.preferences) {
    profile = (await UserProfile.findOneAndUpdate(
      { sub },
      { $set: { preferences: DEFAULT_PREFERENCES } },
      { new: true }
    ))!
  }
  // Lazy migration: backfill weatherTolerances for accounts that predate it
  if (profile.preferences && !profile.preferences.weatherTolerances) {
    profile = (await UserProfile.findOneAndUpdate(
      { sub },
      { $set: { 'preferences.weatherTolerances': DEFAULT_PREFERENCES.weatherTolerances } },
      { new: true }
    ))!
  }
  res.json({ user: formatUserResponse(sub, email, name, profile) })
}))

router.put('/me/avatar', asyncRoute(async (req, res) => {
  const { avatarDataUrl } = req.body
  if (typeof avatarDataUrl !== 'string' || !avatarDataUrl.startsWith('data:image/')) {
    throw new HttpError(400, 'avatarDataUrl must be a valid image data URL')
  }
  // Estimate raw byte size from base64 payload length
  const base64 = avatarDataUrl.split(',')[1] ?? ''
  const rawBytes = Math.ceil(base64.length * 0.75)
  if (rawBytes > MAX_AVATAR_BYTES) throw new HttpError(413, 'Image exceeds 5 MB limit')
  const { sub, name, email } = req.user
  const profile = await UserProfile.findOneAndUpdate(
    { sub },
    { $set: { avatarUrl: avatarDataUrl, name, email } },
    { upsert: true, new: true }
  )
  res.json({ user: formatUserResponse(sub, email, name, profile) })
}))

router.delete('/me/avatar', asyncRoute(async (req, res) => {
  const { sub, name, email } = req.user
  await UserProfile.findOneAndUpdate(
    { sub },
    { $unset: { avatarUrl: '' }, $set: { name, email } },
    { upsert: true }
  )
  res.json({ user: formatUserResponse(sub, email, name) })
}))

router.put('/me/preferences', asyncRoute(async (req, res) => {
  const { preferences } = req.body
  validatePreferences(preferences)
  const { sub, name, email } = req.user
  const profile = await UserProfile.findOneAndUpdate(
    { sub },
    { $set: { preferences } },
    { upsert: true, new: true }
  )
  res.json({ user: formatUserResponse(sub, email, name, profile) })
}))

export default router
