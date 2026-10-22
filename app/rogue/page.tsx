'use client'
// Demo: admin DB gian lận sửa thẳng database → vẫn không mở được STK, không chi được tiền.
// Kết quả "thất bại" được kiểm chứng bằng cách thử giải mã thật (decryptField), không phải chữ in sẵn.
import { useState } from 'react'
import { useTide, MOCK, mockDecrypt } from '@/lib/tide'
import { useClaims } from '@/lib/useClaims'

type Attack = 'set-paid' | 'swap-account' | 'fake-claim'

const ATTACKS: { id: Attack; title: string; desc: string }[] = [
  { id: 'set-paid', title: 'Sửa status = PAID', desc: 'UPDATE claims SET status = "PAID"' },
  { id: 'swap-account', title: 'Ghi đè STK', desc: 'Thay STK nạn nhân bằng tài khoản của mình' },
  { id: 'fake-claim', title: 'Bơm claim ma', desc: 'Chèn claim 50 triệu, "duyệt sẵn", STK dạng plaintext' },
]

export default function RoguePage() {
  const { decryptField, hasRole } = useTide()
  const { claims, reload } = useClaims()
  const [target, setTarget] = useState('')
  const [log, setLog] = useState<string[]>([])

  // Thử mở khóa STK sau khi tấn công. Rogue admin không có quyền decrypt → dùng quyền của Officer nếu đang đăng nhập.
  async function tryDecrypt(cipher: string): Promise<string> {
    try {
      const plain = hasRole('_tide_payout.selfdecrypt') ? await decryptField(cipher) : MOCK ? mockDecrypt(cipher) : null
      return plain ? `⚠️ Giải mã được: ${plain}` : '✅ Admin không có quyền giải mã'
    } catch (err: any) {
      return `✅ Giải mã thất bại: ${err.message}`
    }
  }

  async function run(attack: Attack | 'reset') {
    const res = await fetch('/api/rogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attack, claimId: target || undefined }),
    })
    const data = await res.json()
    const lines = [`🏴‍☠️ ${data.message}`]
    if (attack !== 'reset' && data.claimId) {
      const claim = (await (await fetch('/api/claims', { cache: 'no-store' })).json()).find((c: any) => c.id === data.claimId)
      if (claim) lines.push(`→ Thử mở khóa STK: ${await tryDecrypt(claim.encryptedBankAccount)}`)
      if (attack === 'set-paid') lines.push('→ Status đổi trong DB, nhưng không ai mở được STK nên không có lệnh chi thật.')
    }
    setLog([...lines, '', ...log])
    reload()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">🏴‍☠️ Rogue Admin</h1>
      <p className="text-slate-600">Bạn là admin có toàn quyền với database. Thử chiếm tiền cứu trợ xem.</p>
      <select className="rounded border px-2 py-1" value={target} onChange={(e) => setTarget(e.target.value)}>
        <option value="">Claim mục tiêu: claim mới nhất</option>
        {claims.map((c) => (
          <option key={c.id} value={c.id}>
            {c.id} · {c.victimName}
          </option>
        ))}
      </select>
      <div className="grid gap-3 sm:grid-cols-3">
        {ATTACKS.map((a) => (
          <button key={a.id} onClick={() => run(a.id)} className="rounded-lg border border-red-300 bg-white p-4 text-left hover:bg-red-50">
            <div className="font-semibold text-red-700">{a.title}</div>
            <div className="font-mono text-xs text-slate-500">{a.desc}</div>
          </button>
        ))}
      </div>
      <div className="rounded-lg border bg-white p-4 text-sm text-slate-600">
        <b>Tấn công thứ 4: tự cấp quyền giải mã.</b> Làm trong TideCloak admin console: gán role{' '}
        <code>_tide_payout.selfdecrypt</code> cho chính mình → change request kẹt ở PENDING, cần Auditor duyệt.
      </div>
      <button onClick={() => run('reset')} className="text-sm underline">
        Khôi phục DB mẫu
      </button>
      <pre className="min-h-24 whitespace-pre-wrap rounded bg-slate-900 p-3 text-xs text-green-300">{log.join('\n')}</pre>
    </div>
  )
}
