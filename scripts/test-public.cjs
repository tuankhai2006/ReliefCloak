// Kiểm tra phần của Khai trên store chung: API chiến dịch công khai, ủng hộ mô phỏng, biên lai, report mở rộng.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

// Store riêng cho test, không đụng dữ liệu demo.
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'relief-public-'))
const load = require('./service-test-loader.cjs')(directory)
const community = load('services/communityService.ts')
const relief = load('services/reliefService.ts')
const pub = load('services/publicService.ts')

const resident = { id: 'res-1', name: 'An', roles: ['appUser'] }
const other = { id: 'res-2', name: 'Bình', roles: ['appUser'] }
const admin = { id: 'adm', name: 'Minh', roles: ['org_admin'] }
const officer = { id: 'off', name: 'Tuấn', roles: ['disburser'] }
const fails = (fn, status, message) =>
  assert.throws(fn, (e) => e.status === status && (!message || e.message === message), `expected ${status} ${message ?? ''}`)

try {
  // ── Report mở rộng: needs/urgency/image hợp lệ, giá trị lạ bị chặn ──
  fails(() => community.submitReport(resident, { region: 'Huế', description: 'x', needs: ['gold'] }), 400, 'INVALID_needs')
  fails(() => community.submitReport(resident, { region: 'Huế', description: 'x', urgency: 'PANIC' }), 400, 'INVALID_urgency')
  fails(() => community.submitReport(resident, { region: 'Huế', description: 'x', image: 'https://evil/x.png' }), 400, 'INVALID_image')
  const report = community.submitReport(resident, {
    region: 'Huế', description: 'PRIVATE-REPORT-BODY', needs: ['food', 'water', 'food'], urgency: 'URGENT', image: '/photos/rescue-boat.svg',
  })
  assert.equal(report.needs, 'food,water')
  assert.equal(report.urgency, 'URGENT')
  assert.equal(community.reportsFor(other).length, 0)

  // ── Admin tạo và publish chiến dịch (luồng của Khoa) ──
  const campaignFor = (r) => {
    relief.reviewReport(admin, r.id, { status: 'VERIFYING', feedback: 'checking' })
    relief.reviewReport(admin, r.id, { status: 'ACCEPTED', feedback: 'ok' })
    return relief.createCampaign(admin, {
      reportId: r.id, title: { vi: 'Hỗ trợ Huế', en: 'Hue relief' }, content: { vi: 'Nội dung', en: 'Content' },
      image: '/photos/flood-1.svg', targetVnd: 10_000_000,
    })
  }
  const open = campaignFor(report)
  const draft = campaignFor(community.submitReport(other, { region: 'Quảng Trị', description: 'y' }))
  relief.updateCampaign(admin, open.id, { action: 'publish' })

  // ── Public: chỉ PUBLISHED/CLOSED ──
  assert.equal(JSON.stringify(pub.listCampaigns().map((c) => c.id)), JSON.stringify([open.id]))
  fails(() => pub.getCampaign(draft.id), 404)
  fails(() => pub.getCampaign('missing'), 404)

  // ── Ủng hộ: vai trò, số tiền, key ──
  const base = { campaignId: open.id, amountVnd: 200_000, anonymous: false, idempotencyKey: 'key-0001' }
  fails(() => pub.donate(admin, base), 403)
  fails(() => pub.donate(officer, base), 403)
  fails(() => pub.donate(resident, { ...base, amountVnd: 5_000 }), 400, 'AMOUNT_TOO_SMALL')
  for (const amountVnd of [0, -5, 1.5, '200000']) fails(() => pub.donate(resident, { ...base, amountVnd }), 400)
  fails(() => pub.donate(resident, { ...base, idempotencyKey: 'x' }), 400, 'INVALID_idempotencyKey')
  fails(() => pub.donate(resident, { ...base, anonymous: 'yes' }), 400)
  fails(() => pub.donate(resident, { ...base, campaignId: draft.id }), 409, 'CAMPAIGN_NOT_OPEN')

  // ── Idempotency: lặp lại → đúng một biên lai ──
  const first = pub.donate(resident, { ...base, donorId: 'spoofed', receipt: 'FAKE' })
  assert.equal(first.replayed, false)
  assert.notEqual(first.donation.receipt, 'FAKE')
  assert.equal(first.donation.campaignTitle.en, 'Hue relief')
  const again = pub.donate(resident, base)
  assert.equal(again.replayed, true)
  assert.equal(again.donation.id, first.donation.id)
  fails(() => pub.donate(resident, { ...base, amountVnd: 300_000 }), 409, 'IDEMPOTENCY_CONFLICT')
  pub.donate(other, { ...base, amountVnd: 500_000, anonymous: true })

  // ── Lịch sử & biên lai riêng ──
  assert.equal(pub.myDonations(resident).length, 1)
  assert.equal(pub.myDonation(resident, first.donation.id).receipt, first.donation.receipt)
  fails(() => pub.myDonation(other, first.donation.id), 404)
  fails(() => pub.myDonations(admin), 403)
  assert.equal(JSON.stringify(pub.myDonations(resident)).includes('key-0001'), false)

  // ── Số dư công khai và không lộ dữ liệu riêng ──
  const detail = pub.getCampaign(open.id)
  assert.equal(detail.receivedVnd, 700_000)
  assert.equal(detail.donationCount, 2)
  const json = JSON.stringify([pub.listCampaigns(), detail])
  for (const secret of ['PRIVATE-REPORT-BODY', 'res-1', 'res-2', 'adm', 'reportId', 'createdBy', 'key-0001', 'donorId', 'Bình'])
    assert.equal(json.includes(secret), false, `public campaign data leaks ${secret}`)

  // ── Chiến dịch đóng: không nhận mới, lặp lại yêu cầu cũ vẫn trả biên lai cũ ──
  relief.updateCampaign(admin, open.id, { action: 'close' })
  fails(() => pub.donate(resident, { ...base, idempotencyKey: 'key-0002' }), 409, 'CAMPAIGN_NOT_OPEN')
  assert.equal(pub.donate(resident, base).replayed, true)
  assert.equal(pub.getCampaign(open.id).status, 'CLOSED')

  console.log('PASS: report fields, public campaign allowlist, draft hidden, donation roles/validation, idempotent receipts, private history, closed campaign')
} finally {
  fs.rmSync(directory, { recursive: true, force: true })
}
