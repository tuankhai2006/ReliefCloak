import { randomUUID } from 'node:crypto'
import type { CommunityPost, CommunityReport } from '@/models/community'
import type { SessionUser } from '@/lib/auth'
import { ServiceError } from './claimService'
import { readRelief, mutateRelief } from '@/models/reliefStore'
import { NEEDS, PUBLIC_IMAGES, URGENCIES, type Need } from '@/models/publicImages'

function text(body: unknown, key: string, max: number): string {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>)[key] : undefined
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw new ServiceError(400, `INVALID_${key}`)
  return value.trim()
}
export function reportsFor(user: SessionUser) {
  return readRelief().reports.filter(r => user.roles.includes('org_admin') || r.createdBy === user.id)
}
// needs/urgency/image là tùy chọn để form cũ (chỉ region + description) vẫn chạy.
// needs lưu dạng "food,water" theo kiểu string của CommunityReport.
function optionalFields(body: unknown): Pick<CommunityReport, 'needs' | 'urgency' | 'image'> {
  const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const out: Pick<CommunityReport, 'needs' | 'urgency' | 'image'> = {}
  if (input.needs !== undefined) {
    if (!Array.isArray(input.needs) || input.needs.some(n => !NEEDS.includes(n as Need))) throw new ServiceError(400, 'INVALID_needs')
    if (input.needs.length) out.needs = [...new Set(input.needs as Need[])].join(',')
  }
  if (input.urgency !== undefined) {
    if (!URGENCIES.includes(input.urgency as (typeof URGENCIES)[number])) throw new ServiceError(400, 'INVALID_urgency')
    out.urgency = input.urgency as CommunityReport['urgency']
  }
  if (input.image !== undefined && input.image !== '') {
    if (!PUBLIC_IMAGES.includes(input.image as (typeof PUBLIC_IMAGES)[number])) throw new ServiceError(400, 'INVALID_image')
    out.image = input.image as string
  }
  return out
}
export function submitReport(user: SessionUser, body: unknown) {
  const report: CommunityReport = {
    id: randomUUID(), region: text(body, 'region', 160), description: text(body, 'description', 3000),
    ...optionalFields(body),
    createdBy: user.id, createdAt: new Date().toISOString(),
    status: 'NEW',
  }
  return mutateRelief(store => { store.reports.unshift(report); return report })
}
export function publicPosts() { return readRelief().posts }
export function publishPost(user: SessionUser, body: unknown) {
  if (!user.roles.includes('org_admin')) throw new ServiceError(403, 'FORBIDDEN')
  const reportId = text(body, 'reportId', 100)
  return mutateRelief(store => {
  const report = store.reports.find(r => r.id === reportId)
  if (!report) throw new ServiceError(404, 'REPORT_NOT_FOUND')
  if (store.posts.some(p => p.reportId === reportId)) throw new ServiceError(409, 'POST_EXISTS')
  const post: CommunityPost = {
    id: randomUUID(), reportId, title: text(body, 'title', 160), content: text(body, 'content', 5000),
    region: report.region, publishedAt: new Date().toISOString(),
  }
  store.posts.unshift(post)
  return post
  })
}
