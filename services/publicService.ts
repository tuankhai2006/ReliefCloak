// K4/K6 (Khai): lớp mỏng cho API công khai và ủng hộ, dùng các hàm dùng chung của reliefService.
// Không có kho dữ liệu hay cách tính số dư riêng (theo docs/ADMIN_HANDOFF.md).
import type { SessionUser } from '@/lib/auth'
import type { LocalizedText } from '@/models/relief'
import { readRelief } from '@/models/reliefStore'
import { ServiceError } from './claimService'
import { inputObject, ownDonations, publicCampaigns, recordDonation, requireRole, transparency } from './reliefService'

type BaseCampaign = ReturnType<typeof publicCampaigns>[number]

export interface PublicCampaign extends BaseCampaign {
  donationCount: number
}

export interface PublicCampaignDetail extends PublicCampaign {
  recentDonations: { amountVnd: number; createdAt: string }[]
  disbursements: ReturnType<typeof transparency>['disbursements']
}

// Đang mở trước, sau đó theo tiến độ.
export function listCampaigns(): PublicCampaign[] {
  const ledger = transparency()
  return ledger.campaigns
    .map((c) => ({ ...c, donationCount: ledger.donations.filter((d) => d.campaignId === c.id).length }))
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'PUBLISHED' ? -1 : 1))
}

export function getCampaign(id: string): PublicCampaignDetail {
  const ledger = transparency()
  const campaign = ledger.campaigns.find((c) => c.id === id)
  // Bản nháp trả 404 giống như không tồn tại.
  if (!campaign) throw new ServiceError(404, 'NOT_FOUND')
  const donations = ledger.donations.filter((d) => d.campaignId === id)
  return {
    ...campaign,
    donationCount: donations.length,
    recentDonations: [...donations]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
      .map((d) => ({ amountVnd: d.amountVnd, createdAt: d.createdAt })),
    disbursements: ledger.disbursements.filter((d) => d.campaignId === id),
  }
}

// Biên lai riêng của người ủng hộ.
export interface DonationReceipt {
  id: string
  campaignId: string
  campaignTitle: LocalizedText
  amountVnd: number
  anonymous: boolean
  receipt: string
  createdAt: string
  simulated: true
}

export const MIN_DONATION_VND = 10_000
const KEY_PATTERN = /^[A-Za-z0-9_-]{8,100}$/

function titles() {
  return new Map(readRelief().campaigns.map((c) => [c.id, c.title]))
}

function toReceipt(d: ReturnType<typeof ownDonations>[number], names = titles()): DonationReceipt {
  return {
    id: d.id, campaignId: d.campaignId, campaignTitle: names.get(d.campaignId) ?? { vi: '—', en: '—' },
    amountVnd: d.amountVnd, anonymous: d.anonymous, receipt: d.receipt, createdAt: d.createdAt, simulated: true,
  }
}

// Chỉ tài khoản người dân ủng hộ (giữ tách vai). Phần ghi nhận, kiểm tra chiến dịch và idempotency
// do recordDonation làm trong một mutateRelief.
export function donate(user: SessionUser, input: unknown): { donation: DonationReceipt; replayed: boolean } {
  requireRole(user, 'appUser')
  const body = inputObject(input)
  if (typeof body.amountVnd === 'number' && Number.isSafeInteger(body.amountVnd) && body.amountVnd > 0 && body.amountVnd < MIN_DONATION_VND)
    throw new ServiceError(400, 'AMOUNT_TOO_SMALL')
  if (typeof body.idempotencyKey !== 'string' || !KEY_PATTERN.test(body.idempotencyKey))
    throw new ServiceError(400, 'INVALID_idempotencyKey')
  const replayed = readRelief().donations.some((d) => d.donorId === user.id && d.idempotencyKey === body.idempotencyKey)
  const d = recordDonation(user, {
    campaignId: body.campaignId, amountVnd: body.amountVnd, anonymous: body.anonymous, idempotencyKey: body.idempotencyKey,
  })
  const { idempotencyKey: _key, ...own } = d
  return { donation: toReceipt(own), replayed }
}

export function myDonations(user: SessionUser): DonationReceipt[] {
  requireRole(user, 'appUser')
  const names = titles()
  return ownDonations(user)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((d) => toReceipt(d, names))
}

export function myDonation(user: SessionUser, id: string): DonationReceipt {
  const found = myDonations(user).find((d) => d.id === id)
  // Biên lai của người khác trả 404, không xác nhận ID tồn tại.
  if (!found) throw new ServiceError(404, 'NOT_FOUND')
  return found
}
