'use client'
// Simulated TideCloak IGA panel (mirrors the Tide "iga-admin-governance" scenario).
// Role changes are change requests; they commit only at quorum. Authorization is enforced by the API.
import { useState } from 'react'
import { useTide } from '@/lib/tide'
import { useApi, useApiCall, ApiError } from '@/lib/useApi'
import { useFormat, useT } from '@/lib/i18n'
import { govMsg } from '@/messages/governance'
import { Badge, Button, Card, Empty, ErrorState, Field, Loading, Notice, PageHeader, inputClass } from '@/components/ui'

interface Account { id: string; name: string; username: string; roles: string[] }
interface ChangeRequest {
  id: string; actionType: 'GRANT_ROLES' | 'REVOKE_ROLES'; userId: string; role: string
  requestedByName: string; requestedAt: string; approvals: { adminId: string; adminName: string; at: string }[]
  threshold: number; status: 'PENDING' | 'APPROVED' | 'DENIED'; decidedAt: string | null
}
interface Snapshot { admins: number; threshold: number; accounts: Account[]; changeRequests: ChangeRequest[] }

const ROLES = ['appUser', 'org_admin', 'auditor', 'disburser', 'tide-realm-admin']
const TONE = { PENDING: 'amber', APPROVED: 'green', DENIED: 'red' } as const

export default function GovernancePage() {
  const t = useT(govMsg)
  const f = useFormat()
  const { user, hasRole } = useTide()
  const call = useApiCall()
  const { data, error, reload } = useApi<Snapshot>(user ? '/api/sim-tide/governance' : null)
  const [form, setForm] = useState({ userId: '', role: 'disburser', action: 'grant' })
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const explain = (e: unknown) => {
    const code = e instanceof ApiError ? e.code ?? e.message : ''
    return code in govMsg ? t(code as keyof typeof govMsg) : code || 'Error'
  }
  async function run(fn: () => Promise<unknown>, ok?: string) {
    setBusy(true)
    setMessage(null)
    try {
      await fn()
      if (ok) setMessage({ kind: 'success', text: ok })
      await reload()
    } catch (e) {
      setMessage({ kind: 'error', text: explain(e) })
    } finally {
      setBusy(false)
    }
  }

  if (!user || !hasRole('tide-realm-admin')) return <Notice kind="warn">{t('notAdmin')}</Notice>
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return <Loading />

  const name = (id: string) => data.accounts.find((a) => a.id === id)?.name ?? id
  const pending = data.changeRequests.filter((c) => c.status === 'PENDING')
  const decided = data.changeRequests.filter((c) => c.status !== 'PENDING')

  const row = (c: ChangeRequest) => (
    <Card key={c.id} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={c.actionType === 'GRANT_ROLES' ? 'blue' : 'gray'}>{t(c.actionType)}</Badge>
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{c.role}</code>
        <span className="text-sm">→ <b>{name(c.userId)}</b></span>
        <span className="ml-auto"><Badge tone={TONE[c.status]}>{t(c.status)}</Badge></span>
      </div>
      <div className="text-xs text-slate-500">{t('requestedBy', { name: c.requestedByName })} · {f.dateTime(c.requestedAt)}</div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{t('approvals', { a: c.approvals.length, t: c.threshold })}</span>
        {c.approvals.map((a) => <Badge key={a.adminId} tone="green">✓ {a.adminName}</Badge>)}
      </div>
      {c.status === 'PENDING' && (
        <div className="flex gap-2">
          <Button disabled={busy || c.approvals.some((a) => a.adminId === user.id)} onClick={() => run(() => call(`/api/sim-tide/change-requests/${c.id}`, { decision: 'approve' }))}>{t('approve')}</Button>
          <Button variant="danger" disabled={busy} onClick={() => run(() => call(`/api/sim-tide/change-requests/${c.id}`, { decision: 'deny' }))}>{t('deny')}</Button>
        </div>
      )}
    </Card>
  )

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <Notice kind="info">{t('simNote')}</Notice>
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="blue">{t('quorum', { t: data.threshold, n: data.admins })}</Badge>
        <span className="text-xs text-slate-500">{t('quorumRule')}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              run(() => call('/api/sim-tide/governance', form), t('PENDING'))
            }}
          >
            <h2 className="text-lg font-semibold">{t('newRequest')}</h2>
            <Field label={t('user')}>
              <select required className={inputClass} value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="">—</option>
                {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('action')}>
                <select className={inputClass} value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
                  <option value="grant">{t('grant')}</option>
                  <option value="revoke">{t('revoke')}</option>
                </select>
              </Field>
              <Field label={t('role')}>
                <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
            </div>
            {message && <Notice kind={message.kind}>{message.text}</Notice>}
            <Button type="submit" disabled={busy} className="w-full">{t('submit')}</Button>
          </form>
          <h3 className="mt-6 text-sm font-semibold">{t('accounts')}</h3>
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {data.accounts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-1 py-1.5">
                <span className="mr-1 font-medium">{a.name}</span>
                {a.roles.length ? a.roles.map((r) => <code key={r} className="rounded bg-slate-100 px-1 text-xs">{r}</code>) : <span className="text-xs text-slate-400">—</span>}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">{t('refreshHint')}</p>
        </Card>

        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t('pending')}</h2>
            {pending.length ? pending.map(row) : <Empty>{t('none')}</Empty>}
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t('history')}</h2>
            {decided.length ? decided.map(row) : <Empty>{t('none')}</Empty>}
          </section>
        </div>
      </div>
    </div>
  )
}
