import type { ReactNode } from 'react'
import type { Claim } from '@/models/claim'
import StatusBadge from './StatusBadge'

export const vnd = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

// Phần thông tin công khai của claim. Trang nào cần thêm nút/field thì truyền vào children.
export default function ClaimCard({ claim, children }: { claim: Claim; children?: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-lg border bg-white p-4 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={claim.photoUrl} alt="" className="h-24 w-32 shrink-0 rounded object-cover" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{claim.victimName}</span>
          <StatusBadge status={claim.status} />
          <span className="ml-auto text-xs text-slate-400">{claim.id}</span>
        </div>
        <div className="text-sm">
          📍 {claim.region} · GPS {claim.gps} · <b>{vnd(claim.amount)}</b>
        </div>
        <div className="text-sm text-slate-600">{claim.description}</div>
        <div className="text-xs text-slate-500">
          ✍️ Tạo bởi {claim.createdByName}
          {claim.approvals.map((a) => (
            <span key={a.role}> · ✍️ {a.userName}</span>
          ))}
          {claim.paidBy && <span> · 💸 {claim.paidBy}</span>}
        </div>
        {children}
      </div>
    </div>
  )
}
