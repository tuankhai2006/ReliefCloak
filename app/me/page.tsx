'use client'
// K5: bảng điều khiển của người dân: report gần đây, tóm tắt ủng hộ, lối tắt.
import Link from 'next/link'
import { useTide } from '@/lib/tide'
import { useApi } from '@/lib/useApi'
import { useBilingual, useFormat, useT } from '@/lib/i18n'
import { dashboardMsg } from '@/messages/reports'
import type { CommunityReport as Report } from '@/models/community'
import type { DonationReceipt } from '@/services/publicService'
import RequireResident from '@/components/RequireResident'
import ReportItem from '@/components/ReportItem'
import { ButtonLink, Card, Empty, ErrorState, Loading, PageHeader, Stat } from '@/components/ui'

export default function DashboardPage() {
  return (
    <RequireResident>
      <Dashboard />
    </RequireResident>
  )
}

function Dashboard() {
  const t = useT(dashboardMsg)
  const pick = useBilingual()
  const f = useFormat()
  const { user } = useTide()
  const reports = useApi<Report[]>('/api/reports')
  const donations = useApi<DonationReceipt[]>('/api/donations')
  const mine = (reports.data ?? []).filter((r) => r.createdBy === user?.id)
  const given = (donations.data ?? []).reduce((s, d) => s + d.amountVnd, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('hello', { name: user?.name ?? '' })}
        subtitle={t('subtitle')}
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/reports" variant="urgent">{t('newReport')}</ButtonLink>
            <ButtonLink href="/campaigns">{t('donate')}</ButtonLink>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label={t('reportsOpen')} value={f.number(mine.filter((r) => !r.status || r.status === 'NEW' || r.status === 'VERIFYING').length)} />
        <Stat label={t('totalGiven')} value={f.vnd(given)} tone="text-emerald-800" />
        <Stat label={t('receipts')} value={f.number(donations.data?.length ?? 0)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="r" className="space-y-3">
          <div className="flex items-end justify-between">
            <h2 id="r" className="text-lg font-semibold">{t('recentReports')}</h2>
            <Link href="/reports" className="text-sm text-emerald-800 hover:underline">{t('seeAll')}</Link>
          </div>
          {reports.error ? <ErrorState error={reports.error} onRetry={reports.reload} /> : !reports.data ? <Loading /> : !mine.length ? <Empty>—</Empty> : mine.slice(0, 3).map((r) => <ReportItem key={r.id} report={r} compact />)}
        </section>
        <section aria-labelledby="d" className="space-y-3">
          <div className="flex items-end justify-between">
            <h2 id="d" className="text-lg font-semibold">{t('recentDonations')}</h2>
            <Link href="/donations" className="text-sm text-emerald-800 hover:underline">{t('seeAll')}</Link>
          </div>
          {donations.error ? (
            <ErrorState error={donations.error} onRetry={donations.reload} />
          ) : !donations.data ? (
            <Loading />
          ) : !donations.data.length ? (
            <Empty>—</Empty>
          ) : (
            <Card className="p-0">
              <ul className="divide-y divide-slate-100">
                {donations.data.slice(0, 5).map((d) => (
                  <li key={d.id}>
                    <Link href={`/donations/${d.id}`} className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50">
                      <span>
                        <span className="block font-medium">{pick(d.campaignTitle)}</span>
                        <span className="text-xs text-slate-500">{f.date(d.createdAt)} · <span className="font-mono">{d.receipt}</span></span>
                      </span>
                      <span className="font-semibold text-emerald-800">{f.vnd(d.amountVnd)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      </div>
    </div>
  )
}
