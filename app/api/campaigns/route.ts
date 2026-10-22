import { publicJson } from '@/lib/publicRoute'
import { listCampaigns } from '@/services/publicService'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Công khai: chiến dịch đã publish/đóng, số dư tính từ bản ghi.
export function GET() {
  return publicJson(() => listCampaigns())
}
