import { defineMessages } from '@/lib/i18n'

export const ledgerMsg = defineMessages({
  title: { vi: 'Sổ minh bạch công khai', en: 'Public transparency ledger' },
  subtitle: {
    vi: 'Mọi khoản ủng hộ và giải ngân (mô phỏng) theo từng chiến dịch. Không hiển thị nội dung report, người nhận hay số tài khoản.',
    en: 'Every simulated donation and payout, per campaign. Report contents, recipients and account numbers are never shown.',
  },
  raised: { vi: 'Tổng nhận', en: 'Total raised' },
  paid: { vi: 'Đã giải ngân', en: 'Paid out' },
  reserved: { vi: 'Đã duyệt, chờ chi', en: 'Approved, not yet paid' },
  available: { vi: 'Còn khả dụng', en: 'Available' },
  balanceRule: {
    vi: 'Còn khả dụng = Tổng nhận − Đã giải ngân. Khi chi, hệ thống kiểm tra lại số dư. Tính lại từ từng bản ghi, không lưu tổng riêng.',
    en: 'Available = Raised − Paid out. The balance is rechecked when a payout is executed. Recomputed from individual records, never stored as a total.',
  },
  byCampaign: { vi: 'Theo chiến dịch', en: 'By campaign' },
  campaign: { vi: 'Chiến dịch', en: 'Campaign' },
  status: { vi: 'Trạng thái', en: 'Status' },
  payouts: { vi: 'Các khoản giải ngân', en: 'Payouts' },
  payoutsHint: {
    vi: 'Mỗi khoản cần: admin đề xuất → kiểm toán viên độc lập duyệt → cán bộ giải ngân thứ ba thực hiện.',
    en: 'Each payout needs: admin proposal → independent auditor approval → a third person, the officer, executes it.',
  },
  noPayouts: { vi: 'Chưa có đề xuất giải ngân.', en: 'No payout proposals yet.' },
  transferRef: { vi: 'Mã chuyển (mô phỏng)', en: 'Transfer ref (simulated)' },
  donations: { vi: 'Các khoản ủng hộ', en: 'Donations' },
  noDonations: { vi: 'Chưa có lượt ủng hộ.', en: 'No donations yet.' },
  donor: { vi: 'Người ủng hộ', en: 'Donor' },
  amount: { vi: 'Số tiền', en: 'Amount' },
  date: { vi: 'Thời gian', en: 'Date' },
  anonymous: { vi: 'Ẩn danh', en: 'Anonymous' },
  donorsHidden: {
    vi: 'Chỉ công khai số tiền và thời gian; danh tính người ủng hộ không bao giờ hiển thị.',
    en: 'Only amounts and times are public; donor identities are never shown.',
  },
  allCampaigns: { vi: 'Tất cả chiến dịch', en: 'All campaigns' },
  filter: { vi: 'Lọc theo chiến dịch', en: 'Filter by campaign' },
  limits: {
    vi: 'Giới hạn hiện tại: dữ liệu lưu trong file của ứng dụng; nhật ký và phê duyệt chưa được ký bằng TideCloak nên chưa chống giả mạo ở mức mật mã.',
    en: 'Current limits: data lives in an application file; approvals and logs are not yet signed with TideCloak, so they are not cryptographically tamper-proof.',
  },
})
