import { simWithUser } from '@/lib/simTideRoute'
import { governanceSnapshot, requestRoleChange } from '@/lib/simTide'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Simulated IGA (like GET /admin/realms/{realm}/iga/change-requests). tide-realm-admin only.
export async function GET(req: Request) {
  return simWithUser(req, (user) => governanceSnapshot(user.id))
}

// Draft a role change { userId, role, action: 'grant' | 'revoke' }. It does not take effect until quorum.
export async function POST(req: Request) {
  return simWithUser(req, async (user) => requestRoleChange(user.id, await req.json()))
}
