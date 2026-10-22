'use client'
// K7: lịch sử ủng hộ của chính người đăng nhập.
import Link from 'next/link'
import { useApi } from '@/lib/useApi'
import { useBilingual, useFormat, useT } from '@/lib/i18n'
import { donationMsg } from '@/messages/donations'
import RequireResident from '@/components/RequireResident'
import { Badge, ButtonLink, Card, Empty, ErrorState, Loading, PageHeader, Stat } from '@/components/ui'
import type { DonationReceipt } from '@/services/publicService'

export default function DonationsPage() {
  const t = useT(donationMsg)
  return (
    <div className="space-y-6">
      <PageHeader title={t('historyTitle')} subtitle={t('historySubtitle')} />
      <RequireResident>
        <History />
      </RequireResident>
    </div>
  )
}

function History() {
  const t = useT(donationMsg)
  const pick = useBilingual()
  const f = useFormat()
  const { data, error, reload } = useApi<DonationReceipt[]>('/api/donations')
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return <Loading />
  if (!data.length) return <Empty action={<ButtonLink href="/campaigns">{t('findCampaign')}</ButtonLink>}>{t('noHistory')}</Empty>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label={t('total')} value={f.vnd(data.reduce((s, d) => s + d.amountVnd, 0))} tone="text-emerald-800" />
        <Stat label={t('count')} value={f.number(data.length)} />
      </div>
      {/* Bảng trên màn rộng, thẻ trên điện thoại */}
      <Card className="hidden overflow-x-auto p-0 sm:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">{t('date')}</th>
              <th className="px-4 py-2">{t('campaign')}</th>
              <th className="px-4 py-2 text-right">{t('amount')}</th>
              <th className="px-4 py-2">{t('visibility')}</th>
              <th className="px-4 py-2">{t('receipt')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-2 whitespace-nowrap">{f.date(d.createdAt)}</td>
                <td className="px-4 py-2"><Link href={`/campaigns/${d.campaignId}`} className="hover:underline">{pick(d.campaignTitle)}</Link></td>
                <td className="px-4 py-2 text-right font-semibold">{f.vnd(d.amountVnd)}</td>
                <td className="px-4 py-2">{d.anonymous ? <Badge tone="gray">{t('shownAnonymous')}</Badge> : <Badge tone="green">{t('shownName')}</Badge>}</td>
                <td className="px-4 py-2"><Link href={`/donations/${d.id}`} className="font-mono text-emerald-800 hover:underline">{d.receipt}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <ul className="space-y-2 sm:hidden">
        {data.map((d) => (
          <li key={d.id}>
            <Link href={`/donations/${d.id}`} className="block rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{pick(d.campaignTitle)}</span>
                <span className="font-semibold text-emerald-800">{f.vnd(d.amountVnd)}</span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>{f.date(d.createdAt)}</span>
                <span className="font-mono">{d.receipt}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
