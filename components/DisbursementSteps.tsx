'use client'
// Tiến trình công khai của một khoản chi: đề xuất → kiểm toán độc lập → chi (mô phỏng).
import { useFormat, useT } from '@/lib/i18n'
import { campaignMsg } from '@/messages/campaigns'
import type { PayoutStatus } from '@/models/relief'

interface Step {
  status: PayoutStatus
  proposedAt: string
  auditedAt?: string
  paidAt?: string
}

export default function DisbursementSteps({ d }: { d: Step }) {
  const t = useT(campaignMsg)
  const f = useFormat()
  const rejected = d.status === 'REJECTED'
  const steps = [
    { label: t('stepProposed'), at: d.proposedAt, done: true, bad: false },
    { label: rejected ? t('rejected') : t('stepAudited'), at: d.auditedAt ?? null, done: !!d.auditedAt, bad: rejected },
    { label: t('stepPaid'), at: d.paidAt ?? null, done: d.status === 'PAID_SIMULATED', bad: false },
  ]
  return (
    <ol className="grid gap-2 text-xs sm:grid-cols-3">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-2">
          <span
            aria-hidden
            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${s.bad ? 'bg-red-100 text-red-700' : s.done ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white text-slate-400'}`}
          >
            {s.bad ? '✕' : s.done ? '✓' : i + 1}
          </span>
          <span>
            <span className={`block font-medium ${s.done || s.bad ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</span>
            <span className="text-slate-500">{s.done || s.bad ? f.dateTime(s.at) : '—'}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
