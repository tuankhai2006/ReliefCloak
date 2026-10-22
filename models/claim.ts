// Hợp đồng chung của team: KHÔNG đổi nếu chưa báo cả nhóm.

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'

export type Role = 'field_worker' | 'org_admin' | 'auditor' | 'disburser'

export interface Approval {
  userId: string
  userName: string
  role: 'org_admin' | 'auditor'
  at: string
}

export interface Claim {
  id: string
  victimName: string
  region: string
  amount: number // VND
  gps: string // "16.4637, 107.5909"
  photoUrl: string // ảnh mẫu trong /public/photos
  description: string
  createdBy: string // userId của Field Worker
  createdByName: string
  createdAt: string
  // Ciphertext do doEncrypt tạo ra trên trình duyệt. Server không bao giờ thấy plaintext.
  encryptedBankAccount: string
  encryptedNationalId: string
  approvals: Approval[]
  status: ClaimStatus
  paidAt?: string
  paidBy?: string
}

// Body mà /claim/new gửi lên POST /api/claims
export type NewClaimInput = Pick<
  Claim,
  | 'victimName'
  | 'region'
  | 'amount'
  | 'gps'
  | 'photoUrl'
  | 'description'
  | 'encryptedBankAccount'
  | 'encryptedNationalId'
>

export const REQUIRED_APPROVER_ROLES: Approval['role'][] = ['org_admin', 'auditor']
