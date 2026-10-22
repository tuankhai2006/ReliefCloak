'use client'
import Link from 'next/link'
import { useTide, MOCK } from '@/lib/tide'

const LINKS = [
  { href: '/posts', label: 'Bảng tin', role: null },
  { href: '/reports', label: 'Report', role: null },
  { href: '/claim/new', label: 'Tạo claim', role: 'field_worker' },
  { href: '/claims', label: 'Duyệt claim', role: null },
  { href: '/disburse', label: 'Giải ngân', role: 'disburser' },
  { href: '/public', label: 'Công khai', role: null },
  { href: '/rogue', label: '🏴‍☠️ Rogue Admin', role: null },
]

export default function NavBar() {
  const { user, login, logout, hasRole, mockUsers, switchMockUser } = useTide()

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="font-bold text-blue-700">
          🛡️ ReliefCloak
        </Link>
        <nav className="flex flex-wrap gap-3 text-sm">
          {LINKS.filter((l) => !l.role || hasRole(l.role)).map((l) => (
            <Link key={l.href} href={l.href} className="hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {MOCK && mockUsers && switchMockUser ? (
            <select
              className="rounded border px-2 py-1"
              value={user?.id ?? ''}
              onChange={(e) => switchMockUser(e.target.value || null)}
            >
              <option value="">— Chọn vai (mock) —</option>
              {mockUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          ) : user ? (
            <>
              <span>{user.name}</span>
              <button onClick={logout} className="rounded border px-2 py-1">
                Đăng xuất
              </button>
            </>
          ) : (
            <button onClick={login} className="rounded bg-blue-600 px-3 py-1 text-white">
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
