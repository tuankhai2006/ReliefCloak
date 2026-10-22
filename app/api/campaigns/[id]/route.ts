import { publicJson } from '@/lib/publicRoute'
import { getCampaign } from '@/services/publicService'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return publicJson(() => getCampaign(id))
}
