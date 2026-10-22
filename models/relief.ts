import type { CommunityPost, CommunityReport } from './community'

export type ReportStatus = 'NEW' | 'VERIFYING' | 'ACCEPTED' | 'REJECTED'
export type CampaignStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'
export type PayoutStatus = 'PENDING_AUDIT' | 'APPROVED' | 'REJECTED' | 'PAID_SIMULATED'
export type LocalizedText = { vi: string; en: string }
export interface Campaign {
  id: string; reportId: string; region: string; title: LocalizedText; content: LocalizedText
  image: string; targetVnd: number; status: CampaignStatus; createdBy: string; createdAt: string; updatedAt: string
}
export interface Donation {
  id: string; campaignId: string; donorId: string; amountVnd: number; anonymous: boolean
  idempotencyKey: string; receipt: string; createdAt: string; simulated: true
}
export interface Disbursement {
  id: string; campaignId: string; amountVnd: number; purpose: string; recipient: string
  proposedBy: string; proposedAt: string; status: PayoutStatus
  auditedBy?: string; auditedAt?: string; auditNote?: string
  paidBy?: string; paidAt?: string; executionKey?: string
}
export interface AuditEvent {
  id: string; actorId: string; actorName: string; action: string; objectId: string; at: string
}
export interface ReliefStore {
  version: 1; reports: CommunityReport[]; posts: CommunityPost[]
  campaigns: Campaign[]; donations: Donation[]; disbursements: Disbursement[]; audit: AuditEvent[]
}
export interface CampaignBalance { receivedVnd: number; paidVnd: number; availableVnd: number }
