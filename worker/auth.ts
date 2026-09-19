import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { AccessIdentity, Env } from './types'

type AccessCapable = {
  access?: {
    getIdentity: () => Promise<{ email?: string } | undefined>
  }
}

export function jsonError(message: string, status: number, code?: string) {
  return Response.json({ error: message, ...(code ? { code } : {}) }, { status })
}

function isLocalDev(request: Request, env: Env) {
  if (env.ENVIRONMENT !== 'development') return false
  const host = new URL(request.url).hostname
  return host === 'localhost' || host === '127.0.0.1'
}

async function verifyAccess(request: Request, env: Env, ctx: ExecutionContext): Promise<AccessIdentity | null> {
  if (!isLocalDev(request, env)) {
    const access = (ctx as ExecutionContext & AccessCapable).access
    if (access) {
      const identity = await access.getIdentity()
      if (identity?.email) return { email: identity.email }
    }
  }

  const token = request.headers.get('cf-access-jwt-assertion')
  const team = env.CF_ACCESS_TEAM_DOMAIN
  const aud = env.CF_ACCESS_AUD
  if (!token || !team || !aud) return null

  const JWKS = createRemoteJWKSet(new URL(`${team.replace(/\/$/, '')}/cdn-cgi/access/certs`))
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: team.replace(/\/$/, ''),
    audience: aud,
  })
  const email =
    typeof payload.email === 'string'
      ? payload.email
      : typeof payload.sub === 'string'
        ? payload.sub
        : 'access-user'
  return { email }
}

export async function requireAdmin(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<AccessIdentity | Response> {
  try {
    const accessUser = await verifyAccess(request, env, ctx)
    if (accessUser) return accessUser
  } catch {
    return jsonError('Invalid Cloudflare Access token', 401, 'ACCESS_INVALID')
  }

  if (isLocalDev(request, env)) {
    return { email: 'admin@localhost' }
  }

  return jsonError('Cloudflare Access authentication required', 401, 'ACCESS_REQUIRED')
}
