'use client'
// Trang riêng của người dân. Chỉ là UX; API vẫn tự kiểm tra quyền.
import type { ReactNode } from 'react'
import { useTide, MOCK } from '@/lib/tide'
import { useT } from '@/lib/i18n'
import { common } from '@/messages/common'
import { Button, ButtonLink, Empty, Loading, Notice } from './ui'

export default function RequireResident({ children }: { children: ReactNode }) {
  const { ready, user, hasRole, login } = useTide()
  const t = useT(common)
  if (!ready) return <Loading />
  if (!user)
    return <Empty action={MOCK ? null : <Button onClick={login}>{t('login')}</Button>}>{MOCK ? t('signInNeededMock') : t('signInNeeded')}</Empty>
  if (!hasRole('appUser'))
    return (
      <Notice kind="warn">
        {t('residentOnly')}{' '}
        <ButtonLink href="/admin" variant="ghost" size="sm" className="ml-2">{t('navAdmin')}</ButtonLink>
      </Notice>
    )
  return <>{children}</>
}
