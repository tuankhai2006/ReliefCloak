import { defineMessages } from '@/lib/i18n'

export const reportMsg = defineMessages({
  title: { vi: 'Báo cáo nhu cầu cứu trợ', en: 'Report a relief need' },
  subtitle: {
    vi: 'Report là riêng tư: chỉ bạn và admin tổ chức xem được. Report không tự xuất hiện công khai.',
    en: 'Reports are private: only you and organization admins can read them. Reports never become public automatically.',
  },
  privacyWarn: {
    vi: 'Đây là demo: dùng dữ liệu giả, không nhập CCCD, số tài khoản hay số điện thoại thật.',
    en: 'This is a demo: use made-up data; do not enter real ID numbers, bank accounts or phone numbers.',
  },
  formTitle: { vi: 'Gửi report mới', en: 'New report' },
  region: { vi: 'Khu vực (xã, huyện, tỉnh)', en: 'Location (commune, district, province)' },
  regionPh: { vi: 'Ví dụ: Phong Điền, Huế', en: 'e.g. Phong Dien, Hue' },
  needs: { vi: 'Cần hỗ trợ gì?', en: 'What is needed?' },
  urgency: { vi: 'Mức độ khẩn cấp', en: 'Urgency' },
  description: { vi: 'Mô tả tình hình', en: 'Describe the situation' },
  descriptionPh: {
    vi: 'Bao nhiêu hộ bị ảnh hưởng, thiếu gì, đường vào có bị chia cắt không…',
    en: 'How many households are affected, what is missing, is access cut off…',
  },
  descriptionHint: { vi: 'Nội dung được giữ nguyên ngôn ngữ bạn viết.', en: 'Your text is kept in the language you write it in.' },
  image: { vi: 'Ảnh minh họa (tùy chọn)', en: 'Illustration (optional)' },
  noImage: { vi: 'Không chọn ảnh', en: 'No image' },
  submit: { vi: 'Gửi report riêng tư', en: 'Send private report' },
  sending: { vi: 'Đang gửi…', en: 'Sending…' },
  sent: { vi: 'Đã gửi. Admin sẽ xem xét và phản hồi tại đây.', en: 'Sent. An admin will review it and reply here.' },
  regionRequired: { vi: 'Hãy nhập khu vực (tối đa 160 ký tự).', en: 'Please enter a location (max 160 characters).' },
  descriptionRequired: { vi: 'Hãy mô tả tình hình (tối đa 3000 ký tự).', en: 'Please describe the situation (max 3000 characters).' },
  myReports: { vi: 'Report của tôi', en: 'My reports' },
  noReports: { vi: 'Bạn chưa gửi report nào.', en: 'You have not sent any reports yet.' },
  feedback: { vi: 'Phản hồi của admin', en: 'Admin feedback' },
  noFeedback: { vi: 'Chưa có phản hồi.', en: 'No feedback yet.' },
  sentAt: { vi: 'Gửi lúc {date}', en: 'Sent {date}' },
  tlSent: { vi: 'Đã gửi', en: 'Sent' },
  tlVerifying: { vi: 'Đang xác minh', en: 'Verifying' },
  tlDecided: { vi: 'Đã quyết định', en: 'Decided' },
  staffNote: {
    vi: 'Bạn đang dùng tài khoản nội bộ. Xem và duyệt report ở khu Quản trị.',
    en: 'You are using an internal account. Review reports in the Admin area.',
  },
})

export const dashboardMsg = defineMessages({
  hello: { vi: 'Xin chào, {name}', en: 'Hello, {name}' },
  subtitle: { vi: 'Report, ủng hộ và biên lai của bạn ở cùng một chỗ.', en: 'Your reports, donations and receipts in one place.' },
  newReport: { vi: 'Gửi report', en: 'Send a report' },
  donate: { vi: 'Ủng hộ chiến dịch', en: 'Donate to a campaign' },
  history: { vi: 'Lịch sử ủng hộ', en: 'Donation history' },
  recentReports: { vi: 'Report gần đây', en: 'Recent reports' },
  recentDonations: { vi: 'Ủng hộ gần đây', en: 'Recent donations' },
  seeAll: { vi: 'Xem tất cả →', en: 'See all →' },
  reportsOpen: { vi: 'Report đang xử lý', en: 'Reports in progress' },
  totalGiven: { vi: 'Đã ủng hộ (mô phỏng)', en: 'Given (simulated)' },
  receipts: { vi: 'Biên lai', en: 'Receipts' },
})
