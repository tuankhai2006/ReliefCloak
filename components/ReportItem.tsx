'use client'
import { useFormat, useT } from '@/lib/i18n'
import { reportMsg } from '@/messages/reports'
import { common, type CommonKey } from '@/messages/common'
import type { CommunityReport } from '@/models/community'
import ReportTimeline from './ReportTimeline'
import { Badge, Card } from './ui'

export default function ReportItem({ report, compact = false }: { report: CommunityReport; compact?: boolean }) {
  const t = useT(reportMsg)
  const tc = useT(common)
  const f = useFormat()
  const status = report.status ?? 'NEW'
  const needs = report.needs ? report.needs.split(',').filter(Boolean) : []
  return (
    <Card className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">📍 {report.region}</h3>
        {report.urgency === 'URGENT' && <Badge status="URGENT" />}
        <span className="ml-auto text-xs text-slate-500">{t('sentAt', { date: f.dateTime(report.createdAt) })}</span>
      </div>
      <ReportTimeline status={status} />
      {!compact && (
        <>
          {!!needs.length && (
            <div className="flex flex-wrap gap-1">
              {needs.map((n) => <Badge key={n} tone="blue">{n in common ? tc(n as CommonKey) : n}</Badge>)}
            </div>
          )}
          <p className="whitespace-pre-wrap text-sm text-slate-700">{report.description}</p>
        </>
      )}
      <div className={`rounded-lg px-3 py-2 text-sm ${report.feedback ? (status === 'REJECTED' ? 'bg-red-50 text-red-900' : 'bg-emerald-50 text-emerald-900') : 'bg-slate-50 text-slate-500'}`}>
        <span className="font-medium">{t('feedback')}: </span>
        {report.feedback ?? t('noFeedback')}
      </div>
    </Card>
  )
}
