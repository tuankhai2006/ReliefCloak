'use client'
// K4: danh sách chiến dịch công khai, tìm kiếm + lọc khu vực/trạng thái.
import { useMemo, useState } from 'react'
import { useApi } from '@/lib/useApi'
import { useBilingual, useT } from '@/lib/i18n'
import { campaignMsg } from '@/messages/campaigns'
import { common } from '@/messages/common'
import CampaignCard from '@/components/CampaignCard'
import { Button, Empty, ErrorState, Loading, PageHeader, inputClass } from '@/components/ui'
import type { PublicCampaign } from '@/services/publicService'

export default function CampaignsPage() {
  const t = useT(campaignMsg)
  const tc = useT(common)
  const pick = useBilingual()
  const { data, error, reload } = useApi<PublicCampaign[]>('/api/campaigns')
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('')
  const [status, setStatus] = useState('')

  const regions = useMemo(() => [...new Set((data ?? []).map((c) => c.region))].sort(), [data])
  const q = query.trim().toLowerCase()
  const shown = (data ?? []).filter(
    (c) =>
      (!region || c.region === region) &&
      (!status || c.status === status) &&
      (!q || [c.title.vi, c.title.en, c.region, pick(c.content)].some((s) => s.toLowerCase().includes(q))),
  )
  const clear = () => {
    setQuery('')
    setRegion('')
    setStatus('')
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('listTitle')} subtitle={t('listSubtitle')} />
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="text-sm">
          <span className="sr-only">{t('search')}</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('search')} className={inputClass + ' mt-0'} />
        </label>
        <label className="text-sm">
          <span className="sr-only">{t('region')}</span>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass + ' mt-0'}>
            <option value="">{t('allRegions')}</option>
            {regions.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="sr-only">{t('status')}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass + ' mt-0'}>
            <option value="">{t('allStatuses')}</option>
            <option value="PUBLISHED">{tc('PUBLISHED')}</option>
            <option value="CLOSED">{tc('CLOSED')}</option>
          </select>
        </label>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <Loading />
      ) : !data.length ? (
        <Empty>{t('noCampaigns')}</Empty>
      ) : !shown.length ? (
        <Empty action={<Button variant="ghost" onClick={clear}>{t('clearFilters')}</Button>}>{t('noMatch')}</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => <CampaignCard key={c.id} campaign={c} />)}
        </div>
      )}
    </div>
  )
}
