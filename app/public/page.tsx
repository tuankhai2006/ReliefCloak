'use client'
// ⑤ Trang minh bạch cho người quyên góp. Không cần đăng nhập. STK/CCCD không bao giờ hiện.
import { useClaims } from '@/lib/useClaims'
import StatusBadge from '@/components/StatusBadge'
import { vnd } from '@/components/ClaimCard'

export default function PublicPage() {
  const { claims } = useClaims()
  const paid = claims.filter((c) => c.status === 'PAID').reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Minh bạch dòng tiền</h1>
      <p className="text-slate-600">
        Đã giải ngân <b>{vnd(paid)}</b> cho {claims.filter((c) => c.status === 'PAID').length} hộ. Danh tính và STK của
        nạn nhân luôn được mã hóa.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full bg-white text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-2">Claim</th>
              <th className="p-2">Vùng</th>
              <th className="p-2">Số tiền</th>
              <th className="p-2">Trạng thái</th>
              <th className="p-2">Chữ ký</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="border-t align-top">
                <td className="p-2 font-mono text-xs">{c.id}</td>
                <td className="p-2">{c.region}</td>
                <td className="p-2">{vnd(c.amount)}</td>
                <td className="p-2">
                  <StatusBadge status={c.status} />
                </td>
                <td className="p-2 text-xs">
                  <div>✍️ {c.createdByName}</div>
                  {c.approvals.map((a) => (
                    <div key={a.role}>
                      ✍️ {a.userName} · {new Date(a.at).toLocaleString('vi-VN')}
                    </div>
                  ))}
                  {c.paidBy && <div>💸 {c.paidBy}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
