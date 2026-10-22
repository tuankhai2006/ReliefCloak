'use client'
// K3: trang chủ công khai. Số liệu lấy từ /api/transparency và /api/campaigns (tính từ bản ghi).
import Link from 'next/link'
import { useApi } from '@/lib/useApi'
import { useFormat, useT } from '@/lib/i18n'
import { homeMsg } from '@/messages/home'
import CampaignCard from '@/components/CampaignCard'
import { ButtonLink, Card, ErrorState, Loading } from '@/components/ui'
import type { PublicCampaign } from '@/services/publicService'
import type { transparency } from '@/services/reliefService'
type Transparency = ReturnType<typeof transparency>

export default function HomePage() {
  const t = useT(homeMsg)
  const f = useFormat()
  const ledger = useApi<Transparency>('/api/transparency')
  const campaigns = useApi<PublicCampaign[]>('/api/campaigns')
  const featured = (campaigns.data ?? []).filter((c) => c.status === 'PUBLISHED').slice(0, 3)

  return (
    <div className="space-y-12">
      <section className="relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photos/hero.svg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative bg-gradient-to-r from-white via-white/90 to-white/20 px-6 py-12 sm:px-10 sm:py-16">
          <div className="max-w-xl">
            <h1 className="text-3xl font-bold leading-tight text-emerald-900 sm:text-4xl">{t('heroTitle')}</h1>
            <p className="mt-4 text-slate-700">{t('heroText')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/campaigns" size="lg">{t('ctaDonate')}</ButtonLink>
              <ButtonLink href="/reports" size="lg" variant="urgent">{t('ctaReport')}</ButtonLink>
              <ButtonLink href="/transparency" size="lg" variant="ghost">{t('ctaLedger')}</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="metrics">
        <h2 id="metrics" className="sr-only">{t('metricsTitle')}</h2>
        {ledger.error ? (
          <ErrorState error={ledger.error} onRetry={ledger.reload} />
        ) : !ledger.data ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label={t('raised')} value={f.vnd(ledger.data.campaigns.reduce((s, c) => s + c.receivedVnd, 0))} />
            <Metric label={t('paid')} value={f.vnd(ledger.data.campaigns.reduce((s, c) => s + c.paidVnd, 0))} />
            <Metric label={t('campaigns')} value={f.number(ledger.data.campaigns.length)} />
            <Metric label={t('donations')} value={f.number(ledger.data.donations.length)} />
          </div>
        )}
      </section>

      <section aria-labelledby="featured" className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 id="featured" className="text-xl font-bold">{t('featured')}</h2>
          <Link href="/campaigns" className="text-sm font-medium text-emerald-800 hover:underline">{t('seeAll')}</Link>
        </div>
        {campaigns.error ? (
          <ErrorState error={campaigns.error} onRetry={campaigns.reload} />
        ) : !campaigns.data ? (
          <Loading />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => <CampaignCard key={c.id} campaign={c} />)}
          </div>
        )}
      </section>

      <section aria-labelledby="how" className="space-y-4">
        <h2 id="how" className="text-xl font-bold">{t('howTitle')}</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(['1', '2', '3', '4'] as const).map((n) => (
            <li key={n}>
              <Card className="h-full">
                <div className="font-semibold text-emerald-800">{t(`how${n}t`)}</div>
                <p className="mt-1 text-sm text-slate-600">{t(`how${n}`)}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-bold text-emerald-900">{t('trustTitle')}</h2>
        <p className="mt-2 max-w-3xl text-sm text-emerald-900">{t('trustText')}</p>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-emerald-800 sm:text-2xl">{value}</div>
    </Card>
  )
}
