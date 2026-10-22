'use client'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useTide, MOCK } from '@/lib/tide'
import type { Campaign, Disbursement } from '@/models/relief'
import type { adminSnapshot } from '@/services/reliefService'
import styles from './admin.module.css'

type Snapshot = ReturnType<typeof adminSnapshot>
type Language = 'vi' | 'en'
const labels: Record<string, [string, string]> = {
  overview: ['Tổng quan', 'Overview'], reports: ['Tiếp nhận report', 'Report inbox'], campaigns: ['Chiến dịch', 'Campaigns'],
  disbursements: ['Giải ngân', 'Disbursements'], audit: ['Nhật ký hoạt động', 'Activity log'],
  NEW: ['Mới tiếp nhận', 'New'], VERIFYING: ['Đang xác minh', 'Verifying'], ACCEPTED: ['Đã chấp nhận', 'Accepted'], REJECTED: ['Từ chối', 'Rejected'],
  DRAFT: ['Bản nháp', 'Draft'], PUBLISHED: ['Đang công khai', 'Published'], CLOSED: ['Đã đóng', 'Closed'],
  PENDING_AUDIT: ['Chờ kiểm toán', 'Awaiting audit'], APPROVED: ['Đã duyệt', 'Approved'], PAID_SIMULATED: ['Đã chi mô phỏng', 'Simulated payout'],
  FORBIDDEN: ['Bạn không có quyền thực hiện thao tác này.', 'You do not have permission for this action.'],
  INVALID_TRANSITION: ['Hồ sơ đã thay đổi hoặc thao tác không hợp lệ. Hãy tải lại.', 'The record changed or this transition is invalid. Refresh the page.'],
  INDEPENDENT_ACTOR_REQUIRED: ['Phải dùng danh tính độc lập với những người xử lý trước.', 'An independent identity is required.'],
  INSUFFICIENT_FUNDS: ['Số dư chiến dịch không đủ để chi khoản này.', 'This campaign has insufficient available funds.'],
  CAMPAIGN_EXISTS: ['Report này đã có chiến dịch.', 'This report already has a campaign.'],
  REPORT_NOT_ACCEPTED: ['Report phải được chấp nhận trước khi tạo chiến dịch.', 'Accept the report before creating a campaign.'],
  STORE_BUSY: ['Dữ liệu đang được cập nhật. Hãy thử lại.', 'Another update is in progress. Please retry.'],
  IDEMPOTENCY_CONFLICT: ['Yêu cầu này đã được dùng với dữ liệu khác.', 'This request key was already used with different data.'],
  REPORT_NEW: ['Tiếp nhận report', 'Report received'], REPORT_VERIFYING: ['Bắt đầu xác minh', 'Verification started'],
  REPORT_ACCEPTED: ['Chấp nhận report', 'Report accepted'], REPORT_REJECTED: ['Từ chối report', 'Report rejected'],
  CAMPAIGN_CREATED: ['Tạo chiến dịch', 'Campaign created'], CAMPAIGN_SAVE: ['Lưu bản nháp', 'Draft saved'],
  CAMPAIGN_PUBLISH: ['Xuất bản chiến dịch', 'Campaign published'], CAMPAIGN_CLOSE: ['Đóng chiến dịch', 'Campaign closed'],
  PAYOUT_PROPOSED: ['Đề xuất giải ngân', 'Payout proposed'], PAYOUT_APPROVED: ['Phê duyệt giải ngân', 'Payout approved'],
  PAYOUT_REJECTED: ['Từ chối giải ngân', 'Payout rejected'], PAYOUT_SIMULATED: ['Thực hiện chi mô phỏng', 'Simulated payout executed'],
  DONATION_SIMULATED: ['Ghi nhận đóng góp mô phỏng', 'Simulated donation recorded'],
}
export default function AdminConsole({ view }: { view: string }) {
  const { user, ready, authFetch, login, hasRole, mockUsers, switchMockUser } = useTide()
  const [lang, setLang] = useState<Language>('vi')
  const [snapshot, setSnapshot] = useState<{ userId: string; value: Snapshot } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [editor, setEditor] = useState<Campaign | 'new' | null>(null)
  const [proposalOpen, setProposalOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const requestId = useRef(0)
  const activeIdentity = useRef(user?.id)
  activeIdentity.current = user?.id
  const t = (vi: string, en: string) => lang === 'vi' ? vi : en
  const label = (key: string) => labels[key]?.[lang === 'vi' ? 0 : 1] || key
  const money = (value: number) => new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
  const date = (value: string) => new Date(value).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' })
  const admin = hasRole('org_admin'), auditor = hasRole('auditor'), officer = hasRole('disburser')
  const allowed = admin || auditor || officer
  const data = snapshot?.userId === user?.id ? snapshot?.value : null
  useEffect(() => {
    try { if (localStorage.getItem('relief-language') === 'en') setLang('en') } catch {}
  }, [])
  function language(next: Language) { setLang(next); try { localStorage.setItem('relief-language', next) } catch {} }
  const load = useCallback(async () => {
    if (!user || !allowed) { setLoading(false); return }
    const id = ++requestId.current, identity = user.id
    setLoading(true)
    try {
      const response = await authFetch('/api/admin/dashboard', { cache: 'no-store' })
      const value = await response.json()
      if (!response.ok) throw new Error(value.error)
      if (id === requestId.current && activeIdentity.current === identity) setSnapshot({ userId: identity, value })
    } catch (e) { if (id === requestId.current && activeIdentity.current === identity) setError(e instanceof Error ? e.message : 'LOAD_FAILED') }
    finally { if (id === requestId.current && activeIdentity.current === identity) setLoading(false) }
  }, [user?.id, allowed, authFetch])
  // authFetch is supplied by the provider; reload only when the authenticated identity changes.
  useEffect(() => {
    setSnapshot(null); setError(''); setNotice(false); setEditor(null); setConfirmId(null); setProposalOpen(false)
    void load()
    return () => { requestId.current++ }
  }, [user?.id, allowed])
  useEffect(() => { setSearch(''); setFilter('ALL'); setError(''); setNotice(false); setEditor(null); setConfirmId(null) }, [view])
  async function mutate(resource: string, body: object, method = 'PATCH') {
    if (busy) return false
    const identity = user?.id
    setBusy(true); setError(''); setNotice(false)
    try {
      const response = await authFetch('/api/admin/' + resource, { method, body: JSON.stringify(body) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      if (activeIdentity.current !== identity) return false
      setNotice(true); await load(); return true
    } catch (e) { if (activeIdentity.current === identity) setError(e instanceof Error ? e.message : 'REQUEST_FAILED'); return false }
    finally { setBusy(false) }
  }
  function badge(status: string) { return <span className={styles.badge} data-status={status}>{label(status)}</span> }
  function empty(text?: string) { return <div className={styles.empty}>{text || t('Không có hồ sơ phù hợp.', 'No matching records.')}</div> }
  function filters(options: string[]) { return <div className={styles.toolbar} style={{ marginBottom: 16 }}>
    <input className={styles.input} style={{ flex: 1 }} aria-label={t('Tìm kiếm', 'Search')} placeholder={t('Tìm theo khu vực, tiêu đề…', 'Search region, title…')} value={search} onChange={e => setSearch(e.target.value)} />
    <select className={styles.input} style={{ width: 'auto' }} aria-label={t('Lọc trạng thái', 'Filter status')} value={filter} onChange={e => setFilter(e.target.value)}>
      <option value="ALL">{t('Tất cả trạng thái', 'All statuses')}</option>{options.map(o => <option key={o} value={o}>{label(o)}</option>)}
    </select>
  </div> }
  const matches = (status: string, text: string) => (filter === 'ALL' || status === filter) && text.toLocaleLowerCase().includes(search.toLocaleLowerCase())
  const campaignName = (id: string) => data?.campaigns.find(c => c.id === id)?.title[lang] || id
  const accepted = data?.reports.filter(r => r.status === 'ACCEPTED' && !data.campaigns.some(c => c.reportId === r.id)) || []
  const visibleReports = data?.reports.filter(r => matches(r.status, r.region + ' ' + r.description)) || []
  const visibleCampaigns = data?.campaigns.filter(c => matches(c.status, c.title[lang] + ' ' + c.region)) || []
  const visiblePayouts = data?.disbursements.filter(d => matches(d.status, campaignName(d.campaignId) + ' ' + d.purpose)) || []

  if (!ready) return <div className={styles.loading}>{t('Đang tải…', 'Loading…')}</div>
  if (!user || !allowed) return <div className={styles.formPanel}>
    <h2>{t('Khu vực vận hành cứu trợ', 'Relief operations workspace')}</h2>
    <p>{t('Đăng nhập bằng vai Admin, Kiểm toán hoặc Người giải ngân để tiếp tục.', 'Sign in as an organization admin, auditor, or disbursement officer.')}</p>
    {MOCK ? <div className={styles.toolbar} style={{ marginTop: 18 }}>{mockUsers?.filter(u => u.roles.some(r => ['org_admin', 'auditor', 'disburser'].includes(r))).map(u => <button key={u.id} className={styles.secondary} onClick={() => switchMockUser?.(u.id)}>{u.name}</button>)}</div> : <button className={styles.button} onClick={login}>{t('Đăng nhập', 'Sign in')}</button>}
    <p className={styles.small} style={{ marginTop: 15 }}>{t('Đây là môi trường demo. Không có giao dịch tiền thật.', 'This is a demo environment. No real money is transferred.')}</p>
  </div>

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <Link className={styles.brand} href="/admin"><span className={styles.mark}>R</span>ReliefCloak</Link>
      <div><p className={styles.eyebrow}>{t('Không gian vận hành', 'Operations workspace')}</p><nav className={styles.nav} style={{ marginTop: 14 }}>
        {['overview', ...(admin ? ['reports'] : []), 'campaigns', 'disbursements', 'audit'].map((item, index) => <Link key={item} href={item === 'overview' ? '/admin' : '/admin/' + item} aria-current={view === item ? 'page' : undefined}><span style={{ opacity: .55, marginRight: 9 }}>0{index + 1}</span>{label(item)}</Link>)}
      </nav></div>
      <div className={styles.roleBox}><b>{user.name}</b><br />{admin ? t('Quản lý tổ chức', 'Organization admin') : auditor ? t('Kiểm toán độc lập', 'Independent auditor') : t('Cán bộ giải ngân', 'Disbursement officer')}<hr style={{ margin: '12px 0', borderColor: '#dce5d6' }} />{t('Mỗi vai một trách nhiệm. Mỗi thao tác có dấu vết.', 'Distinct responsibilities. A record of every action.')}</div>
    </aside>
    <main className={styles.main}>
      <div className={styles.top}><div><div className={styles.eyebrow}>RELIEFCLOAK / {t('ĐIỀU PHỐI', 'OPERATIONS')}</div><h1 style={{ marginTop: 8 }}>{label(view)}</h1><p className={styles.subtitle}>{t('Phối hợp minh bạch. Hỗ trợ đến đúng nơi.', 'Coordinate transparently. Deliver support where it matters.')}</p></div>
        <div className={styles.toolbar}><select className={styles.secondary} aria-label="Language / Ngôn ngữ" value={lang} onChange={e => language(e.target.value as Language)}><option value="vi">VI · Tiếng Việt</option><option value="en">EN · English</option></select><button className={styles.secondary} disabled={loading || busy} onClick={() => { setError(''); void load() }}>{t('Làm mới', 'Refresh')}</button></div>
      </div>
      <div className={styles.banner}><span>◈</span><span><b>{t('DEMO · Tiền mô phỏng', 'DEMO · Simulated funds')}</b> — {MOCK ? t('Danh tính mock. Phê duyệt trong ứng dụng, chưa có chữ ký Tide.', 'Mock identities. Application approvals, not Tide signatures.') : t('Đăng nhập Tide; policy cho từng giao dịch chưa được xác minh.', 'Tide sign-in; per-transaction policy remains unverified.')}</span></div>
      {error && <div className={styles.error} role="alert">{labels[error] ? label(error) : error.startsWith('INVALID_') ? t('Dữ liệu chưa hợp lệ. Kiểm tra lại các trường.', 'Invalid input. Please check the form fields.') : t('Không hoàn tất yêu cầu. Hãy tải lại hoặc thử lại.', 'Could not complete the request. Refresh or retry.')} <small>({error})</small></div>}
      {notice && <div className={styles.notice} role="status">{t('Đã lưu thay đổi.', 'Changes saved.')}</div>}
      {!data ? <div className={styles.loading}>{loading ? t('Đang tải dữ liệu…', 'Loading records…') : t('Chưa tải được dữ liệu. Nhấn Làm mới để thử lại.', 'Unable to load records. Select Refresh to retry.')}</div> : <>
        {view === 'overview' && <>
          <section className={styles.hero}><div className={styles.heroText}><span className={styles.eyebrow} style={{ color: '#b8d6c0' }}>{t('CÙNG NHAU HÀNH ĐỘNG', 'WORKING TOGETHER')}</span><h2>{t('Một hành động nhỏ.\nMột cộng đồng vững vàng.', 'Small actions. Stronger communities.')}</h2><p>{t('Tiếp nhận nhu cầu, phối hợp kiểm tra và theo dõi từng khoản hỗ trợ.', 'Review needs, coordinate independent checks, and follow every relief allocation.')}</p></div><img src="/photos/flood-1.svg" alt={t('Minh họa vùng ngập lụt', 'Illustration of flood relief')} /></section>
          <div className={styles.metrics}>
            <div className={styles.metric}><span>{t('Đã nhận mô phỏng', 'Simulated donations')}</span><strong>{money(data.campaigns.reduce((n, c) => n + c.receivedVnd, 0))}</strong><small>{t('Từ dữ liệu giao dịch', 'Derived from transaction records')}</small></div>
            <div className={styles.metric}><span>{t('Đã chi mô phỏng', 'Simulated disbursements')}</span><strong>{money(data.campaigns.reduce((n, c) => n + c.paidVnd, 0))}</strong><small>{t('Không chuyển tiền thật', 'No actual funds transferred')}</small></div>
            <div className={styles.metric}><span>{t('Chờ kiểm toán', 'Awaiting audit')}</span><strong>{data.disbursements.filter(d => d.status === 'PENDING_AUDIT').length}</strong><small>{t('Cần danh tính độc lập', 'Independent identity required')}</small></div>
          </div>
          <section className={styles.section}><div className={styles.sectionHead}><h2>{t('Chiến dịch đang hoạt động', 'Active campaigns')}</h2><Link href="/admin/campaigns">{t('Xem tất cả →', 'View all →')}</Link></div><div className={styles.grid}>{data.campaigns.filter(c => c.status === 'PUBLISHED').map(c => <div className={styles.card} key={c.id}><img className={styles.cardImage} src={c.image} alt={t('Ảnh minh họa chiến dịch', 'Campaign illustration')} /><div className={styles.cardBody}><div className={styles.meta}><span>{c.region}</span>{badge(c.status)}</div><h3>{c.title[lang]}</h3><div className={styles.progress}><div style={{ width: Math.min(100, c.receivedVnd / c.targetVnd * 100) + '%' }} /></div><div className={styles.meta}><b>{money(c.receivedVnd)}</b><span>/ {money(c.targetVnd)}</span></div></div></div>)}</div>{!data.campaigns.some(c => c.status === 'PUBLISHED') && empty()}</section>
          <section className={styles.section}><div className={styles.sectionHead}><h2>{t('Hoạt động gần đây', 'Recent activity')}</h2><Link href="/admin/audit">{t('Xem nhật ký →', 'View activity →')}</Link></div>{auditTable(data.audit.slice(0, 5))}</section>
        </>}
        {view === 'reports' && (!admin ? empty(t('Chỉ admin được xem report riêng tư.', 'Only admins can view private reports.')) : <>
          {filters(['NEW', 'VERIFYING', 'ACCEPTED', 'REJECTED'])}
          <div className={styles.grid}>{visibleReports.map(report => <article className={styles.card} key={report.id}><div className={styles.cardBody}>
            <div className={styles.meta}><span>{date(report.createdAt)}</span>{badge(report.status)}</div><h3>{report.region}</h3><p style={{ whiteSpace: 'pre-wrap' }}>{report.description}</p>
            <p className={styles.identity}>{t('Người gửi', 'Submitted by')}: {report.createdBy}</p>
            {report.feedback && <div className={styles.feedback}>{report.feedback}</div>}
            {['NEW', 'VERIFYING'].includes(report.status) && <form className={styles.form} style={{ marginTop: 15 }} onSubmit={async e => {
              e.preventDefault(); const form = e.currentTarget, fields = new FormData(form)
              if (await mutate('reports', { id: report.id, status: fields.get('status'), feedback: fields.get('feedback') })) form.reset()
            }}><label>{t('Phản hồi cho người gửi', 'Feedback to reporter')}<textarea className={styles.input} name="feedback" required maxLength={1000} /></label>
              <label>{t('Kết quả xử lý', 'Next status')}<select className={styles.input} name="status">{(report.status === 'NEW' ? ['VERIFYING'] : ['ACCEPTED', 'REJECTED']).map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label>
              <button className={styles.button} disabled={busy}>{t('Cập nhật report', 'Update report')}</button></form>}
            {report.status === 'ACCEPTED' && <p className={styles.small} style={{ marginTop: 12 }}><Link href="/admin/campaigns">{t('Mở quản lý chiến dịch →', 'Open campaign management →')}</Link></p>}
          </div></article>)}</div>{!visibleReports.length && empty()}
        </>)}
        {view === 'campaigns' && <>
          <div className={styles.sectionHead}><p className={styles.small}>{t('Nội dung công khai được biên tập riêng từ report đã chấp nhận.', 'Public content is separately edited from an accepted report.')}</p>{admin && <button className={styles.button} disabled={busy || !accepted.length} onClick={() => setEditor('new')}>+ {t('Tạo chiến dịch', 'New campaign')}</button>}</div>
          {editor && <CampaignEditor key={typeof editor === 'string' ? 'new' : editor.id} campaign={editor === 'new' ? undefined : editor} reports={accepted} lang={lang} busy={busy} onCancel={() => setEditor(null)} onSave={async body => {
            const ok = await mutate('campaigns', editor === 'new' ? body : { ...body, id: editor.id, action: 'save' }, editor === 'new' ? 'POST' : 'PATCH')
            if (ok) setEditor(null)
          }} />}
          {admin && !accepted.length && !editor && <p className={styles.small} style={{ marginBottom: 15 }}>{t('Để tạo chiến dịch mới, chấp nhận một report chưa được dùng.', 'To create a new campaign, accept a report that has not been used.')}</p>}
          {filters(['DRAFT', 'PUBLISHED', 'CLOSED'])}
          <div className={styles.grid}>{visibleCampaigns.map(c => <article className={styles.card} key={c.id}><img className={styles.cardImage} src={c.image} alt={t('Minh họa chiến dịch', 'Campaign illustration')} /><div className={styles.cardBody}><div className={styles.meta}><span>{c.region}</span>{badge(c.status)}</div><h3>{c.title[lang]}</h3><p>{c.content[lang]}</p><div className={styles.progress}><div style={{ width: Math.min(100, c.receivedVnd / c.targetVnd * 100) + '%' }} /></div><div className={styles.meta}><b>{money(c.receivedVnd)}</b><span>/ {money(c.targetVnd)}</span></div><p className={styles.small} style={{ margin: '10px 0' }}>{t('Số dư khả dụng', 'Available balance')}: {money(c.availableVnd)}</p>
            {admin && <div className={styles.toolbar}>{c.status === 'DRAFT' && <><button className={styles.secondary} disabled={busy} onClick={() => setEditor(c)}>{t('Sửa / xem trước', 'Edit / preview')}</button><button className={styles.button} disabled={busy} onClick={() => void mutate('campaigns', { id: c.id, action: 'publish' })}>{t('Xuất bản', 'Publish')}</button></>}{c.status === 'PUBLISHED' && <button className={styles.secondary} disabled={busy} onClick={() => setConfirmId(c.id)}>{t('Đóng chiến dịch', 'Close campaign')}</button>}</div>}
            {confirmId === c.id && <div className={styles.feedback}><p>{t('Đóng chiến dịch sẽ ngừng nhận đóng góp mới. Hồ sơ giải ngân vẫn được giữ.', 'Closing stops new donations. Disbursement records remain available.')}</p><div className={styles.toolbar} style={{ marginTop: 10 }}><button className={styles.danger} disabled={busy} onClick={async () => { if (await mutate('campaigns', { id: c.id, action: 'close' })) setConfirmId(null) }}>{t('Xác nhận đóng', 'Confirm close')}</button><button className={styles.secondary} onClick={() => setConfirmId(null)}>{t('Hủy', 'Cancel')}</button></div></div>}
          </div></article>)}</div>{!visibleCampaigns.length && empty()}
        </>}
        {view === 'disbursements' && <>
          <div className={styles.sectionHead}><p className={styles.small}>{t('Đề xuất → kiểm toán độc lập → chi mô phỏng. Ba danh tính khác nhau.', 'Proposal → independent audit → simulated payment. Three different identities.')}</p>{admin && <button className={styles.button} onClick={() => setProposalOpen(!proposalOpen)}>+ {t('Đề xuất chi', 'Propose payout')}</button>}</div>
          {proposalOpen && admin && <div className={styles.formPanel}><h2>{t('Đề xuất giải ngân', 'New payout proposal')}</h2><form className={styles.form} onSubmit={async e => {
            e.preventDefault(); const fields = new FormData(e.currentTarget)
            if (await mutate('disbursements', { campaignId: fields.get('campaignId'), amountVnd: Number(fields.get('amountVnd')), purpose: fields.get('purpose'), recipient: fields.get('recipient') }, 'POST')) setProposalOpen(false)
          }}><label>{t('Chiến dịch', 'Campaign')}<select className={styles.input} name="campaignId" required><option value="">{t('Chọn chiến dịch', 'Choose a campaign')}</option>{data.campaigns.filter(c => c.status !== 'DRAFT').map(c => <option key={c.id} value={c.id}>{c.title[lang]} — {money(c.availableVnd)}</option>)}</select></label>
            <div className={styles.formGrid}><label>{t('Số tiền (VND)', 'Amount (VND)')}<input className={styles.input} name="amountVnd" type="number" required min={1} max={1000000000000} step={1} /></label><label>{t('Người nhận giả lập', 'Synthetic recipient')}<input className={styles.input} name="recipient" required maxLength={200} /></label></div>
            <label>{t('Mục đích chi', 'Purpose')}<textarea className={styles.input} name="purpose" required maxLength={1000} /></label><p className={styles.small}>{t('Sau khi gửi, số tiền và người nhận không thể sửa. Chỉ nhập dữ liệu giả.', 'Amount and recipient are immutable after submission. Use synthetic data only.')}</p><div className={styles.toolbar}><button className={styles.button} disabled={busy}>{t('Gửi kiểm toán', 'Submit for audit')}</button><button type="button" className={styles.secondary} onClick={() => setProposalOpen(false)}>{t('Hủy', 'Cancel')}</button></div></form></div>}
          {filters(['PENDING_AUDIT', 'APPROVED', 'REJECTED', 'PAID_SIMULATED'])}
          <div className={styles.grid}>{visiblePayouts.map(d => <article className={styles.card} key={d.id}><div className={styles.cardBody}><div className={styles.meta}><span>{date(d.proposedAt)}</span>{badge(d.status)}</div><h3>{campaignName(d.campaignId)}</h3><strong style={{ fontSize: 25 }}>{money(d.amountVnd)}</strong><p style={{ marginTop: 10 }}>{d.purpose}</p><p className={styles.small}>{t('Người nhận giả lập', 'Synthetic recipient')}: {d.recipient}</p>
            <div className={styles.timeline}><div className={styles.step} data-done="true">01 · {t('Đề xuất', 'Proposed')}<br />{d.proposedBy}</div><div className={styles.step} data-done={!!d.auditedBy}>02 · {t('Kiểm toán', 'Audited')}<br />{d.auditedBy || '—'}</div><div className={styles.step} data-done={!!d.paidBy}>03 · {t('Chi mô phỏng', 'Simulated')}<br />{d.paidBy || '—'}</div></div>
            {d.auditNote && <div className={styles.feedback}>{d.auditNote}</div>}
            {auditor && d.status === 'PENDING_AUDIT' && d.proposedBy !== user.id && <form className={styles.form} onSubmit={async e => {
              e.preventDefault(); const form = e.currentTarget, fields = new FormData(form)
              if (await mutate('disbursements', { id: d.id, action: 'audit', decision: fields.get('decision'), note: fields.get('note') })) form.reset()
            }}><label>{t('Nhận xét kiểm toán', 'Audit note')}<textarea name="note" className={styles.input} required maxLength={1000} /></label><label>{t('Quyết định', 'Decision')}<select name="decision" className={styles.input}><option value="APPROVED">{t('Phê duyệt', 'Approve')}</option><option value="REJECTED">{t('Từ chối', 'Reject')}</option></select></label><button disabled={busy} className={styles.button}>{t('Lưu quyết định', 'Save decision')}</button></form>}
            {officer && d.status === 'APPROVED' && ![d.proposedBy, d.auditedBy].includes(user.id) && (confirmId !== d.id ? <button className={styles.button} onClick={() => setConfirmId(d.id)}>{t('Thực hiện chi mô phỏng', 'Execute simulated payout')}</button> : <div className={styles.feedback}><p>{t('Xác nhận khoản chi mô phỏng. Số dư sẽ được kiểm tra lại trên server.', 'Confirm this simulated payout. The server will recheck available funds.')}</p><div className={styles.toolbar} style={{ marginTop: 10 }}><button disabled={busy} className={styles.button} onClick={async () => { if (await mutate('disbursements', { id: d.id, action: 'execute', idempotencyKey: 'execute-' + d.id })) setConfirmId(null) }}>{t('Xác nhận chi', 'Confirm payout')}</button><button className={styles.secondary} onClick={() => setConfirmId(null)}>{t('Hủy', 'Cancel')}</button></div></div>)}
            {admin && d.status === 'PENDING_AUDIT' && <p className={styles.small}>{t('Chờ kiểm toán viên độc lập xem xét.', 'Waiting for an independent auditor.')}</p>}
          </div></article>)}</div>{!visiblePayouts.length && empty()}
        </>}
        {view === 'audit' && <><p className={styles.small} style={{ marginBottom: 15 }}>{t('Nhật ký ứng dụng dùng cho demo; đây không phải bằng chứng mật mã chống sửa đổi.', 'Application audit history for the demo; these entries are not tamper-proof cryptographic evidence.')}</p>{auditTable(data.audit)}</>}
      </>}
    </main>
  </div>

  function auditTable(events: Snapshot['audit']) {
    return events.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>{t('Thời gian (VN)', 'Time (Vietnam)')}</th><th>{t('Người thực hiện', 'Actor')}</th><th>{t('Hành động', 'Action')}</th><th>{t('Mã hồ sơ', 'Record ID')}</th></tr></thead><tbody>{events.map(e => <tr key={e.id}><td>{date(e.at)}</td><td>{e.actorName}</td><td>{label(e.action)}</td><td title={e.objectId}>{e.objectId.slice(0, 15)}</td></tr>)}</tbody></table></div> : empty(t('Chưa có hoạt động.', 'No activity yet.'))
  }
}

function CampaignEditor({ campaign, reports, lang, busy, onCancel, onSave }: {
  campaign?: Campaign; reports: Snapshot['reports']; lang: Language; busy: boolean; onCancel: () => void; onSave: (body: object) => Promise<void>
}) {
  const t = (vi: string, en: string) => lang === 'vi' ? vi : en
  const [preview, setPreview] = useState(false)
  const [draft, setDraft] = useState({ reportId: campaign?.reportId || '', viTitle: campaign?.title.vi || '', enTitle: campaign?.title.en || '', viContent: campaign?.content.vi || '', enContent: campaign?.content.en || '', targetVnd: String(campaign?.targetVnd || ''), image: campaign?.image || '/photos/flood-1.svg' })
  const field = (key: keyof typeof draft) => ({ value: draft[key], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setDraft({ ...draft, [key]: e.target.value }) })
  async function submit(e: FormEvent) {
    e.preventDefault()
    await onSave({ reportId: draft.reportId, title: { vi: draft.viTitle, en: draft.enTitle }, content: { vi: draft.viContent, en: draft.enContent }, targetVnd: Number(draft.targetVnd), image: draft.image })
  }
  return <div className={styles.formPanel}><h2>{campaign ? t('Biên tập bản nháp', 'Edit campaign draft') : t('Tạo chiến dịch từ report', 'Create campaign from a report')}</h2><form className={styles.form} onSubmit={submit}>
    {!campaign && <label>{t('Report đã chấp nhận', 'Accepted report')}<select className={styles.input} required {...field('reportId')}><option value="">{t('Chọn report', 'Choose a report')}</option>{reports.map(r => <option key={r.id} value={r.id}>{r.region} · {r.id.slice(0, 8)}</option>)}</select></label>}
    <div className={styles.formGrid}><label>{t('Tiêu đề tiếng Việt', 'Vietnamese title')}<input className={styles.input} required maxLength={160} {...field('viTitle')} /></label><label>{t('Tiêu đề tiếng Anh', 'English title')}<input className={styles.input} required maxLength={160} {...field('enTitle')} /></label></div>
    <div className={styles.formGrid}><label>{t('Nội dung tiếng Việt', 'Vietnamese content')}<textarea className={styles.input} required maxLength={5000} rows={5} {...field('viContent')} /></label><label>{t('Nội dung tiếng Anh', 'English content')}<textarea className={styles.input} required maxLength={5000} rows={5} {...field('enContent')} /></label></div>
    <div className={styles.formGrid}><label>{t('Mục tiêu (VND)', 'Target (VND)')}<input className={styles.input} required type="number" min={1} max={1000000000000} step={1} {...field('targetVnd')} /></label><label>{t('Ảnh minh họa có sẵn', 'Bundled illustration')}<select className={styles.input} {...field('image')}><option value="/photos/flood-1.svg">{t('Vùng ngập lụt', 'Flooded community')}</option><option value="/photos/flood-2.svg">{t('Hỗ trợ cứu trợ', 'Relief support')}</option></select></label></div>
    <p className={styles.small}>{t('Chỉ đưa nội dung phù hợp công khai; không sao chép dữ liệu riêng tư của người báo cáo.', 'Use public-safe content; do not copy private reporter information.')}</p>
    <div className={styles.toolbar}><button className={styles.button} disabled={busy}>{t('Lưu bản nháp', 'Save draft')}</button><button type="button" className={styles.secondary} onClick={() => setPreview(!preview)}>{t('Xem trước', 'Preview')}</button><button type="button" className={styles.secondary} onClick={onCancel}>{t('Hủy', 'Cancel')}</button></div>
    {preview && <div className={styles.preview}><img src={draft.image} alt={t('Ảnh xem trước', 'Preview illustration')} className={styles.cardImage} /><h3>{lang === 'vi' ? draft.viTitle : draft.enTitle}</h3><p>{lang === 'vi' ? draft.viContent : draft.enContent}</p></div>}
  </form></div>
}
