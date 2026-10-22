import { randomUUID } from 'node:crypto'
import type { SessionUser } from '@/lib/auth'
import type { AuditEvent, Campaign, CampaignBalance, Disbursement, Donation, ReliefStore, ReportStatus } from '@/models/relief'
import { mutateRelief, readRelief } from '@/models/reliefStore'
import { ServiceError } from './claimService'

export const INTERNAL_ROLES = ['org_admin', 'auditor', 'disburser']
export function requireRole(user: SessionUser, ...roles: string[]) {
  if (!roles.some(role => user.roles.includes(role))) throw new ServiceError(403, 'FORBIDDEN')
}
export function inputObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ServiceError(400, 'INVALID_INPUT')
  return input as Record<string, unknown>
}
export function requiredText(input: Record<string, unknown>, key: string, max = 3000): string {
  const value = input[key]
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new ServiceError(400, 'INVALID_' + key)
  return value.trim()
}
function amount(input: Record<string, unknown>, key: string): number {
  const value = input[key]
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0 || value > 1_000_000_000_000)
    throw new ServiceError(400, 'INVALID_' + key)
  return value
}
function event(store: ReliefStore, user: SessionUser, action: string, objectId: string) {
  const entry: AuditEvent = { id: randomUUID(), actorId: user.id, actorName: user.name, action, objectId, at: new Date().toISOString() }
  store.audit.unshift(entry)
}
export function balance(store: ReliefStore, campaignId: string): CampaignBalance {
  const receivedVnd = store.donations.filter(d => d.campaignId === campaignId).reduce((sum, d) => sum + d.amountVnd, 0)
  const paidVnd = store.disbursements.filter(d => d.campaignId === campaignId && d.status === 'PAID_SIMULATED').reduce((sum, d) => sum + d.amountVnd, 0)
  return { receivedVnd, paidVnd, availableVnd: receivedVnd - paidVnd }
}
export function adminSnapshot(user: SessionUser) {
  requireRole(user, ...INTERNAL_ROLES)
  const s = readRelief()
  return {
    reports: user.roles.includes('org_admin') ? s.reports.map(r => ({ ...r, status: r.status || 'NEW' })) : [],
    campaigns: s.campaigns.map(c => ({ ...c, ...balance(s, c.id) })),
    disbursements: s.disbursements, audit: s.audit,
    mode: process.env.NEXT_PUBLIC_TIDE_MOCK === 'true' ? 'MOCK' : 'TIDE_AUTH_ONLY',
    transactionPolicyVerified: false,
  }
}
export function reviewReport(user: SessionUser, id: string, input: unknown) {
  requireRole(user, 'org_admin')
  const body = inputObject(input)
  const next = requiredText(body, 'status', 20) as ReportStatus
  const feedback = requiredText(body, 'feedback', 1000)
  return mutateRelief(s => {
    const report = s.reports.find(r => r.id === id)
    if (!report) throw new ServiceError(404, 'REPORT_NOT_FOUND')
    const current = report.status || 'NEW'
    if (!((current === 'NEW' && next === 'VERIFYING') || (current === 'VERIFYING' && ['ACCEPTED', 'REJECTED'].includes(next))))
      throw new ServiceError(409, 'INVALID_TRANSITION')
    Object.assign(report, { status: next, feedback, reviewedBy: user.id, reviewedAt: new Date().toISOString() })
    event(s, user, 'REPORT_' + next, id)
    return report
  })
}
function campaignFields(body: Record<string, unknown>) {
  const title = inputObject(body.title), content = inputObject(body.content)
  const image = requiredText(body, 'image', 200)
  if (!['/photos/flood-1.svg', '/photos/flood-2.svg'].includes(image)) throw new ServiceError(400, 'INVALID_image')
  return { title: { vi: requiredText(title, 'vi', 160), en: requiredText(title, 'en', 160) },
    content: { vi: requiredText(content, 'vi', 5000), en: requiredText(content, 'en', 5000) },
    image, targetVnd: amount(body, 'targetVnd') }
}
export function createCampaign(user: SessionUser, input: unknown) {
  requireRole(user, 'org_admin')
  const body = inputObject(input), fields = campaignFields(body), reportId = requiredText(body, 'reportId', 100)
  return mutateRelief(s => {
    const report = s.reports.find(r => r.id === reportId)
    if (!report || report.status !== 'ACCEPTED') throw new ServiceError(409, 'REPORT_NOT_ACCEPTED')
    if (s.campaigns.some(c => c.reportId === reportId)) throw new ServiceError(409, 'CAMPAIGN_EXISTS')
    const now = new Date().toISOString()
    const campaign: Campaign = { id: randomUUID(), reportId, region: report.region, ...fields, status: 'DRAFT', createdBy: user.id, createdAt: now, updatedAt: now }
    s.campaigns.unshift(campaign); event(s, user, 'CAMPAIGN_CREATED', campaign.id)
    return campaign
  })
}
export function updateCampaign(user: SessionUser, id: string, input: unknown) {
  requireRole(user, 'org_admin')
  const body = inputObject(input), action = requiredText(body, 'action', 20)
  return mutateRelief(s => {
    const c = s.campaigns.find(c => c.id === id)
    if (!c) throw new ServiceError(404, 'CAMPAIGN_NOT_FOUND')
    if (action === 'save' && c.status === 'DRAFT') Object.assign(c, campaignFields(body))
    else if (action === 'publish' && c.status === 'DRAFT') { campaignFields(c as unknown as Record<string, unknown>); c.status = 'PUBLISHED' }
    else if (action === 'close' && c.status === 'PUBLISHED') c.status = 'CLOSED'
    else throw new ServiceError(409, 'INVALID_TRANSITION')
    c.updatedAt = new Date().toISOString(); event(s, user, 'CAMPAIGN_' + action.toUpperCase(), id)
    return c
  })
}
// Shared donor primitive for Khai's API. No public donation route is owned here.
export function recordDonation(user: SessionUser, input: unknown) {
  const body = inputObject(input), campaignId = requiredText(body, 'campaignId', 100)
  const amountVnd = amount(body, 'amountVnd'), key = requiredText(body, 'idempotencyKey', 120)
  if (typeof body.anonymous !== 'boolean') throw new ServiceError(400, 'INVALID_anonymous')
  return mutateRelief(s => {
    const prior = s.donations.find(d => d.donorId === user.id && d.idempotencyKey === key)
    if (prior) {
      if (prior.campaignId !== campaignId || prior.amountVnd !== amountVnd || prior.anonymous !== body.anonymous) throw new ServiceError(409, 'IDEMPOTENCY_CONFLICT')
      return prior
    }
    if (!s.campaigns.some(c => c.id === campaignId && c.status === 'PUBLISHED')) throw new ServiceError(409, 'CAMPAIGN_NOT_OPEN')
    if (!Number.isSafeInteger(balance(s, campaignId).receivedVnd + amountVnd)) throw new ServiceError(400, 'INVALID_amountVnd')
    const id = randomUUID()
    const d: Donation = { id, campaignId, donorId: user.id, amountVnd, anonymous: body.anonymous as boolean, idempotencyKey: key, receipt: 'SIM-' + id, createdAt: new Date().toISOString(), simulated: true }
    s.donations.unshift(d); event(s, user, 'DONATION_SIMULATED', id)
    return d
  })
}
export function proposeDisbursement(user: SessionUser, input: unknown) {
  requireRole(user, 'org_admin')
  const body = inputObject(input), campaignId = requiredText(body, 'campaignId', 100)
  const amountVnd = amount(body, 'amountVnd'), purpose = requiredText(body, 'purpose', 1000), recipient = requiredText(body, 'recipient', 200)
  return mutateRelief(s => {
    if (!s.campaigns.some(c => c.id === campaignId && c.status !== 'DRAFT')) throw new ServiceError(409, 'CAMPAIGN_NOT_OPEN')
    if (balance(s, campaignId).availableVnd < amountVnd) throw new ServiceError(409, 'INSUFFICIENT_FUNDS')
    const d: Disbursement = { id: randomUUID(), campaignId, amountVnd, purpose, recipient, proposedBy: user.id, proposedAt: new Date().toISOString(), status: 'PENDING_AUDIT' }
    s.disbursements.unshift(d); event(s, user, 'PAYOUT_PROPOSED', d.id)
    return d
  })
}
export function decideDisbursement(user: SessionUser, id: string, input: unknown) {
  requireRole(user, 'auditor')
  const body = inputObject(input), decision = requiredText(body, 'decision', 20), note = requiredText(body, 'note', 1000)
  if (!['APPROVED', 'REJECTED'].includes(decision)) throw new ServiceError(400, 'INVALID_decision')
  return mutateRelief(s => {
    const d = s.disbursements.find(d => d.id === id)
    if (!d) throw new ServiceError(404, 'PAYOUT_NOT_FOUND')
    if (d.proposedBy === user.id) throw new ServiceError(403, 'INDEPENDENT_ACTOR_REQUIRED')
    if (d.status !== 'PENDING_AUDIT') throw new ServiceError(409, 'INVALID_TRANSITION')
    Object.assign(d, { status: decision, auditedBy: user.id, auditedAt: new Date().toISOString(), auditNote: note })
    event(s, user, 'PAYOUT_' + decision, id); return d
  })
}
export function executeDisbursement(user: SessionUser, id: string, input: unknown) {
  requireRole(user, 'disburser')
  const key = requiredText(inputObject(input), 'idempotencyKey', 120)
  return mutateRelief(s => {
    const d = s.disbursements.find(d => d.id === id)
    if (!d) throw new ServiceError(404, 'PAYOUT_NOT_FOUND')
    if ([d.proposedBy, d.auditedBy].includes(user.id)) throw new ServiceError(403, 'INDEPENDENT_ACTOR_REQUIRED')
    if (d.status === 'PAID_SIMULATED' && d.executionKey === key && d.paidBy === user.id) return d
    if (d.status !== 'APPROVED' || !d.auditedBy || d.auditedBy === d.proposedBy) throw new ServiceError(409, 'INVALID_TRANSITION')
    if (s.disbursements.some(other => other.executionKey === key)) throw new ServiceError(409, 'IDEMPOTENCY_CONFLICT')
    if (balance(s, d.campaignId).availableVnd < d.amountVnd) throw new ServiceError(409, 'INSUFFICIENT_FUNDS')
    Object.assign(d, { status: 'PAID_SIMULATED', paidBy: user.id, paidAt: new Date().toISOString(), executionKey: key })
    event(s, user, 'PAYOUT_SIMULATED', id); return d
  })
}
export function publicCampaigns() {
  const s = readRelief()
  return s.campaigns.filter(c => c.status !== 'DRAFT').map(c => ({ id: c.id, region: c.region, title: c.title, content: c.content, image: c.image, targetVnd: c.targetVnd, status: c.status, ...balance(s, c.id) }))
}
export function ownDonations(user: SessionUser) {
  return readRelief().donations.filter(d => d.donorId === user.id).map(({ idempotencyKey: _key, ...d }) => d)
}
export function transparency() {
  const s = readRelief(), visible = new Set(s.campaigns.filter(c => c.status !== 'DRAFT').map(c => c.id))
  return {
    simulated: true, cryptographicProof: false,
    campaigns: publicCampaigns(),
    donations: s.donations.filter(d => visible.has(d.campaignId)).map(d => ({ id: d.id, campaignId: d.campaignId, amountVnd: d.amountVnd, createdAt: d.createdAt, simulated: true })),
    disbursements: s.disbursements.filter(d => visible.has(d.campaignId)).map(d => ({ id: d.id, campaignId: d.campaignId, amountVnd: d.amountVnd, status: d.status, proposedAt: d.proposedAt, auditedAt: d.auditedAt, paidAt: d.paidAt })),
  }
}
