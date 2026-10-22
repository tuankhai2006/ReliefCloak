'use client'
// Lớp bọc TideCloak cho phía client. Mọi trang chỉ dùng useTide(), không gọi SDK trực tiếp.
// - Mock mode (NEXT_PUBLIC_TIDE_MOCK=true): chọn vai bằng nút, mã hóa giả. Dùng để code song song.
// - Tide mode: login thật, doEncrypt/doDecrypt thật qua Tide Fabric.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TideCloakProvider, useTideCloak } from '@tidecloak/nextjs'
import tcConfig from '../tidecloak.json'

export const MOCK = process.env.NEXT_PUBLIC_TIDE_MOCK === 'true'
export const PAYOUT_TAG = 'payout'

export interface TideUser {
  id: string
  name: string
  roles: string[]
}

export interface TideApi {
  ready: boolean
  user: TideUser | null
  login: () => void
  logout: () => void
  hasRole: (role: string) => boolean
  encryptField: (plain: string) => Promise<string>
  decryptField: (cipher: string) => Promise<string> // throw nếu không có quyền hoặc ciphertext hỏng
  authFetch: (url: string, init?: RequestInit) => Promise<Response>
  // chỉ có ở mock mode
  mockUsers?: TideUser[]
  switchMockUser?: (id: string | null) => void
}

const Ctx = createContext<TideApi | null>(null)

export function useTide(): TideApi {
  const api = useContext(Ctx)
  if (!api) throw new Error('useTide phải nằm trong <TideProvider>')
  return api
}

export function TideProvider({ children }: { children: ReactNode }) {
  if (MOCK) return <SimulatedTideBridge>{children}</SimulatedTideBridge>
  return (
    <TideCloakProvider config={tcConfig}>
      <RealBridge>{children}</RealBridge>
    </TideCloakProvider>
  )
}

// ───────────────────────── Tide thật ─────────────────────────

function RealBridge({ children }: { children: ReactNode }) {
  const tc = useTideCloak()

  const user = useMemo<TideUser | null>(() => {
    if (!tc.authenticated || !tc.token) return null
    const payload = JSON.parse(atob(tc.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return {
      id: payload.vuid ?? payload.sub,
      name: payload.preferred_username ?? 'unknown',
      roles: [...(payload.realm_access?.roles ?? []), ...Object.values(payload.resource_access ?? {}).flatMap((c: any) => c.roles ?? [])],
    }
  }, [tc.authenticated, tc.token])

  const api: TideApi = {
    ready: !tc.isInitializing,
    user,
    login: () => tc.login(),
    logout: () => tc.logout(),
    // tide-realm-admin is a client role on realm-management, not a realm role.
    hasRole: (r) => tc.hasRealmRole(r) || tc.hasClientRole(r, 'realm-management'),
    encryptField: async (plain) => (await tc.doEncrypt([{ data: plain, tags: [PAYOUT_TAG] }]))[0] as string,
    // TODO(Người 1): selfdecrypt chỉ mở được dữ liệu do CHÍNH user đó mã hóa.
    // Để Officer mở dữ liệu của Field Worker sau khi Chủ quỹ + Auditor duyệt, cần
    // Policy-protected decryption (draftDecryption → requestTideOperatorApproval → commitDecryption).
    // Xem docs/TEAM_PLAN.md mục "Phát hiện quan trọng".
    decryptField: async (cipher) => String((await tc.doDecrypt([{ encrypted: cipher, tags: [PAYOUT_TAG] }]))[0]),
    authFetch: (url, init = {}) =>
      fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init.headers, Authorization: `Bearer ${tc.token}` },
      }),
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

// ───────────────────────── Mock ─────────────────────────

// Checksum đơn giản để mô phỏng việc ciphertext bị sửa thì giải mã thất bại.
function checksum(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(16)
}
const b64encode = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)))
const b64decode = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)))

export function mockEncrypt(plain: string): string {
  return `MOCK:${b64encode(plain)}.${checksum(plain)}`
}

export function mockDecrypt(cipher: string): string {
  const m = /^MOCK:([A-Za-z0-9+/=]+)\.([0-9a-f]+)$/.exec(cipher)
  if (!m) throw new Error('Ciphertext không hợp lệ: không phải dữ liệu do Field Worker mã hóa')
  let plain: string
  try {
    plain = b64decode(m[1])
  } catch {
    throw new Error('Ciphertext bị chỉnh sửa, giải mã thất bại')
  }
  if (checksum(plain) !== m[2]) throw new Error('Ciphertext bị chỉnh sửa, giải mã thất bại')
  return plain
}

// SIMULATED TideCloak sign-in (mock mode). Picking a demo account stands in for the Tide enclave
// login; the server (lib/simTide.ts) returns an EdDSA-signed token with Tide-shaped claims and every
// API verifies it. Roles come only from the signed token, so changing them needs the IGA flow.
const SESSION_KEY = 'sim-tide-session'

interface SimSession {
  userId: string
  token: string
  exp: number
}

function claimsOf(token: string): Record<string, any> {
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))))
}

async function simLogin(userId: string): Promise<SimSession> {
  const res = await fetch('/api/sim-tide/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) })
  if (!res.ok) throw new Error('SIM_LOGIN_FAILED')
  const { accessToken } = await res.json()
  return { userId, token: accessToken, exp: claimsOf(accessToken).exp }
}

function SimulatedTideBridge({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SimSession | null>(null)
  const [accounts, setAccounts] = useState<TideUser[]>([])
  const [ready, setReady] = useState(false)

  const save = useCallback((next: SimSession | null) => {
    setSession(next)
    try {
      next ? localStorage.setItem(SESSION_KEY, JSON.stringify(next)) : localStorage.removeItem(SESSION_KEY)
    } catch {}
  }, [])

  useEffect(() => {
    fetch('/api/sim-tide/login').then((r) => r.json()).then(setAccounts).catch(() => setAccounts([]))
    let stored: SimSession | null = null
    try {
      stored = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')
    } catch {}
    // Expired session: sign in again silently, like Tide's silent SSO refresh.
    if (stored && stored.exp * 1000 < Date.now() + 30_000) simLogin(stored.userId).then(save, () => save(null)).finally(() => setReady(true))
    else {
      setSession(stored)
      setReady(true)
    }
  }, [save])

  const switchMockUser = useCallback(
    (id: string | null) => {
      if (!id) return save(null)
      simLogin(id).then(save, () => save(null))
    },
    [save],
  )

  const claims = session ? claimsOf(session.token) : null
  const roles: string[] = claims
    ? [...(claims.realm_access?.roles ?? []), ...Object.values(claims.resource_access ?? {}).flatMap((c: any) => c.roles ?? [])]
    : []
  const user: TideUser | null = claims ? { id: claims.vuid, name: claims.name ?? claims.preferred_username, roles } : null
  const hasRole = (r: string) => roles.includes(r)

  const freshToken = async () => {
    if (!session) return null
    if (session.exp * 1000 > Date.now() + 30_000) return session.token
    const next = await simLogin(session.userId)
    save(next)
    return next.token
  }

  const api: TideApi = {
    ready,
    user,
    login: () => {},
    logout: () => save(null),
    hasRole,
    encryptField: async (plain) => {
      if (!hasRole(`_tide_${PAYOUT_TAG}.selfencrypt`)) throw new Error('Không có quyền mã hóa')
      return mockEncrypt(plain)
    },
    decryptField: async (cipher) => {
      if (!hasRole(`_tide_${PAYOUT_TAG}.selfdecrypt`)) throw new Error('Không có quyền giải mã')
      return mockDecrypt(cipher)
    },
    authFetch: async (url, init = {}) => {
      const token = await freshToken()
      return fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
    },
    mockUsers: accounts,
    switchMockUser,
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
