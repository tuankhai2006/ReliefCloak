'use client'
// ④ Officer mở khóa STK (chỉ thành công khi có quyền decrypt) rồi giải ngân (giả lập).
import { useState } from 'react'
import { useTide } from '@/lib/tide'
import { useClaims } from '@/lib/useClaims'
import ClaimCard from '@/components/ClaimCard'
import EncryptedField from '@/components/EncryptedField'
import RequireRole from '@/components/RequireRole'

export default function DisbursePage() {
  const { decryptField, authFetch } = useTide()
  const { claims, reload } = useClaims()
  const [plain, setPlain] = useState<Record<string, { bank?: string; id?: string; error?: string }>>({})

  async function unlock(id: string, bankCipher: string, idCipher: string) {
    try {
      const [bank, nid] = await Promise.all([decryptField(bankCipher), decryptField(idCipher)])
      setPlain({ ...plain, [id]: { bank, id: nid } })
    } catch (err: any) {
      setPlain({ ...plain, [id]: { error: err.message || 'Không giải mã được' } })
    }
  }

  async function release(id: string) {
    const res = await authFetch(`/api/claims/${id}/release`, { method: 'POST' })
    if (!res.ok) setPlain({ ...plain, [id]: { ...plain[id], error: (await res.json()).error } })
    reload()
  }

  const ready = claims.filter((c) => c.status === 'APPROVED' || c.status === 'PAID')
  return (
    <RequireRole roles={['disburser']}>
      <h1 className="mb-3 text-2xl font-bold">Giải ngân</h1>
      <div className="space-y-3">
        {ready.length === 0 && <p className="text-slate-500">Chưa có claim nào đủ chữ ký.</p>}
        {ready.map((c) => (
          <ClaimCard key={c.id} claim={c}>
            <EncryptedField label="STK" cipher={c.encryptedBankAccount} plain={plain[c.id]?.bank} error={plain[c.id]?.error} />
            <EncryptedField label="CCCD" cipher={c.encryptedNationalId} plain={plain[c.id]?.id} />
            {c.status === 'APPROVED' && (
              <div className="mt-2 flex gap-2">
                <button onClick={() => unlock(c.id, c.encryptedBankAccount, c.encryptedNationalId)} className="rounded border px-3 py-1 text-sm">
                  🔓 Mở khóa STK
                </button>
                <button
                  onClick={() => release(c.id)}
                  disabled={!plain[c.id]?.bank}
                  className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-40"
                >
                  💸 Giải ngân (giả lập)
                </button>
              </div>
            )}
          </ClaimCard>
        ))}
      </div>
    </RequireRole>
  )
}
