import { defineMessages } from '@/lib/i18n'

export const donationMsg = defineMessages({
  donateTitle: { vi: 'Ủng hộ chiến dịch', en: 'Support this campaign' },
  simulatedNote: {
    vi: 'Đây là ủng hộ mô phỏng. Không có tiền thật bị trừ, không cần thẻ hay tài khoản ngân hàng.',
    en: 'This is a simulated donation. No real money is charged and no card or bank details are needed.',
  },
  amount: { vi: 'Số tiền (VND)', en: 'Amount (VND)' },
  customAmount: { vi: 'Số khác', en: 'Other amount' },
  minAmount: { vi: 'Tối thiểu {min}', en: 'Minimum {min}' },
  anonymous: { vi: 'Ẩn tên tôi trên trang công khai', en: 'Hide my name on public pages' },
  anonymousHint: {
    vi: 'Bạn vẫn xem được biên lai trong lịch sử của mình.',
    en: 'You can still see the receipt in your own history.',
  },
  continue: { vi: 'Tiếp tục', en: 'Continue' },
  confirmTitle: { vi: 'Xác nhận ủng hộ mô phỏng', en: 'Confirm simulated donation' },
  confirmLine: { vi: 'Bạn sẽ ủng hộ {amount} cho “{campaign}”.', en: 'You are giving {amount} to “{campaign}”.' },
  publicName: { vi: 'Tên hiển thị công khai: {name}', en: 'Public name: {name}' },
  confirm: { vi: 'Xác nhận ủng hộ (mô phỏng)', en: 'Confirm donation (simulated)' },
  sending: { vi: 'Đang ghi nhận…', en: 'Recording…' },
  edit: { vi: 'Sửa lại', en: 'Edit' },
  invalidAmount: {
    vi: 'Nhập số nguyên VND từ {min} đến 10.000.000.000.',
    en: 'Enter a whole VND amount between {min} and 10,000,000,000.',
  },
  signInToDonate: { vi: 'Đăng nhập bằng tài khoản người dân để ủng hộ.', en: 'Sign in with a resident account to donate.' },
  staffCannotDonate: {
    vi: 'Tài khoản nội bộ không ủng hộ để giữ tách biệt vai trò. Hãy dùng tài khoản người dân.',
    en: 'Internal accounts do not donate, to keep roles separate. Use a resident account.',
  },
  closed: { vi: 'Chiến dịch đã đóng, không nhận ủng hộ mới.', en: 'This campaign is closed to new donations.' },
  // biên lai
  receiptTitle: { vi: 'Biên lai ủng hộ (mô phỏng)', en: 'Donation receipt (simulated)' },
  thankYou: { vi: 'Cảm ơn bạn! Khoản ủng hộ đã được ghi nhận.', en: 'Thank you! Your donation has been recorded.' },
  replayed: {
    vi: 'Yêu cầu này đã được ghi nhận trước đó. Đây là biên lai gốc, không có khoản ủng hộ thứ hai.',
    en: 'This request was already recorded. This is the original receipt; no second donation was made.',
  },
  receiptCode: { vi: 'Mã biên lai', en: 'Receipt code' },
  campaign: { vi: 'Chiến dịch', en: 'Campaign' },
  date: { vi: 'Thời gian', en: 'Date' },
  donor: { vi: 'Người ủng hộ', en: 'Donor' },
  visibility: { vi: 'Hiển thị công khai', en: 'Public visibility' },
  shownAnonymous: { vi: 'Ẩn danh', en: 'Anonymous' },
  shownName: { vi: 'Hiện tên', en: 'Name shown' },
  receiptDisclaimer: {
    vi: 'Biên lai mô phỏng cho demo, không có giá trị thanh toán hay khấu trừ thuế.',
    en: 'Simulated receipt for demo purposes; not a payment or tax document.',
  },
  print: { vi: 'In biên lai', en: 'Print receipt' },
  viewHistory: { vi: 'Lịch sử ủng hộ', en: 'Donation history' },
  viewCampaign: { vi: 'Về chiến dịch', en: 'Back to campaign' },
  receiptNotFound: { vi: 'Không tìm thấy biên lai này trong lịch sử của bạn.', en: 'This receipt is not in your history.' },
  // lịch sử
  historyTitle: { vi: 'Lịch sử ủng hộ', en: 'Donation history' },
  historySubtitle: { vi: 'Chỉ bạn xem được trang này.', en: 'Only you can see this page.' },
  noHistory: { vi: 'Bạn chưa ủng hộ chiến dịch nào.', en: 'You have not donated yet.' },
  findCampaign: { vi: 'Tìm chiến dịch', en: 'Find a campaign' },
  total: { vi: 'Tổng đã ủng hộ (mô phỏng)', en: 'Total given (simulated)' },
  count: { vi: 'Số lần ủng hộ', en: 'Donations' },
  receipt: { vi: 'Biên lai', en: 'Receipt' },
})

// Lỗi từ server có mã → câu dễ hiểu theo ngôn ngữ đang chọn.
export const apiErrorMsg = defineMessages({
  CAMPAIGN_NOT_OPEN: { vi: 'Chiến dịch đã đóng, không nhận ủng hộ mới.', en: 'This campaign is closed to new donations.' },
  IDEMPOTENCY_CONFLICT: { vi: 'Yêu cầu bị trùng. Hãy tải lại trang và thử lại.', en: 'Duplicate request. Reload the page and try again.' },
  AMOUNT_TOO_SMALL: { vi: 'Số tiền tối thiểu là 10.000 ₫.', en: 'The minimum amount is 10,000 ₫.' },
  STORE_BUSY: { vi: 'Hệ thống đang bận, hãy thử lại sau giây lát.', en: 'The system is busy, please try again in a moment.' },
  NOT_FOUND: { vi: 'Không tìm thấy dữ liệu.', en: 'Not found.' },
  FORBIDDEN: { vi: 'Tài khoản này không có quyền thực hiện thao tác.', en: 'This account is not allowed to do that.' },
  VALIDATION: { vi: 'Dữ liệu chưa hợp lệ, hãy kiểm tra lại.', en: 'Some input is invalid, please check it.' },
  UNAUTHORIZED: { vi: 'Hãy đăng nhập trước.', en: 'Please sign in first.' },
  NETWORK: { vi: 'Không kết nối được máy chủ. Hãy thử lại.', en: 'Could not reach the server. Please try again.' },
})
