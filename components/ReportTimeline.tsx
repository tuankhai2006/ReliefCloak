'use client'
// Trạng thái report: NEW → VERIFYING → ACCEPTED | REJECTED.
import { useT } from '@/lib/i18n'
import { reportMsg } from '@/messages/reports'
import { common } from '@/messages/common'
import type { ReportStatus } from '@/models/relief'

const ORDER: ReportStatus[] = ['NEW', 'VERIFYING', 'ACCEPTED']

export default function ReportTimeline({ status }: { status: ReportStatus }) {
  const t = useT(reportMsg)
  const tc = useT(common)
  const reached = status === 'REJECTED' ? 2 : ORDER.indexOf(status)
  const steps = [t('tlSent'), t('tlVerifying'), status === 'REJECTED' ? tc('REJECTED') : status === 'ACCEPTED' ? tc('ACCEPTED') : t('tlDecided')]
  return (
    <ol className="flex flex-wrap items-center gap-1 text-xs" aria-label={tc(status)}>
      {steps.map((label, i) => {
        const done = i <= reached
        const bad = status === 'REJECTED' && i === 2
        return (
          <li key={i} className="flex items-center gap-1">
            <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${bad ? 'bg-red-500' : done ? 'bg-emerald-600' : 'bg-slate-300'}`} />
            <span className={done ? (bad ? 'font-medium text-red-700' : 'font-medium text-slate-800') : 'text-slate-400'}>{label}</span>
            {i < 2 && <span aria-hidden className={`mx-1 h-px w-5 ${i < reached ? 'bg-emerald-600' : 'bg-slate-300'}`} />}
          </li>
        )
      })}
    </ol>
  )
}
