'use client'
// K7: chọn số tiền → màn hình xác nhận (ghi rõ mô phỏng) → POST /api/donations → biên lai.
// idempotencyKey tạo một lần cho mỗi lần xác nhận: bấm nhiều lần hay gửi lại sau lỗi mạng vẫn chỉ ra một biên lai.
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTide, MOCK } from '@/lib/tide'
import { useApiCall } from '@/lib/useApi'
import { useApiErrorText } from '@/lib/apiError'
import { useFormat, useT } from '@/lib/i18n'
import { donationMsg } from '@/messages/donations'
import { common } from '@/messages/common'
import type { DonationReceipt } from '@/services/publicService'
type DonationResult = { donation: DonationReceipt; replayed: boolean }
import { Button, Card, Notice, SimulatedTag, inputClass } from './ui'

const PRESETS = [100_000, 200_000, 500_000, 1_000_000]
const MIN = 10_000
const MAX = 10_000_000_000

export const RECEIPT_FLASH_KEY = 'relief-receipt-flash'

function newKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function DonateForm({ campaignId, campaignTitle, open }: { campaignId: string; campaignTitle: string; open: boolean }) {
  const t = useT(donationMsg)
  const tc = useT(common)
  const f = useFormat()
  const { user, ready, hasRole, login } = useTide()
  const call = useApiCall()
  const errorText = useApiErrorText()
  const router = useRouter()

  const [preset, setPreset] = useState<number | null>(200_000)
  const [custom, setCustom] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [step, setStep] = useState<'pick' | 'confirm'>('pick')
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const amount = preset ?? Number(custom.replace(/[.,\s]/g, ''))
  const valid = Number.isSafeInteger(amount) && amount >= MIN && amount <= MAX

  if (!open) return <Notice kind="warn">{t('closed')}</Notice>
  if (!ready) return null
  if (!user)
    return (
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">{t('donateTitle')}</h2>
        <p className="text-sm text-slate-600">{t('signInToDonate')}</p>
        {MOCK ? <Notice>{tc('signInNeededMock')}</Notice> : <Button onClick={login}>{tc('login')}</Button>}
      </Card>
    )
  if (!hasRole('appUser')) return <Notice kind="warn">{t('staffCannotDonate')}</Notice>

  function toConfirm() {
    setError('')
    if (!valid) return setError(t('invalidAmount', { min: f.vnd(MIN) }))
    setKey(newKey()) // một key cho đúng một lần xác nhận này
    setStep('confirm')
  }

  async function submit() {
    setBusy(true)
    setError('')
    try {
      const result = await call<DonationResult>('/api/donations', { campaignId, amountVnd: amount, anonymous, idempotencyKey: key })
      try {
        sessionStorage.setItem(RECEIPT_FLASH_KEY, JSON.stringify({ id: result.donation.id, replayed: result.replayed }))
      } catch {}
      router.push(`/donations/${result.donation.id}`)
    } catch (e) {
      // Giữ nguyên key: bấm lại sau lỗi mạng sẽ không tạo khoản thứ hai.
      setError(errorText(e))
      setBusy(false)
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{step === 'pick' ? t('donateTitle') : t('confirmTitle')}</h2>
        <SimulatedTag />
      </div>
      <Notice kind="warn">{t('simulatedNote')}</Notice>

      {step === 'pick' ? (
        <>
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">{t('amount')}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={preset === p}
                  onClick={() => setPreset(p)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${preset === p ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
                >
                  {f.vnd(p)}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-sm text-slate-700">
              {t('customAmount')}
              <input
                inputMode="numeric"
                value={custom}
                onFocus={() => setPreset(null)}
                onChange={(e) => {
                  setPreset(null)
                  setCustom(e.target.value)
                }}
                placeholder="250000"
                className={inputClass}
                aria-describedby="min-hint"
              />
              <span id="min-hint" className="mt-1 block text-xs text-slate-500">{t('minAmount', { min: f.vnd(MIN) })}</span>
            </label>
          </fieldset>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-700" />
            <span>
              {t('anonymous')}
              <span className="block text-xs text-slate-500">{t('anonymousHint')}</span>
            </span>
          </label>
          {error && <Notice kind="error">{error}</Notice>}
          <Button size="lg" className="w-full" onClick={toConfirm}>{t('continue')}</Button>
        </>
      ) : (
        <>
          <p className="text-slate-800">{t('confirmLine', { amount: f.vnd(amount), campaign: campaignTitle })}</p>
          <p className="text-sm text-slate-600">{t('publicName', { name: anonymous ? t('shownAnonymous') : user.name })}</p>
          {error && <Notice kind="error">{error}</Notice>}
          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={submit} disabled={busy} className="flex-1">{busy ? t('sending') : t('confirm')}</Button>
            <Button size="lg" variant="ghost" onClick={() => setStep('pick')} disabled={busy}>{t('edit')}</Button>
          </div>
        </>
      )}
    </Card>
  )
}
