import { Request, Response, RequestHandler } from 'express'

export function formatUserResponse(
  sub: string,
  email: string,
  name: string,
  profile?: { avatarUrl?: string | null } | null,
): { id: string; email: string; name: string; avatarUrl: string | null } {
  return { id: sub, email, name, avatarUrl: profile?.avatarUrl ?? null }
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