import { withUser } from '@/lib/auth'
import { donate, myDonations } from '@/services/publicService'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lịch sử ủng hộ của chính người đăng nhập.
export async function GET(req: Request) {
  return withUser(req, (user) => myDonations(user))
}

// { campaignId, amountVnd, anonymous, idempotencyKey } → { donation, replayed }
export async function POST(req: Request) {
  return withUser(req, async (user) => donate(user, await req.json()))
}
