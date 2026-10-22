// Luật nghiệp vụ. Không đụng UI, không giải mã.
import { claimRepo } from '@/models/db'
import { REQUIRED_APPROVER_ROLES, type Claim, type NewClaimInput } from '@/models/claim'
import type { SessionUser } from '@/lib/auth'

export class ServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// Ciphertext hợp lệ: chuỗi do doEncrypt tạo ra (mock thì có tiền tố MOCK:).
// Không chặn được 100% giả mạo; chặn thật là ở bước giải mã (Tide từ chối).
export function looksEncrypted(value: string): boolean {
  if (!value || value.length < 16) return false
  if (value.startsWith('MOCK:')) return true
  return /^[A-Za-z0-9+/=_-]+$/.test(value) && !/^\d+$/.test(value)
}

export function listClaims(): Claim[] {
  return claimRepo.all()
}

export function createClaim(user: SessionUser, input: NewClaimInput): Claim {
  if (!user.roles.includes('field_worker')) throw new ServiceError(403, 'Chỉ Field Worker được tạo claim')
  if (!looksEncrypted(input.encryptedBankAccount) || !looksEncrypted(input.encryptedNationalId))
    throw new ServiceError(400, 'STK/CCCD phải được mã hóa trên trình duyệt trước khi gửi')
  if (!(input.amount > 0)) throw new ServiceError(400, 'Số tiền không hợp lệ')

  const claim: Claim = {
    ...input,
    id: 'c-' + Date.now(),
    createdBy: user.id,
    createdByName: user.name,
    createdAt: new Date().toISOString(),
    approvals: [],
    status: 'PENDING',
  }
  claimRepo.insert(claim)
  return claim
}

export function approveClaim(user: SessionUser, id: string): Claim {
  const claim = claimRepo.get(id)
  if (!claim) throw new ServiceError(404, 'Không tìm thấy claim')

  const role = REQUIRED_APPROVER_ROLES.find((r) => user.roles.includes(r))
  if (!role) throw new ServiceError(403, 'Chỉ Chủ quỹ hoặc Auditor được duyệt')
  if (claim.status !== 'PENDING') throw new ServiceError(409, 'Claim không còn chờ duyệt')
  if (claim.createdBy === user.id) throw new ServiceError(409, 'Không được tự duyệt claim của mình')
  if (claim.approvals.some((a) => a.userId === user.id || a.role === role))
    throw new ServiceError(409, 'Vai trò này đã duyệt claim')

  claim.approvals.push({ userId: user.id, userName: user.name, role, at: new Date().toISOString() })
  if (REQUIRED_APPROVER_ROLES.every((r) => claim.approvals.some((a) => a.role === r))) claim.status = 'APPROVED'
  claimRepo.update(claim)
  return claim
}

export function releaseClaim(user: SessionUser, id: string): Claim {
  const claim = claimRepo.get(id)
  if (!claim) throw new ServiceError(404, 'Không tìm thấy claim')
  if (!user.roles.includes('disburser')) throw new ServiceError(403, 'Chỉ Officer được giải ngân')
  if (claim.status !== 'APPROVED') throw new ServiceError(409, 'Claim chưa đủ 2 chữ ký duyệt')

  claim.status = 'PAID'
  claim.paidAt = new Date().toISOString()
  claim.paidBy = user.name
  claimRepo.update(claim)
  return claim
}
