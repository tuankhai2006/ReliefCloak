const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

// Isolated store: never writes to the app's demo data.
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'relief-community-'))
fs.mkdirSync(path.join(directory, 'data'))
const s = require('./service-test-loader.cjs')(directory)('services/communityService.ts')
const resident = { id: 'one', name: 'Resident', roles: ['appUser'] }
const other = { id: 'two', name: 'Other', roles: ['appUser'] }
const admin = { id: 'admin', name: 'Admin', roles: ['org_admin'] }
const fails = (fn, status) => assert.throws(fn, error => error.status === status)
try {
  fails(() => s.submitReport(resident, { region: '', description: 'Need help' }), 400)
  const report = s.submitReport(resident, { region: 'Hue', description: 'PRIVATE report', createdBy: 'spoofed' })
  assert.equal(report.createdBy, resident.id)
  assert.equal(s.reportsFor(other).length, 0)
  assert.equal(s.reportsFor(resident).length, 1)
  assert.equal(s.reportsFor(admin).length, 1)
  assert.equal(s.publicPosts().length, 0)
  const draft = { reportId: report.id, title: 'Relief update', content: 'Reviewed public text' }
  fails(() => s.publishPost(resident, draft), 403)
  fails(() => s.publishPost({ ...other, roles: ['auditor', 'disburser'] }, draft), 403)
  fails(() => s.publishPost(admin, { ...draft, reportId: 'missing' }), 404)
  s.publishPost(admin, draft)
  fails(() => s.publishPost(admin, draft), 409)
  const output = JSON.stringify(s.publicPosts())
  assert.equal(output.includes('PRIVATE report'), false)
  assert.equal(output.includes('createdBy'), false)
  assert.equal(s.publicPosts().length, 1)
  console.log('PASS: report privacy, validation, author identity, admin-only publication, duplicate prevention, public projection')
} finally {
  fs.rmSync(directory, { recursive: true, force: true })
}
