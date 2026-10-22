import type { ClaimStatus } from '@/models/claim'

const STYLE: Record<ClaimStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

const LABEL: Record<ClaimStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đủ chữ ký',
  PAID: 'Đã giải ngân',
  REJECTED: 'Từ chối',
}

export default function StatusBadge({ status }: { status: ClaimStatus }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${STYLE[status]}`}>{LABEL[status]}</span>
}
