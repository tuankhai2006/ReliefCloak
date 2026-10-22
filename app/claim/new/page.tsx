'use client'
// ① Field Worker tạo claim. STK/CCCD được mã hóa TRƯỚC khi rời trình duyệt.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTide } from '@/lib/tide'
import RequireRole from '@/components/RequireRole'

const PHOTOS = ['/photos/flood-1.svg', '/photos/flood-2.svg']

export default function NewClaimPage() {
  const { encryptField, authFetch } = useTide()
  const router = useRouter()
  const [form, setForm] = useState({
    victimName: '',
    region: 'Phong Điền, Huế',
    amount: 5000000,
    gps: '16.5541, 107.3536',
    photoUrl: PHOTOS[0],
    description: '',
    bankAccount: '',
    nationalId: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: k === 'amount' ? Number(e.target.value) : e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { bankAccount, nationalId, ...rest } = form
      const [encryptedBankAccount, encryptedNationalId] = await Promise.all([
        encryptField(bankAccount),
        encryptField(nationalId),
      ])
      const res = await authFetch('/api/claims', {
        method: 'POST',
        body: JSON.stringify({ ...rest, encryptedBankAccount, encryptedNationalId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      router.push('/claims')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full rounded border px-3 py-2'
  return (
    <RequireRole roles={['field_worker']}>
      <h1 className="mb-4 text-2xl font-bold">Tạo claim cứu trợ</h1>
      <form onSubmit={submit} className="grid max-w-xl gap-3">
        <input className={input} placeholder="Tên nạn nhân" value={form.victimName} onChange={set('victimName')} required />
        <input className={input} placeholder="Vùng" value={form.region} onChange={set('region')} required />
        <input className={input} type="number" placeholder="Số tiền (VND)" value={form.amount} onChange={set('amount')} required />
        <input className={input} placeholder="GPS" value={form.gps} onChange={set('gps')} />
        <select className={input} value={form.photoUrl} onChange={set('photoUrl')}>
          {PHOTOS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <textarea className={input} placeholder="Mô tả thiệt hại" value={form.description} onChange={set('description')} />
        <fieldset className="rounded border border-blue-300 bg-blue-50 p-3">
          <legend className="px-1 text-sm font-medium">🔒 Sẽ được mã hóa bằng TideCloak trên trình duyệt</legend>
          <input className={input + ' mb-2 bg-white'} placeholder="Số tài khoản + ngân hàng" value={form.bankAccount} onChange={set('bankAccount')} required />
          <input className={input + ' bg-white'} placeholder="CCCD" value={form.nationalId} onChange={set('nationalId')} required />
        </fieldset>
        <button disabled={busy} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
          {busy ? 'Đang mã hóa & gửi…' : 'Mã hóa & gửi claim'}
        </button>
        {error && <p className="text-red-600">❌ {error}</p>}
      </form>
    </RequireRole>
  )
}
