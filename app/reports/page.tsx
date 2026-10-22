'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { useTide } from '@/lib/tide'
import type { CommunityReport } from '@/models/community'

export default function ReportsPage() {
  const { user, authFetch, hasRole } = useTide()
  const [reports, setReports] = useState<CommunityReport[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const admin = hasRole('org_admin')
  useEffect(() => {
    let active = true
    setReports([])
    if (user) authFetch('/api/reports').then(async r => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      if (active) setReports(data)
    }).catch(e => { if (active) setMessage(e.message) })
    return () => { active = false }
  }, [user?.id])

  async function submit(event: FormEvent<HTMLFormElement>, reportId?: string) {
    event.preventDefault()
    const form = event.currentTarget
    const body = Object.fromEntries(new FormData(form))
    setBusy(true); setMessage('')
    try {
      const response = await authFetch(reportId ? '/api/posts' : '/api/reports', {
        method: 'POST', body: JSON.stringify({ ...body, ...(reportId ? { reportId } : {}) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      if (!reportId) setReports(previous => [data, ...previous])
      form.reset()
      setMessage(reportId ? 'Đã đăng bài lên bảng tin.' : 'Đã gửi report riêng tư cho admin.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Không gửi được. Hãy thử lại.') }
    finally { setBusy(false) }
  }
  if (!user) return <p>Đăng nhập để gửi report hoặc xem report của bạn.</p>
  return <div className="space-y-6">
    <h1 className="text-2xl font-bold">{admin ? 'Tiếp nhận report & đăng bài' : 'Báo cáo tình hình cứu trợ'}</h1>
    <p className="text-slate-600">Report chỉ hiển thị cho người gửi và admin. Chỉ admin được viết bài công khai. Dùng dữ liệu giả; không nhập CCCD hoặc tài khoản ngân hàng vào đây.</p>
    <form onSubmit={e => submit(e)} className="space-y-3 rounded-lg border bg-white p-4">
      <label className="block">Khu vực<input name="region" required maxLength={160} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="block">Tình hình và nhu cầu hỗ trợ<textarea name="description" required maxLength={3000} rows={4} className="mt-1 block w-full rounded border p-2" /></label>
      <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Gửi report</button>
    </form>
    <p role="status">{message}</p>
    <h2 className="text-xl font-semibold">{admin ? 'Report đã tiếp nhận' : 'Report của bạn'}</h2>
    {!reports.length && <p>Chưa có report.</p>}
    {reports.map(report => <article key={report.id} className="space-y-3 rounded-lg border bg-white p-4">
      <h3 className="font-semibold">{report.region}</h3>
      <p className="whitespace-pre-wrap">{report.description}</p>
      <p className="text-sm text-slate-500">{new Date(report.createdAt).toLocaleString('vi-VN')}</p>
      {admin && <form onSubmit={e => submit(e, report.id)} className="space-y-3 border-t pt-3">
        <p className="text-sm">Biên tập nội dung đã kiểm tra trước khi đăng; không đưa thông tin riêng tư của người báo cáo vào bài.</p>
        <label className="block">Tiêu đề bài đăng<input name="title" required maxLength={160} className="block w-full rounded border p-2" /></label>
        <label className="block">Nội dung công khai<textarea name="content" required maxLength={5000} rows={3} className="block w-full rounded border p-2" /></label>
        <button disabled={busy} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">Đăng bài công khai</button>
      </form>}
    </article>)}
  </div>
}
