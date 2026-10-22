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
  if (MOCK) return <MockBridge>{children}</MockBridge>
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
      roles: payload.realm_access?.roles ?? [],
    }
  }, [tc.authenticated, tc.token])

  const api: TideApi = {
    ready: !tc.isInitializing,
    user,
    login: () => tc.login(),
    logout: () => tc.logout(),
    hasRole: (r) => tc.hasRealmRole(r),
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

const MOCK_USERS: TideUser[] = [
  { id: 'resident-1', name: 'An (Người dân)', roles: ['appUser'] },
  { id: 'fw-1', name: 'Lan (Field Worker)', roles: ['field_worker', '_tide_payout.selfencrypt'] },
  { id: 'org-1', name: 'Minh (Chủ quỹ)', roles: ['org_admin'] },
  { id: 'aud-1', name: 'Hà (Auditor)', roles: ['auditor'] },
  { id: 'off-1', name: 'Tuấn (Officer)', roles: ['disburser', '_tide_payout.selfdecrypt'] },
]

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

function MockBridge({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      setUserId(localStorage.getItem('mock-user'))
    } catch {}
    setReady(true)
  }, [])

  const switchMockUser = useCallback((id: string | null) => {
    setUserId(id)
    try {
      id ? localStorage.setItem('mock-user', id) : localStorage.removeItem('mock-user')
    } catch {}
  }, [])

  const user = MOCK_USERS.find((u) => u.id === userId) ?? null
  const hasRole = (r: string) => !!user?.roles.includes(r)

  const api: TideApi = {
    ready,
    user,
    login: () => {},
    logout: () => switchMockUser(null),
    hasRole,
    encryptField: async (plain) => {
      if (!hasRole(`_tide_${PAYOUT_TAG}.selfencrypt`)) throw new Error('Không có quyền mã hóa')
      return mockEncrypt(plain)
    },
    decryptField: async (cipher) => {
      if (!hasRole(`_tide_${PAYOUT_TAG}.selfdecrypt`)) throw new Error('Không có quyền giải mã')
      return mockDecrypt(cipher)
    },
    authFetch: (url, init = {}) =>
      fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
          ...(user ? { 'x-mock-user': encodeURIComponent(JSON.stringify(user)) } : {}),
        },
      }),
    mockUsers: MOCK_USERS,
    switchMockUser,
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
