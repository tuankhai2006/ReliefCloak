'use client'
// K4: chi tiết chiến dịch: ảnh, nội dung, tiến độ, giải ngân công khai, ủng hộ gần đây, form ủng hộ.
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useApi } from '@/lib/useApi'
import { useBilingual, useFormat, useT } from '@/lib/i18n'
import { campaignMsg } from '@/messages/campaigns'
import { CampaignImage } from '@/components/CampaignCard'
import DonateForm from '@/components/DonateForm'
import DisbursementSteps from '@/components/DisbursementSteps'
import { Badge, Card, Empty, ErrorState, Loading, Notice, Progress } from '@/components/ui'
import type { PublicCampaignDetail } from '@/services/publicService'

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const t = useT(campaignMsg)
  const pick = useBilingual()
  const f = useFormat()
  const { data: c, error, loading, reload } = useApi<PublicCampaignDetail>(`/api/campaigns/${encodeURIComponent(id)}`)

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/campaigns" className="text-sm text-emerald-800 hover:underline">{t('backToList')}</Link>
        {error.status === 404 ? <Empty>{t('notFound')}</Empty> : <ErrorState error={error} onRetry={reload} />}
      </div>
    )
  }
  if (loading || !c) return <Loading />

  const title = pick(c.title)
  return (
    <div className="space-y-6">
      <Link href="/campaigns" className="text-sm text-emerald-800 hover:underline">{t('backToList')}</Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <CampaignImage src={c.image} alt={title} className="aspect-[16/9] rounded-xl" />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>📍 {c.region}</span>
              <Badge status={c.status} />
            </div>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{title}</h1>
          </div>
          <section aria-labelledby="story">
            <h2 id="story" className="text-lg font-semibold">{t('story')}</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-700">{pick(c.content)}</p>
          </section>

          <section aria-labelledby="updates" className="space-y-3">
            <h2 id="updates" className="text-lg font-semibold">{t('updates')}</h2>
            {!c.disbursements.length ? (
              <Empty>{t('noUpdates')}</Empty>
            ) : (
              c.disbursements.map((d) => (
                <Card key={d.id} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge status={d.status} />
                    <span className="font-semibold text-emerald-800">{f.vnd(d.amountVnd)}</span>
                  </div>
                  <DisbursementSteps d={d} />
                </Card>
              ))
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-emerald-800">{f.vnd(c.receivedVnd)}</div>
              <div className="text-sm text-slate-500">{t('target')}: {f.vnd(c.targetVnd)} · {t('donors', { n: c.donationCount })}</div>
            </div>
            <Progress value={c.receivedVnd} max={c.targetVnd} label={t('progressLabel')} />
            <dl className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
              <div><dt className="text-slate-500">{t('paidOut')}</dt><dd className="font-semibold">{f.vnd(c.paidVnd)}</dd></div>
              <div><dt className="text-slate-500">{t('available')}</dt><dd className="font-semibold">{f.vnd(c.availableVnd)}</dd></div>
            </dl>
          </Card>
          {c.status === 'CLOSED' && <Notice kind="info">{t('closedNotice')}</Notice>}
          <DonateForm campaignId={c.id} campaignTitle={title} open={c.status === 'PUBLISHED'} />
          <Card>
            <h2 className="font-semibold">{t('recentDonations')}</h2>
            {!c.recentDonations.length ? (
              <p className="mt-2 text-sm text-slate-500">{t('noDonations')}</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 text-sm">
                {c.recentDonations.map((d, i) => (
                  <li key={i} className="flex justify-between gap-2 py-1.5">
                    <span className="text-slate-500">{f.date(d.createdAt)}</span>
                    <span className="font-medium">{f.vnd(d.amountVnd)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-slate-500">{t('donorsHidden')}</p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
