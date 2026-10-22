// Phía server: xác định ai đang gọi API.
// - Mock mode: đọc header x-mock-user (do lib/tide.ts gửi kèm).
// - Tide mode: verify Bearer token bằng TideCloak, lấy realm roles trong token.
import { verifyTideCloakToken } from '@tidecloak/nextjs/server'
import type { TidecloakConfig } from '@tidecloak/nextjs/server'
import rawConfig from '../tidecloak.json'
import { NextResponse } from 'next/server'
import { ServiceError } from '@/services/claimService'
import { DEMO_USERS } from './demoUsers'

const tcConfig = rawConfig as TidecloakConfig
export const MOCK = process.env.NEXT_PUBLIC_TIDE_MOCK === 'true'

export interface SessionUser {
  id: string
  name: string
  roles: string[]
}

export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  if (MOCK) {
    const raw = req.headers.get('x-mock-user')
    if (!raw) return null
    try {
      const input = JSON.parse(decodeURIComponent(raw))
      // Ignore caller-supplied roles. Mock remains openly selectable, never real auth.
      return DEMO_USERS.find(user => user.id === input?.id) ?? null
    } catch { return null }
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
    roles: payload.realm_access?.roles ?? [],
  }
}

// Bọc route handler: lấy user, bắt ServiceError thành JSON lỗi.
export async function withUser(
  req: Request,
  fn: (user: SessionUser) => unknown | Promise<unknown>,
): Promise<NextResponse> {
  try {
    const user = await getSessionUser(req)
    if (!user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    return NextResponse.json(await fn(user))
  } catch (err) {
    if (err instanceof SyntaxError) return NextResponse.json({ error: 'JSON không hợp lệ' }, { status: 400 })
    if (err instanceof ServiceError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error(err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
