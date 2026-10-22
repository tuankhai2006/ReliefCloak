'use client'
// K5: người dân gửi report riêng tư (khu vực, nhu cầu, mức khẩn cấp, mô tả, ảnh minh họa) và theo dõi trạng thái.
// Admin duyệt report ở /admin/reports; trang này chỉ hiện report của chính người đăng nhập.
import { useState, type FormEvent } from 'react'
import { useTide } from '@/lib/tide'
import { useApi, useApiCall } from '@/lib/useApi'
import { useApiErrorText } from '@/lib/apiError'
import { useT } from '@/lib/i18n'
import { reportMsg } from '@/messages/reports'
import { common } from '@/messages/common'
import type { CommunityReport } from '@/models/community'
import { NEEDS, PUBLIC_IMAGES, URGENCIES, type Need } from '@/models/publicImages'
import RequireResident from '@/components/RequireResident'
import ReportItem from '@/components/ReportItem'
import { Button, Card, Empty, ErrorState, Field, Loading, Notice, PageHeader, inputClass } from '@/components/ui'

export default function ReportsPage() {
  const t = useT(reportMsg)
  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <RequireResident>
        <ResidentReports />
      </RequireResident>
    </div>
  )
}

function ResidentReports() {
  const t = useT(reportMsg)
  const tc = useT(common)
  const { user } = useTide()
  const call = useApiCall()
  const errorText = useApiErrorText()
  const { data, error, reload } = useApi<CommunityReport[]>('/api/reports')
  const mine = (data ?? []).filter((r) => r.createdBy === user?.id)

  const [region, setRegion] = useState('')
  const [description, setDescription] = useState('')
  const [needs, setNeeds] = useState<Need[]>([])
  const [urgency, setUrgency] = useState<(typeof URGENCIES)[number]>('STANDARD')
  const [image, setImage] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  const toggleNeed = (n: Need) => setNeeds(needs.includes(n) ? needs.filter((x) => x !== n) : [...needs, n])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!region.trim() || region.trim().length > 160) return setMessage({ kind: 'error', text: t('regionRequired') })
    if (!description.trim() || description.trim().length > 3000) return setMessage({ kind: 'error', text: t('descriptionRequired') })
    setBusy(true)
    try {
      await call('/api/reports', { region, description, needs, urgency, ...(image ? { image } : {}) })
      setRegion('')
      setDescription('')
      setNeeds([])
      setUrgency('STANDARD')
      setImage('')
      setMessage({ kind: 'success', text: t('sent') })
      reload()
    } catch (err) {
      setMessage({ kind: 'error', text: errorText(err) })
    } finally {
      setBusy(false)
    }
  }

  const chip = 'cursor-pointer rounded-full border px-3 py-1 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500'
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <h2 className="text-lg font-semibold">{t('formTitle')}</h2>
          <Notice kind="warn">{t('privacyWarn')}</Notice>
          <Field label={t('region')}>
            <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder={t('regionPh')} maxLength={160} required className={inputClass} />
          </Field>
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">{t('needs')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {NEEDS.map((n) => (
                <label key={n} className={`${chip} ${needs.includes(n) ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white text-slate-700'}`}>
                  <input type="checkbox" className="sr-only" checked={needs.includes(n)} onChange={() => toggleNeed(n)} />
                  {tc(n)}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">{t('urgency')}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {URGENCIES.map((u) => (
                <label key={u} className={`cursor-pointer rounded-lg border px-2 py-1.5 text-center text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 ${urgency === u ? (u === 'URGENT' ? 'border-orange-600 bg-orange-50 text-orange-900' : 'border-emerald-700 bg-emerald-50 text-emerald-900') : 'border-slate-300 bg-white'}`}>
                  <input type="radio" name="urgency" className="sr-only" checked={urgency === u} onChange={() => setUrgency(u)} />
                  {tc(u)}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label={t('description')} hint={t('descriptionHint')}>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('descriptionPh')} maxLength={3000} rows={5} required className={inputClass} />
          </Field>
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">{t('image')}</legend>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              <label className={`grid cursor-pointer place-items-center rounded-lg border text-xs has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 ${!image ? 'border-emerald-700 bg-emerald-50' : 'border-slate-300 bg-white'}`}>
                <input type="radio" name="image" className="sr-only" checked={!image} onChange={() => setImage('')} />
                {t('noImage')}
              </label>
              {PUBLIC_IMAGES.map((src) => (
                <label key={src} className={`cursor-pointer overflow-hidden rounded-lg border-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 ${image === src ? 'border-emerald-700' : 'border-transparent'}`}>
                  <input type="radio" name="image" className="sr-only" checked={image === src} onChange={() => setImage(src)} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${tc('illustrative')}: ${src.split('/').pop()}`} className="aspect-[4/3] w-full object-cover" />
                </label>
              ))}
            </div>
          </fieldset>
          {message && <Notice kind={message.kind}>{message.text}</Notice>}
          <Button type="submit" size="lg" variant="urgent" disabled={busy} className="w-full">{busy ? t('sending') : t('submit')}</Button>
        </form>
      </Card>

      <section aria-labelledby="mine" className="space-y-3">
        <h2 id="mine" className="text-lg font-semibold">{t('myReports')}</h2>
        {error ? <ErrorState error={error} onRetry={reload} /> : !data ? <Loading /> : !mine.length ? <Empty>{t('noReports')}</Empty> : mine.map((r) => <ReportItem key={r.id} report={r} />)}
      </section>
    </div>
  )
}
