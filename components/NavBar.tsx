'use client'
// Header công khai: điều hướng theo vai, chọn ngôn ngữ, chọn tài khoản demo (mock) hoặc đăng nhập Tide.
// Ẩn link chỉ để dễ dùng; quyền thật được kiểm tra ở API.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTide, MOCK } from '@/lib/tide'
import { LANGS, useLang, useT } from '@/lib/i18n'
import { common, type CommonKey } from '@/messages/common'

const INTERNAL = ['org_admin', 'auditor', 'disburser']

const LINKS: { href: string; key: CommonKey; show: (has: (r: string) => boolean, signedIn: boolean) => boolean }[] = [
  { href: '/campaigns', key: 'navCampaigns', show: () => true },
  { href: '/transparency', key: 'navTransparency', show: () => true },
  { href: '/reports', key: 'navReport', show: (has, signedIn) => !signedIn || has('appUser') },
  { href: '/me', key: 'navDashboard', show: (has) => has('appUser') },
  { href: '/admin', key: 'navAdmin', show: (has) => INTERNAL.some(has) },
]

// Bảng tin cũ (trước khi có chiến dịch). Các trang claim cũ đã bị bỏ khỏi luồng chính (A9).
const LEGACY = [{ href: '/posts', label: 'Posts' }]

export default function NavBar() {
  const { user, login, logout, hasRole, mockUsers, switchMockUser } = useTide()
  const { lang, setLang } = useLang()
  const t = useT(common)
  const path = usePathname()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [path])

  const links = LINKS.filter((l) => l.show(hasRole, !!user))
  const isActive = (href: string) => path === href || path.startsWith(href + '/')

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-emerald-800">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 text-white">⛑</span>
          {t('brand')}
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${isActive(l.href) ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              {t(l.key)}
            </Link>
          ))}
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100">{t('navLegacy')} ▾</summary>
            <div className="absolute left-0 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
              {LEGACY.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
                  {l.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LangSwitch lang={lang} setLang={setLang} label={t('language')} />
          <div className="hidden md:block">
            {account()}
          </div>
          <button
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {t('menu')}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-slate-200 px-4 pb-4 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col py-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-2 py-2 text-slate-800 hover:bg-slate-100">
                {t(l.key)}
              </Link>
            ))}
            {LEGACY.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100">
                {t('navLegacy')}: {l.label}
              </Link>
            ))}
          </nav>
          {account()}
        </div>
      )}
    </header>
  )

  function account() {
    if (MOCK && mockUsers && switchMockUser)
      return (
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">{t('pickRoleLabel')}</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm md:w-auto"
            value={user?.id ?? ''}
            onChange={(e) => switchMockUser(e.target.value || null)}
          >
            <option value="">{t('pickRole')}</option>
            {mockUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      )
    return user ? (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-700">{user.name}</span>
        <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5">
          {t('logout')}
        </button>
      </div>
    ) : (
      <button onClick={login} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800">
        {t('login')}
      </button>
    )
  }
}

function LangSwitch({ lang, setLang, label }: { lang: string; setLang: (l: 'vi' | 'en') => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex overflow-hidden rounded-lg border border-slate-300 text-xs font-semibold">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2.5 py-1.5 uppercase ${lang === l ? 'bg-emerald-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
