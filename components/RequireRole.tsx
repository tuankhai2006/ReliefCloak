'use client'
import type { ReactNode } from 'react'
import { useTide } from '@/lib/tide'

export default function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { ready, user, hasRole } = useTide()
  if (!ready) return <p>Đang tải…</p>
  if (!user) return <p>Hãy đăng nhập (hoặc chọn vai ở góc phải).</p>
  if (!roles.some(hasRole)) return <p>Vai trò hiện tại không được vào trang này. Cần: {roles.join(' / ')}</p>
  return <>{children}</>
}
