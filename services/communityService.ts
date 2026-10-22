import { randomUUID } from 'node:crypto'
import type { CommunityPost, CommunityReport } from '@/models/community'
import type { SessionUser } from '@/lib/auth'
import { ServiceError } from './claimService'
import { readRelief, mutateRelief } from '@/models/reliefStore'

function text(body: unknown, key: string, max: number): string {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>)[key] : undefined
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw new ServiceError(400, `${key}: cần nhập từ 1 đến ${max} ký tự`)
  return value.trim()
}
export function reportsFor(user: SessionUser) {
  return readRelief().reports.filter(r => user.roles.includes('org_admin') || r.createdBy === user.id)
}
export function submitReport(user: SessionUser, body: unknown) {
  const report: CommunityReport = {
    id: randomUUID(), region: text(body, 'region', 160), description: text(body, 'description', 3000),
    createdBy: user.id, createdAt: new Date().toISOString(),
    status: 'NEW',
  }
  return mutateRelief(store => { store.reports.unshift(report); return report })
}
export function publicPosts() { return readRelief().posts }
export function publishPost(user: SessionUser, body: unknown) {
  if (!user.roles.includes('org_admin')) throw new ServiceError(403, 'Chỉ admin được đăng bài')
  const reportId = text(body, 'reportId', 100)
  return mutateRelief(store => {
  const report = store.reports.find(r => r.id === reportId)
  if (!report) throw new ServiceError(404, 'Không tìm thấy report')
  if (store.posts.some(p => p.reportId === reportId)) throw new ServiceError(409, 'Report đã có bài đăng')
  const post: CommunityPost = {
    id: randomUUID(), reportId, title: text(body, 'title', 160), content: text(body, 'content', 5000),
    region: report.region, publishedAt: new Date().toISOString(),
  }
  store.posts.unshift(post)
  return post
  })
}
