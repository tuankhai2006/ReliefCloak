import { simPublic } from '@/lib/simTideRoute'
import { publicJwk, SIM_ISSUER } from '@/lib/simTide'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Public verification key of the simulated realm (real TideCloak embeds this as `jwk` in tidecloak.json).
export function GET() {
  return simPublic(() => ({ issuer: SIM_ISSUER, keys: [publicJwk()] }))
}
