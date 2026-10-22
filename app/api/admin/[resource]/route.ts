import { withUser } from '@/lib/auth'
import { ServiceError } from '@/services/claimService'
import { adminSnapshot, createCampaign, decideDisbursement, executeDisbursement, inputObject, proposeDisbursement, requiredText, requireRole, reviewReport, updateCampaign } from '@/services/reliefService'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
type Context = { params: Promise<{ resource: string }> }
export async function GET(req: Request, context: Context) {
  const { resource } = await context.params
  return withUser(req, user => {
    if (resource === 'reports') requireRole(user, 'org_admin')
    const snapshot = adminSnapshot(user)
    if (resource === 'dashboard') return snapshot
    if (resource === 'reports' || resource === 'campaigns' || resource === 'disbursements' || resource === 'audit') return snapshot[resource]
    throw new ServiceError(404, 'NOT_FOUND')
  })
}
export async function POST(req: Request, context: Context) {
  const { resource } = await context.params
  return withUser(req, async user => {
    const body = inputObject(await req.json())
    if (resource === 'campaigns') return createCampaign(user, body)
    if (resource === 'disbursements') return proposeDisbursement(user, body)
    throw new ServiceError(404, 'NOT_FOUND')
  })
}
export async function PATCH(req: Request, context: Context) {
  const { resource } = await context.params
  return withUser(req, async user => {
    const body = inputObject(await req.json()), id = requiredText(body, 'id', 100)
    if (resource === 'reports') return reviewReport(user, id, body)
    if (resource === 'campaigns') return updateCampaign(user, id, body)
    if (resource === 'disbursements' && body.action === 'audit') return decideDisbursement(user, id, body)
    if (resource === 'disbursements' && body.action === 'execute') return executeDisbursement(user, id, body)
    throw new ServiceError(404, 'NOT_FOUND')
  })
}
