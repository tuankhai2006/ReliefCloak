import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { CommunityPost, CommunityReport } from '@/models/community'
import type { SessionUser } from '@/lib/auth'
import { ServiceError } from './claimService'

const file = path.join(process.cwd(), 'data', 'community.json')
type Store = { reports: CommunityReport[]; posts: CommunityPost[] }
function load(): Store {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { reports: [], posts: [] }
}
function save(store: Store) {
  const temporary = `${file}.tmp`
  fs.writeFileSync(temporary, JSON.stringify(store, null, 2))
  fs.renameSync(temporary, file)
}
function text(body: unknown, key: string, max: number): string {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>)[key] : undefined
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw new ServiceError(400, `${key}: cần nhập từ 1 đến ${max} ký tự`)
  return value.trim()
}
export function reportsFor(user: SessionUser) {
  return load().reports.filter(r => user.roles.includes('org_admin') || r.createdBy === user.id)
}
export function submitReport(user: SessionUser, body: unknown) {
  const report: CommunityReport = {
    id: randomUUID(), region: text(body, 'region', 160), description: text(body, 'description', 3000),
    createdBy: user.id, createdAt: new Date().toISOString(),
  }
  const store = load()
  store.reports.unshift(report)
  save(store)
  return report
}
export function publicPosts() { return load().posts }
export function publishPost(user: SessionUser, body: unknown) {
  if (!user.roles.includes('org_admin')) throw new ServiceError(403, 'Chỉ admin được đăng bài')
  const reportId = text(body, 'reportId', 100)
  const store = load()
  const report = store.reports.find(r => r.id === reportId)
  if (!report) throw new ServiceError(404, 'Không tìm thấy report')
  if (store.posts.some(p => p.reportId === reportId)) throw new ServiceError(409, 'Report đã có bài đăng')
  const post: CommunityPost = {
    id: randomUUID(), reportId, title: text(body, 'title', 160), content: text(body, 'content', 5000),
    region: report.region, publishedAt: new Date().toISOString(),
  }
  store.posts.unshift(post)
  save(store)
  return post
}
