import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import JwksClient from 'jwks-rsa'

// Initialized at module load time — dotenv/config runs before this file is required.
// When KEYCLOAK_JWKS_URI is set, all tokens must be Keycloak RS256 JWTs.
// When unset, falls back to local HS256 JWTs (dev without Docker).
const jwksClient = process.env.KEYCLOAK_JWKS_URI
  ? JwksClient({
      jwksUri: process.env.KEYCLOAK_JWKS_URI,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
    })
  : null

// Reads the first claim present as a non-empty string; throws otherwise, so a
// malformed or legacy token can never smuggle `undefined` through as `string`.
function firstStringClaim(payload: jwt.JwtPayload, claims: string[]): string {
  for (const claim of claims) {
    const value = payload[claim]
    if (typeof value === 'string' && value.length > 0) return value
  }
  throw new Error(`Token missing required claim: ${claims.join(' or ')}`)
}

async function verifyToken(token: string): Promise<{ sub: string; email: string; name: string }> {
  if (jwksClient) {
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded || typeof decoded === 'string') throw new Error('Invalid token structure')
    const key = await jwksClient.getSigningKey(decoded.header.kid)
    const payload = jwt.verify(token, key.getPublicKey(), {
      algorithms: ['RS256'],
      issuer: process.env.KEYCLOAK_ISSUER,
    })
    if (typeof payload === 'string') throw new Error('Invalid token payload')
    return {
      sub: firstStringClaim(payload, ['sub']),
      email: firstStringClaim(payload, ['email']),
      // Keycloak uses "name" (full name) or falls back to "preferred_username"
      name: firstStringClaim(payload, ['name', 'preferred_username']),
    }
  }

  // Local JWT path — used when running outside Docker (npm run dev:all)
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  const payload = jwt.verify(token, secret, { algorithms: ['HS256'] })
  if (typeof payload === 'string') throw new Error('Invalid token payload')
  return {
    sub: firstStringClaim(payload, ['sub']),
    email: firstStringClaim(payload, ['email']),
    name: firstStringClaim(payload, ['name']),
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