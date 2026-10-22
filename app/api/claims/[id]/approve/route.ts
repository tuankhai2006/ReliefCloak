import { withUser } from '@/lib/auth'
import { approveClaim } from '@/services/claimService'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withUser(req, (user) => approveClaim(user, id))
}
