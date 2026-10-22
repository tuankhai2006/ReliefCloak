// Phía server: xác định ai đang gọi API.
// - Mock mode: SIMULATED TideCloak. Verify the EdDSA token from lib/simTide.ts (same claims as Tide).
// - Tide mode: verify Bearer token bằng TideCloak, lấy realm roles trong token.
import { verifyTideCloakToken } from '@tidecloak/nextjs/server'
import type { TidecloakConfig } from '@tidecloak/nextjs/server'
import rawConfig from '../tidecloak.json'
import { NextResponse } from 'next/server'
import { ServiceError } from '@/services/claimService'
import { rolesOf as simRolesOf, verifyToken as verifySimToken } from './simTide'

const tcConfig = rawConfig as TidecloakConfig
export const MOCK = process.env.NEXT_PUBLIC_TIDE_MOCK === 'true'

export interface SessionUser {
  id: string
  name: string
  roles: string[]
}

export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  if (MOCK) {
    // Simulated TideCloak: same Bearer-token path as real Tide. The token's signature, issuer,
    // client and expiry are verified and roles come only from its claims (lib/simTide.ts).
    // A caller-supplied x-mock-user header is no longer trusted.
    const bearer = req.headers.get('authorization')
    if (!bearer?.startsWith('Bearer ')) return null
    const claims = verifySimToken(bearer.slice(7))
    if (!claims) return null
    return { id: claims.vuid, name: claims.name ?? claims.preferred_username, roles: simRolesOf(claims) }
  }

  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  let payload: Record<string, any> | null
  try { payload = (await verifyTideCloakToken(tcConfig, auth.slice(7), [])) as Record<string, any> | null }
  catch { return null }
  if (!payload) return null
  if (typeof (payload.vuid ?? payload.sub) !== 'string' || !Array.isArray(payload.realm_access?.roles)) return null
  return {
    id: payload.vuid ?? payload.sub,
    name: payload.preferred_username ?? 'unknown',
    roles: simRolesOf(payload as any), // realm roles + client roles (tide-realm-admin is on realm-management)
  }
}

// Bọc route handler: lấy user, bắt ServiceError thành JSON lỗi.
export async function withUser(
  req: Request,
  fn: (user: SessionUser) => unknown | Promise<unknown>,
): Promise<NextResponse> {
  try {
    const user = await getSessionUser(req)
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    return NextResponse.json(await fn(user))
  } catch (err) {
    if (err instanceof SyntaxError) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    if (err instanceof ServiceError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error(err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
