import { simWithUser } from '@/lib/simTideRoute'
import { decideRoleChange } from '@/lib/simTide'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// { decision: 'approve' | 'deny' } — like iga/change-requests/{id}/authorize and /deny.
// Commits automatically once enough distinct realm admins have authorized.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return simWithUser(req, async (user) => decideRoleChange(user.id, id, (await req.json())?.decision))
}
