'use client'
// K7: biên lai mô phỏng của chính người ủng hộ.
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useApi } from '@/lib/useApi'
import { useBilingual, useFormat, useT } from '@/lib/i18n'
import { donationMsg } from '@/messages/donations'
import RequireResident from '@/components/RequireResident'
import { RECEIPT_FLASH_KEY } from '@/components/DonateForm'
import { Button, ButtonLink, Card, Empty, ErrorState, Loading, Notice, SimulatedTag } from '@/components/ui'
import type { DonationReceipt } from '@/services/publicService'
import { useTide } from '@/lib/tide'

export default function ReceiptPage() {
  return (
    <RequireResident>
      <Receipt />
    </RequireResident>
  )
}

function Receipt() {
  const { id } = useParams<{ id: string }>()
  const t = useT(donationMsg)
  const pick = useBilingual()
  const f = useFormat()
  const { data: r, error, reload } = useApi<DonationReceipt>(`/api/donations/${encodeURIComponent(id)}`)
  const { user } = useTide()
  const [flash, setFlash] = useState<null | { replayed: boolean }>(null)

  // Thông báo "cảm ơn" chỉ hiện một lần ngay sau khi ủng hộ.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RECEIPT_FLASH_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      if (parsed?.id === id) {
        setFlash({ replayed: !!parsed.replayed })
        sessionStorage.removeItem(RECEIPT_FLASH_KEY)
      }
    } catch {}
  }, [id])

  if (error)
    return error.status === 404 ? <Empty action={<ButtonLink href="/donations" variant="ghost">{t('viewHistory')}</ButtonLink>}>{t('receiptNotFound')}</Empty> : <ErrorState error={error} onRetry={reload} />
  if (!r) return <Loading />

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {flash && <Notice kind={flash.replayed ? 'info' : 'success'}>{flash.replayed ? t('replayed') : t('thankYou')}</Notice>}
      <Card className="space-y-4 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between gap-2 border-b border-dashed border-slate-300 pb-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">ReliefCloak</div>
            <h1 className="text-xl font-bold">{t('receiptTitle')}</h1>
          </div>
          <SimulatedTag />
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-emerald-800">{f.vnd(r.amountVnd)}</div>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">{t('receiptCode')}</dt>
          <dd className="font-mono font-semibold">{r.receipt}</dd>
          <dt className="text-slate-500">{t('campaign')}</dt>
          <dd><Link href={`/campaigns/${r.campaignId}`} className="text-emerald-800 hover:underline">{pick(r.campaignTitle)}</Link></dd>
          <dt className="text-slate-500">{t('date')}</dt>
          <dd>{f.dateTime(r.createdAt)}</dd>
          <dt className="text-slate-500">{t('donor')}</dt>
          <dd>{user?.name}</dd>
          <dt className="text-slate-500">{t('visibility')}</dt>
          <dd>{r.anonymous ? t('shownAnonymous') : t('shownName')}</dd>
        </dl>
        <p className="border-t border-dashed border-slate-300 pt-3 text-xs text-slate-500">{t('receiptDisclaimer')}</p>
      </Card>
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button variant="ghost" onClick={() => window.print()}>{t('print')}</Button>
        <ButtonLink href="/donations" variant="ghost" size="sm">{t('viewHistory')}</ButtonLink>
        <ButtonLink href={`/campaigns/${r.campaignId}`} variant="ghost" size="sm">{t('viewCampaign')}</ButtonLink>
      </div>
    </div>
  )
}
