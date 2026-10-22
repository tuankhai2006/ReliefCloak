import { simPublic } from '@/lib/simTideRoute'
import { issueToken, listAccounts } from '@/lib/simTide'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Demo accounts for the simulated sign-in screen.
export function GET() {
  return simPublic(() => listAccounts())
}

// Simulated Tide enclave login: returns a signed access token for the chosen demo account.
// Real TideCloak would only issue this after the user proves their password to the ORK network.
export async function POST(req: Request) {
  return simPublic(async () => {
    const body = await req.json()
    return issueToken(String(body?.userId ?? ''))
  })
}
