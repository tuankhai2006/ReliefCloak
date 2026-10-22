'use client'
// Dải báo demo luôn hiển thị và chân trang.
import { useT } from '@/lib/i18n'
import { common } from '@/messages/common'

export function DemoBanner() {
  const t = useT(common)
  return (
    <div className="border-b border-orange-200 bg-orange-50 px-4 py-1.5 text-center text-xs text-orange-900">
      {t('demoBanner')}
    </div>
  )
}

export function Footer() {
  const t = useT(common)
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-500">
        <p className="font-medium text-slate-700">
          {t('brand')} · {t('tagline')}
        </p>
        <p className="mt-1">{t('footerNote')}</p>
      </div>
    </footer>
  )
}
