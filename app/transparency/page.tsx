'use client'
// K8: sổ minh bạch công khai, dùng /api/transparency (DTO allowlist trong reliefService).
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useApi } from '@/lib/useApi'
import { useBilingual, useFormat, useT } from '@/lib/i18n'
import { ledgerMsg } from '@/messages/transparency'
import DisbursementSteps from '@/components/DisbursementSteps'
import { Badge, Card, Empty, ErrorState, Loading, Notice, PageHeader, Progress, SimulatedTag, Stat, inputClass } from '@/components/ui'
import type { transparency } from '@/services/reliefService'

type Transparency = ReturnType<typeof transparency>

export default function TransparencyPage() {
  const t = useT(ledgerMsg)
  const pick = useBilingual()
  const f = useFormat()
  const { data, error, reload } = useApi<Transparency>('/api/transparency')
  const [campaignId, setCampaignId] = useState('')

  const titles = useMemo(() => new Map((data?.campaigns ?? []).map((c) => [c.id, c.title])), [data])
  const title = (id: string) => {
    const v = titles.get(id)
    return v ? pick(v) : id
  }

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return <Loading />

  const sum = (k: 'receivedVnd' | 'paidVnd' | 'availableVnd') => data.campaigns.reduce((s, c) => s + c[k], 0)
  const payouts = data.disbursements.filter((d) => !campaignId || d.campaignId === campaignId)
  const gifts = data.donations.filter((d) => !campaignId || d.campaignId === campaignId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="space-y-8">
      <PageHeader title={t('title')} subtitle={t('subtitle')} action={<SimulatedTag />} />

      <section className="space-y-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label={t('raised')} value={f.vnd(sum('receivedVnd'))} tone="text-emerald-800" />
          <Stat label={t('paid')} value={f.vnd(sum('paidVnd'))} />
          <Stat label={t('available')} value={f.vnd(sum('availableVnd'))} />
        </div>
        <p className="text-xs text-slate-500">{t('balanceRule')}</p>
      </section>

      <section aria-labelledby="by-campaign" className="space-y-3">
        <h2 id="by-campaign" className="text-lg font-semibold">{t('byCampaign')}</h2>
        {!data.campaigns.length ? (
          <Empty>—</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.campaigns.map((c) => (
              <Card key={c.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/campaigns/${c.id}`} className="font-semibold hover:text-emerald-800 hover:underline">{pick(c.title)}</Link>
                  <Badge status={c.status} />
                </div>
                <div className="text-xs text-slate-500">📍 {c.region}</div>
                <Progress value={c.receivedVnd} max={c.targetVnd} label={pick(c.title)} />
                <dl className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
                  <div><dt className="text-slate-500">{t('raised')}</dt><dd className="font-semibold">{f.vnd(c.receivedVnd)}</dd></div>
                  <div><dt className="text-slate-500">{t('paid')}</dt><dd className="font-semibold">{f.vnd(c.paidVnd)}</dd></div>
                  <div><dt className="text-slate-500">{t('available')}</dt><dd className="font-semibold">{f.vnd(c.availableVnd)}</dd></div>
                </dl>
              </Card>
            ))}
          </div>
        )}
      </section>

      <label className="block max-w-sm text-sm font-medium text-slate-700">
        {t('filter')}
        <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className={inputClass}>
          <option value="">{t('allCampaigns')}</option>
          {data.campaigns.map((c) => <option key={c.id} value={c.id}>{pick(c.title)}</option>)}
        </select>
      </label>

      <section aria-labelledby="payouts" className="space-y-3">
        <h2 id="payouts" className="text-lg font-semibold">{t('payouts')}</h2>
        <p className="text-sm text-slate-600">{t('payoutsHint')}</p>
        {!payouts.length ? (
          <Empty>{t('noPayouts')}</Empty>
        ) : (
          payouts.map((d) => (
            <Card key={d.id} className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="text-sm text-slate-600">{title(d.campaignId)}</div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-800">{f.vnd(d.amountVnd)}</div>
                  <Badge status={d.status} />
                </div>
              </div>
              <DisbursementSteps d={d} />
            </Card>
          ))
        )}
      </section>

      <section aria-labelledby="gifts" className="space-y-3">
        <h2 id="gifts" className="text-lg font-semibold">{t('donations')}</h2>
        <p className="text-sm text-slate-600">{t('donorsHidden')}</p>
        {!gifts.length ? (
          <Empty>{t('noDonations')}</Empty>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">{t('date')}</th>
                  <th className="px-4 py-2">{t('campaign')}</th>
                  <th className="px-4 py-2 text-right">{t('amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gifts.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2 whitespace-nowrap">{f.dateTime(d.createdAt)}</td>
                    <td className="px-4 py-2">{title(d.campaignId)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{f.vnd(d.amountVnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <Notice kind="info">{t('limits')}</Notice>
    </div>
  )
}
