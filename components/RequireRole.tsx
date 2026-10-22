'use client'
import type { ReactNode } from 'react'
import { useTide, MOCK } from '@/lib/tide'
import { useT } from '@/lib/i18n'
import { common } from '@/messages/common'

export default function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { ready, user, hasRole } = useTide()
  const t = useT(common)
  if (!ready) return <p>{t('loading')}</p>
  if (!user) return <p>{MOCK ? t('signInNeededMock') : t('signInNeeded')}</p>
  if (!roles.some(hasRole)) return <p>{t('forbiddenRole', { roles: roles.join(' / ') })}</p>
  return <>{children}</>
}
