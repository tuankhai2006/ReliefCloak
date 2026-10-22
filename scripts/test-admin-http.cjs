const assert = require('node:assert/strict')
const base = process.env.RELIEF_TEST_URL
if (!base || !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error('Set RELIEF_TEST_URL to an isolated local mock test server, e.g. http://127.0.0.1:3100')
// Identity = a signed token from the simulated TideCloak login (lib/simTide.ts), cached per user.
const tokens = {}
async function tokenFor(user) {
  if (!tokens[user]) {
    const r = await fetch(base + '/api/sim-tide/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user }) })
    assert.equal(r.status, 200, 'sim-tide login ' + user)
    tokens[user] = (await r.json()).accessToken
  }
  return tokens[user]
}
async function call(url, user, method = 'GET', body, status = 200) {
  const response = await fetch(base + url, { method, headers: { ...(user ? { Authorization: 'Bearer ' + (await tokenFor(user)) } : {}), 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) })
  const data = await response.json()
  assert.equal(response.status, status, `${method} ${url}: ${JSON.stringify(data)}`)
  return data
}
async function main() {
  assert.equal((await fetch(base + '/admin')).status, 200)
  assert.equal((await fetch(base + '/admin/not-a-page')).status, 404)
  await call('/api/admin/dashboard', null, 'GET', undefined, 401)
  await call('/api/admin/dashboard', 'resident-1', 'GET', undefined, 403)
  await call('/api/admin/reports', 'aud-1', 'GET', undefined, 403)
  await call('/api/admin/campaigns', 'org-1', 'POST', '{', 400)
  await call('/api/admin/campaigns', 'org-1', 'POST', null, 400)
  const report = await call('/api/reports', 'resident-1', 'POST', { region: 'HTTP test', description: 'PRIVATE HTTP fixture' })
  const otherReports = await call('/api/reports', 'resident-2')
  assert.equal(otherReports.some(r => r.id === report.id), false)
  await call('/api/admin/reports', 'org-1', 'PATCH', { id: report.id, status: 'VERIFYING', feedback: 'review' })
  await call('/api/admin/reports', 'org-1', 'PATCH', { id: report.id, status: 'ACCEPTED', feedback: 'accept' })
  const fields = { reportId: report.id, title: { vi: 'Thử nghiệm', en: 'Test' }, content: { vi: 'Công khai', en: 'Public' }, image: '/photos/flood-1.svg', targetVnd: 1000000 }
  await call('/api/admin/campaigns', 'resident-1', 'POST', fields, 403)
  const campaign = await call('/api/admin/campaigns', 'org-1', 'POST', fields)
  await call('/api/admin/campaigns', 'org-1', 'PATCH', { id: campaign.id, action: 'publish' })
  const proposal = await call('/api/admin/disbursements', 'org-1', 'POST', { campaignId: 'campaign-hue', amountVnd: 100, purpose: 'PRIVATE HTTP purpose', recipient: 'PRIVATE HTTP recipient' })
  await call('/api/admin/disbursements', 'off-1', 'PATCH', { id: proposal.id, action: 'execute', idempotencyKey: proposal.id }, 409)
  await call('/api/admin/disbursements', 'org-1', 'PATCH', { id: proposal.id, action: 'audit', decision: 'APPROVED', note: 'test' }, 403)
  await call('/api/admin/disbursements', 'aud-1', 'PATCH', { id: proposal.id, action: 'audit', decision: 'APPROVED', note: 'PRIVATE HTTP review' })
  await call('/api/admin/disbursements', 'off-1', 'PATCH', { id: proposal.id, action: 'execute', idempotencyKey: proposal.id })
  await call('/api/admin/disbursements', 'off-1', 'PATCH', { id: proposal.id, action: 'execute', idempotencyKey: proposal.id })
  const result = await call('/api/transparency')
  assert.equal(JSON.stringify(result).includes('PRIVATE HTTP'), false)
  assert.equal(result.disbursements.filter(d => d.id === proposal.id && d.status === 'PAID_SIMULATED').length, 1)
  console.log('PASS: HTTP pages, anonymous/forged-role denial, malformed input, private reports, admin campaign publication, independent audit, idempotent payout, public redaction')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
