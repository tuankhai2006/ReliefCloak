// Tests for the SIMULATED TideCloak (lib/simTide.ts): signed tokens, verification, forged/expired
// tokens, role claims, and IGA quorum for role changes. Uses an isolated data directory.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-tide-'))
process.env.RELIEF_DATA_DIR = dir

function loadTs(file) {
  const full = path.resolve(__dirname, '..', file)
  const { outputText } = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  })
  const m = new Module(full, module)
  m.filename = full
  m.paths = Module._nodeModulePaths(path.dirname(full))
  m._compile(outputText, full)
  return m.exports
}

const fails = (fn, status, message) =>
  assert.throws(fn, (e) => e.status === status && (!message || e.message === message), `expected ${status} ${message ?? ''}`)

try {
  const sim = loadTs('lib/simTide.ts')

  // ── Tokens: signed, Tide-shaped claims, verified ──
  const { accessToken } = sim.issueToken('org-1')
  const claims = sim.verifyToken(accessToken)
  assert.ok(claims, 'valid token verifies')
  assert.equal(claims.vuid, 'org-1')
  assert.equal(claims.iss, sim.SIM_ISSUER)
  assert.ok(sim.rolesOf(claims).includes('org_admin'))
  assert.ok(sim.rolesOf(claims).includes('tide-realm-admin'), 'realm admin is a client role')
  assert.deepEqual(claims.resource_access['realm-management'].roles, ['tide-realm-admin'])
  fails(() => sim.issueToken('nobody'), 404)

  // ── Forgery: changing roles in the payload breaks the signature ──
  const [h, p, s] = accessToken.split('.')
  const payload = JSON.parse(Buffer.from(p, 'base64url'))
  payload.realm_access.roles.push('disburser')
  assert.equal(sim.verifyToken(`${h}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${s}`), null, 'tampered roles rejected')
  // alg=none and garbage
  const none = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  assert.equal(sim.verifyToken(`${none}.${p}.`), null, 'alg none rejected')
  assert.equal(sim.verifyToken('not.a.token'), null)
  // expired
  const expired = { ...JSON.parse(Buffer.from(p, 'base64url')), exp: 1 }
  assert.equal(sim.verifyToken(`${h}.${Buffer.from(JSON.stringify(expired)).toString('base64url')}.${s}`), null, 'expired rejected')

  // ── IGA: quorum = max(1, floor(0.7 * admins)); seed has 3 admins → 2 ──
  assert.equal(sim.quorumFor(1), 1)
  assert.equal(sim.quorumFor(2), 1)
  assert.equal(sim.quorumFor(3), 2)
  const snap = sim.governanceSnapshot('org-1')
  assert.equal(snap.admins, 3)
  assert.equal(snap.threshold, 2)
  fails(() => sim.governanceSnapshot('off-1'), 403, 'REALM_ADMIN_REQUIRED')
  fails(() => sim.requestRoleChange('resident-1', { userId: 'resident-1', role: 'disburser', action: 'grant' }), 403)

  // An admin tries to give HIMSELF payout powers: requesting and self-authorizing is not enough.
  const self = sim.requestRoleChange('org-1', { userId: 'org-1', role: 'disburser', action: 'grant' })
  assert.equal(self.status, 'PENDING')
  sim.decideRoleChange('org-1', self.id, 'approve')
  fails(() => sim.decideRoleChange('org-1', self.id, 'approve'), 409, 'ALREADY_AUTHORIZED')
  assert.equal(sim.governanceSnapshot('org-1').changeRequests[0].status, 'PENDING', 'one admin cannot commit alone')
  assert.ok(!sim.rolesOf(sim.verifyToken(sim.issueToken('org-1').accessToken)).includes('disburser'), 'no role before quorum')
  // A second admin denies it.
  sim.decideRoleChange('aud-1', self.id, 'deny')
  fails(() => sim.decideRoleChange('gov-1', self.id, 'approve'), 409, 'NOT_PENDING')

  // Proper path: grant disburser to a new officer with two independent admins.
  fails(() => sim.requestRoleChange('org-1', { userId: 'off-1', role: 'disburser', action: 'grant' }), 409, 'NO_CHANGE')
  fails(() => sim.requestRoleChange('org-1', { userId: 'off-2', role: 'root', action: 'grant' }), 400)
  const grant = sim.requestRoleChange('org-1', { userId: 'off-2', role: 'disburser', action: 'grant' })
  fails(() => sim.requestRoleChange('aud-1', { userId: 'off-2', role: 'disburser', action: 'grant' }), 409, 'ALREADY_PENDING')
  assert.ok(!sim.rolesOf(sim.verifyToken(sim.issueToken('off-2').accessToken)).includes('disburser'))
  sim.decideRoleChange('aud-1', grant.id, 'approve')
  sim.decideRoleChange('gov-1', grant.id, 'approve')
  assert.equal(sim.governanceSnapshot('gov-1').changeRequests.find((c) => c.id === grant.id).status, 'APPROVED')
  assert.ok(sim.rolesOf(sim.verifyToken(sim.issueToken('off-2').accessToken)).includes('disburser'), 'role in new token after quorum')

  // Revoking realm admin also needs quorum, and the threshold shrinks with fewer admins.
  const revoke = sim.requestRoleChange('gov-1', { userId: 'gov-1', role: 'tide-realm-admin', action: 'revoke' })
  sim.decideRoleChange('gov-1', revoke.id, 'approve')
  sim.decideRoleChange('org-1', revoke.id, 'approve')
  assert.equal(sim.governanceSnapshot('org-1').admins, 2)
  assert.equal(sim.governanceSnapshot('org-1').threshold, 1)

  console.log('PASS: signed Tide-shaped tokens, forged/alg-none/expired rejected, client-role admin, quorum formula, self-grant blocked below quorum, deny, grant after quorum, revoke')
} finally {
  fs.rmSync(dir, { recursive: true, force: true })
}
