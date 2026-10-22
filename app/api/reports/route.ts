import { withUser } from '@/lib/auth'
import { reportsFor, submitReport } from '@/services/communityService'
export const dynamic = 'force-dynamic'
export async function GET(req: Request) {
  return withUser(req, user => reportsFor(user))
}
export async function POST(req: Request) {
  return withUser(req, async user => submitReport(user, await req.json()))
}
