import { Request, Response, RequestHandler } from 'express'
import type { UserPreferences } from '../models/UserProfile'

export function formatUserResponse(
  sub: string,
  email: string,
  name: string,
  profile?: { avatarUrl?: string | null; preferences?: UserPreferences | null } | null,
): { id: string; email: string; name: string; avatarUrl: string | null; preferences?: UserPreferences } {
  const base = { id: sub, email, name, avatarUrl: profile?.avatarUrl ?? null }
  return profile?.preferences ? { ...base, preferences: profile.preferences } : base
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

type AsyncHandler = (req: Request, res: Response) => Promise<unknown>

export function asyncRoute(fn: AsyncHandler): RequestHandler {
  return (req, res) => {
    fn(req, res).catch((err: unknown) => {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message })
      } else {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
      }
    })
  }
}

export function requireOwner(ownerSub: string, sub: string): void {
  if (ownerSub !== sub) throw new HttpError(403, 'Forbidden')
}