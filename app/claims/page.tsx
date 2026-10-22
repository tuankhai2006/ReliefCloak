'use client'
// ② Chủ quỹ + Auditor duyệt. Họ thấy số tiền, vùng, ảnh, nhưng STK/CCCD luôn 🔒.
import { useState } from 'react'
import { useTide } from '@/lib/tide'
import { useClaims } from '@/lib/useClaims'
import ClaimCard from '@/components/ClaimCard'
import EncryptedField from '@/components/EncryptedField'

export default function ClaimsPage() {
  const { authFetch, hasRole, user } = useTide()
  const { claims, reload } = useClaims()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const canApprove = hasRole('org_admin') || hasRole('auditor')

  async function approve(id: string) {
    const res = await authFetch(`/api/claims/${id}/approve`, { method: 'POST' })
    setErrors({ ...errors, [id]: res.ok ? '' : (await res.json()).error })
    reload()
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Danh sách claim</h1>
      {!canApprove && <p className="text-sm text-slate-500">Chỉ Chủ quỹ / Auditor mới có nút duyệt.</p>}
      {claims.map((c) => (
        <ClaimCard key={c.id} claim={c}>
          <EncryptedField label="STK" cipher={c.encryptedBankAccount} />
          <EncryptedField label="CCCD" cipher={c.encryptedNationalId} />
          {canApprove && c.status === 'PENDING' && (
            <button
              onClick={() => approve(c.id)}
              disabled={c.approvals.some((a) => a.userId === user?.id)}
              className="mt-2 rounded bg-emerald-600 px-3 py-1 text-sm text-white disabled:opacity-40"
            >
              ✍️ Duyệt
            </button>
          )}
          {errors[c.id] && <p className="text-sm text-red-600">❌ {errors[c.id]}</p>}
        </ClaimCard>
      ))}
    </div>
  )
}
