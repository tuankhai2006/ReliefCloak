import { withUser } from '@/lib/auth'
import { myDonation } from '@/services/publicService'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withUser(req, (user) => myDonation(user, id))
}
