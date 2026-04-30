import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Augment Express Request so route handlers can read req.user.sub
declare global {
  namespace Express {
    interface Request {
      user: { sub: string; email: string; name: string }
    }
  }
}

// verifyToken is isolated here so swapping to Keycloak's JWKS verification
// only requires changing this one function — route handlers and middleware
// signature stay identical.
//
// Keycloak swap: replace jwt.verify(..., secret) with:
//   const jwksClient = JwksClient({ jwksUri: process.env.KEYCLOAK_JWKS_URI })
//   const key = await jwksClient.getSigningKey(header.kid)
//   jwt.verify(token, key.getPublicKey(), { algorithms: ['RS256'] })
async function verifyToken(token: string): Promise<{ sub: string; email: string; name: string }> {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  const payload = jwt.verify(token, secret) as jwt.JwtPayload
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    name: payload.name as string,
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const token = header.slice(7)
  try {
    req.user = await verifyToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}