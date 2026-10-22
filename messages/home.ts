import { defineMessages } from '@/lib/i18n'

export const homeMsg = defineMessages({
  heroTitle: { vi: 'Cứu trợ đến đúng người, không ai nắm quyền một mình', en: 'Relief that reaches the right people, with no single point of control' },
  heroText: {
    vi: 'Người dân báo cáo nhu cầu, admin công bố chiến dịch, nhà hảo tâm ủng hộ. Mỗi khoản chi cần người đề xuất, kiểm toán viên độc lập và cán bộ giải ngân là ba người khác nhau.',
    en: 'Residents report needs, admins publish campaigns, donors give. Every payout needs a proposer, an independent auditor and a disbursement officer: three different people.',
  },
  ctaDonate: { vi: 'Xem chiến dịch', en: 'Browse campaigns' },
  ctaReport: { vi: 'Gửi report', en: 'Report a need' },
  ctaLedger: { vi: 'Sổ minh bạch', en: 'Transparency ledger' },
  metricsTitle: { vi: 'Số liệu demo', en: 'Demo figures' },
  raised: { vi: 'Đã nhận (mô phỏng)', en: 'Raised (simulated)' },
  paid: { vi: 'Đã giải ngân (mô phỏng)', en: 'Paid out (simulated)' },
  campaigns: { vi: 'Chiến dịch công khai', en: 'Public campaigns' },
  donations: { vi: 'Lượt ủng hộ', en: 'Donations' },
  featured: { vi: 'Chiến dịch đang cần ủng hộ', en: 'Campaigns needing support' },
  seeAll: { vi: 'Xem tất cả →', en: 'See all →' },
  howTitle: { vi: 'Cách hoạt động', en: 'How it works' },
  how1t: { vi: '1. Người dân báo cáo', en: '1. Residents report' },
  how1: { vi: 'Report riêng tư: chỉ người gửi và admin tổ chức xem được.', en: 'Private reports: only the author and organization admins can read them.' },
  how2t: { vi: '2. Admin công bố chiến dịch', en: '2. Admins publish campaigns' },
  how2: { vi: 'Nội dung công khai được viết riêng, không lộ thông tin người báo cáo.', en: 'Public text is written separately and never exposes the reporter.' },
  how3t: { vi: '3. Ủng hộ có biên lai', en: '3. Donations with receipts' },
  how3: { vi: 'Mỗi lượt ủng hộ có đúng một biên lai, kể cả khi bấm gửi nhiều lần.', en: 'Every donation gets exactly one receipt, even if you press submit twice.' },
  how4t: { vi: '4. Giải ngân ba bên', en: '4. Three-party payouts' },
  how4: { vi: 'Đề xuất → kiểm toán độc lập → giải ngân, mọi bước đều công khai.', en: 'Proposal → independent audit → payout, every step published.' },
  trustTitle: { vi: 'Vì sao cần TideCloak?', en: 'Why TideCloak?' },
  trustText: {
    vi: 'Ở hệ thống thường, một admin có thể tự cấp quyền rồi tự chi tiền. ReliefCloak tách vai trò và dùng TideCloak để việc cấp quyền nhạy cảm cần nhiều người duyệt. Phần duyệt từng khoản chi hiện là kiểm tra trong ứng dụng, chưa phải chữ ký Tide.',
    en: 'In a normal system one admin can grant themselves permissions and pay out alone. ReliefCloak separates roles and uses TideCloak so sensitive role changes need several approvers. Per-payout approval is currently an in-app check, not yet a Tide signature.',
  },
})
