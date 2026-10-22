'use client'
import Link from 'next/link'
import { useBilingual, useFormat, useT } from '@/lib/i18n'
import { campaignMsg } from '@/messages/campaigns'
import { common } from '@/messages/common'
import type { PublicCampaign } from '@/services/publicService'
import { Badge, Progress } from './ui'

export function CampaignImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const t = useT(common)
  return (
    <div className={`relative overflow-hidden bg-emerald-50 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      <span className="absolute bottom-2 left-2 rounded bg-white/85 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{t('illustrative')}</span>
    </div>
  )
}

export default function CampaignCard({ campaign }: { campaign: PublicCampaign }) {
  const t = useT(campaignMsg)
  const pick = useBilingual()
  const f = useFormat()
  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <CampaignImage src={campaign.image} alt="" className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>📍 {campaign.region}</span>
          <span className="ml-auto">
            <Badge status={campaign.status} />
          </span>
        </div>
        <h3 className="font-semibold text-slate-900 group-hover:text-emerald-800">{pick(campaign.title)}</h3>
        <p className="line-clamp-2 text-sm text-slate-600">{pick(campaign.content)}</p>
        <div className="mt-auto pt-2">
          <Progress value={campaign.receivedVnd} max={campaign.targetVnd} label={t('progressLabel')} />
          <div className="mt-1 flex justify-between text-sm">
            <span className="font-semibold text-emerald-800">{f.vnd(campaign.receivedVnd)}</span>
            <span className="text-slate-500">
              {t('target')}: {f.vnd(campaign.targetVnd)}
            </span>
          </div>
          <div className="text-xs text-slate-500">{t('donors', { n: campaign.donationCount })}</div>
        </div>
      </div>
    </Link>
  )
}
