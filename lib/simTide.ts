// SIMULATED TideCloak (server only). Used while the live Tide network is unreachable.
// Mirrors the shape of a real TideCloak realm so the app code paths stay the same:
//   - Tokens are EdDSA-signed JWTs with Tide claims (vuid, tideuserkey, realm_access, resource_access).
//     Real TideCloak signs with a threshold key split across ORKs; here ONE local Ed25519 key stands in.
//   - tide-realm-admin is a client role on 'realm-management', like the real realm.
//   - Role changes are IGA change requests that commit only at quorum max(1, floor(0.7 * admins)).
// What this does NOT give you: no one here is cryptographically prevented from editing data/sim-*.json
// or the key file. See docs/TIDE_INTEGRATION.md for how each piece maps to the real TideCloak.
import { createPrivateKey, createPublicKey, generateKeyPairSync, randomUUID, sign, verify, type KeyObject } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const SIM_REALM = 'reliefcloak'
export const SIM_ISSUER = `http://localhost:8081/realms/${SIM_REALM}`
export const SIM_CLIENT = 'myclient'
export const ADMIN_CLIENT = 'realm-management'
export const REALM_ADMIN_ROLE = 'tide-realm-admin'
const TOKEN_LIFESPAN_S = 600 // same as accessTokenLifespan in init/realm.json

export const APP_ROLES = ['appUser', 'org_admin', 'auditor', 'disburser'] as const
export const GOVERNED_ROLES = [...APP_ROLES, REALM_ADMIN_ROLE] as const
export type GovernedRole = (typeof GOVERNED_ROLES)[number]

export interface SimUser {
  id: string // vuid
  username: string
  name: string
  realmRoles: string[]
  clientRoles: Record<string, string[]>
}

export type ChangeStatus = 'PENDING' | 'APPROVED' | 'DENIED'
export interface ChangeRequest {
  id: string
  entityType: 'USER'
  actionType: 'GRANT_ROLES' | 'REVOKE_ROLES'
  userId: string
  role: GovernedRole
  requestedBy: string
  requestedByName: string
  requestedAt: string
  approvals: { adminId: string; adminName: string; at: string }[]
  threshold: number // frozen when the request is created
  status: ChangeStatus
  decidedAt: string | null
  deniedBy: string | null
}

interface Realm {
  users: SimUser[]
  changeRequests: ChangeRequest[]
}

export class SimTideError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const dir = () => process.env.RELIEF_DATA_DIR || path.join(process.cwd(), 'data')
const realmFile = () => path.join(dir(), 'sim-realm.json')
const keyFile = () => path.join(dir(), 'sim-tide-key.json')

// Demo identities. IDs match lib/demoUsers.ts so existing relief data keeps its owners.
function seedUsers(): SimUser[] {
  const u = (id: string, username: string, name: string, realmRoles: string[], admin = false): SimUser => ({
    id, username, name, realmRoles, clientRoles: admin ? { [ADMIN_CLIENT]: [REALM_ADMIN_ROLE] } : {},
  })
  return [
    u('resident-1', 'an', 'An (Người dân)', ['appUser']),
    u('resident-2', 'binh', 'Bình (Người dân)', ['appUser']),
    u('org-1', 'minh', 'Minh (Chủ quỹ)', ['org_admin'], true),
    u('aud-1', 'ha', 'Hà (Auditor)', ['auditor'], true),
    u('gov-1', 'quang', 'Quang (Realm admin)', [], true),
    u('off-1', 'tuan', 'Tuấn (Officer)', ['disburser']),
    u('off-2', 'long', 'Long (New officer)', []),
  ]
}

function readRealm(): Realm {
  if (!fs.existsSync(realmFile())) return { users: seedUsers(), changeRequests: [] }
  return JSON.parse(fs.readFileSync(realmFile(), 'utf8'))
}

function writeRealm(realm: Realm) {
  fs.mkdirSync(dir(), { recursive: true })
  const tmp = realmFile() + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(realm, null, 2))
  fs.renameSync(tmp, realmFile())
}

export function resetSimRealm() {
  writeRealm({ users: seedUsers(), changeRequests: [] })
}

// One Ed25519 key per checkout, created on first use. Stands in for Tide's threshold VVK.
let cachedKey: { privateKey: KeyObject; publicKey: KeyObject; kid: string } | null = null
function signingKey() {
  if (cachedKey) return cachedKey
  let stored: { privatePem: string; kid: string }
  if (fs.existsSync(keyFile())) stored = JSON.parse(fs.readFileSync(keyFile(), 'utf8'))
  else {
    const { privateKey } = generateKeyPairSync('ed25519')
    stored = { privatePem: privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(), kid: randomUUID() }
    fs.mkdirSync(dir(), { recursive: true })
    fs.writeFileSync(keyFile(), JSON.stringify(stored))
  }
  const privateKey = createPrivateKey(stored.privatePem)
  cachedKey = { privateKey, publicKey: createPublicKey(privateKey), kid: stored.kid }
  return cachedKey
}

export function publicJwk() {
  const { publicKey, kid } = signingKey()
  return { ...publicKey.export({ format: 'jwk' }), kid, alg: 'EdDSA', use: 'sig' }
}

const b64url = (input: Buffer | string) => Buffer.from(input).toString('base64url')

// ── Sign-in ──
// In real TideCloak the user proves their password to the ORKs inside the Tide enclave and the
// threshold network signs the token. Here selecting a demo account is the simulated "enclave login".
export function issueToken(userId: string) {
  const user = readRealm().users.find((u) => u.id === userId)
  if (!user) throw new SimTideError(404, 'UNKNOWN_USER')
  const now = Math.floor(Date.now() / 1000)
  const { privateKey, kid } = signingKey()
  const header = { alg: 'EdDSA', typ: 'JWT', kid }
  const payload = {
    iss: SIM_ISSUER, azp: SIM_CLIENT, aud: SIM_CLIENT, sub: user.id, typ: 'Bearer',
    iat: now, exp: now + TOKEN_LIFESPAN_S, jti: randomUUID(),
    vuid: user.id, tideuserkey: `sim-${user.id}`, preferred_username: user.username, name: user.name,
    realm_access: { roles: [...user.realmRoles, '_tide_enabled', `default-roles-${SIM_REALM}`] },
    resource_access: Object.fromEntries(Object.entries(user.clientRoles).map(([c, roles]) => [c, { roles }])),
    simulated: true,
  }
  const body = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const signature = sign(null, Buffer.from(body), privateKey)
  return { accessToken: `${body}.${b64url(signature)}`, expiresIn: TOKEN_LIFESPAN_S }
}

export interface VerifiedClaims {
  vuid: string
  preferred_username: string
  name: string
  realm_access: { roles: string[] }
  resource_access: Record<string, { roles: string[] }>
  exp: number
}

// Same checks a real server does with verifyTideCloakToken: signature with the realm key,
// algorithm, issuer, authorized party and expiry. Returns null on any failure.
export function verifyToken(token: string): VerifiedClaims | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString())
    if (header.alg !== 'EdDSA' || header.kid !== signingKey().kid) return null
    const ok = verify(null, Buffer.from(`${parts[0]}.${parts[1]}`), signingKey().publicKey, Buffer.from(parts[2], 'base64url'))
    if (!ok) return null
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    if (claims.iss !== SIM_ISSUER || claims.azp !== SIM_CLIENT) return null
    if (typeof claims.exp !== 'number' || claims.exp <= Math.floor(Date.now() / 1000)) return null
    if (typeof claims.vuid !== 'string' || !Array.isArray(claims.realm_access?.roles)) return null
    return claims
  } catch {
    return null
  }
}

// Flattened role list the app checks: realm roles plus client roles (tide-realm-admin lives on realm-management).
export function rolesOf(claims: Pick<VerifiedClaims, 'realm_access' | 'resource_access'>): string[] {
  return [...claims.realm_access.roles, ...Object.values(claims.resource_access ?? {}).flatMap((c) => c.roles)]
}

// ── Directory for the simulated sign-in screen (no secrets: the real login has passwords in the enclave) ──
export function listAccounts() {
  return readRealm().users.map((u) => ({ id: u.id, name: u.name, username: u.username, roles: [...u.realmRoles, ...Object.values(u.clientRoles).flat()] }))
}

// ── IGA: governed role changes ──
const isRealmAdmin = (u: SimUser) => (u.clientRoles[ADMIN_CLIENT] ?? []).includes(REALM_ADMIN_ROLE)
export const quorumFor = (admins: number) => Math.max(1, Math.floor(admins * 0.7))

function requireRealmAdmin(realm: Realm, actorId: string): SimUser {
  const actor = realm.users.find((u) => u.id === actorId)
  if (!actor || !isRealmAdmin(actor)) throw new SimTideError(403, 'REALM_ADMIN_REQUIRED')
  return actor
}

function hasRole(u: SimUser, role: GovernedRole) {
  return role === REALM_ADMIN_ROLE ? isRealmAdmin(u) : u.realmRoles.includes(role)
}

function applyChange(realm: Realm, cr: ChangeRequest) {
  const user = realm.users.find((u) => u.id === cr.userId)!
  if (cr.role === REALM_ADMIN_ROLE) {
    const current = new Set(user.clientRoles[ADMIN_CLIENT] ?? [])
    cr.actionType === 'GRANT_ROLES' ? current.add(REALM_ADMIN_ROLE) : current.delete(REALM_ADMIN_ROLE)
    user.clientRoles[ADMIN_CLIENT] = [...current]
  } else {
    const current = new Set(user.realmRoles)
    cr.actionType === 'GRANT_ROLES' ? current.add(cr.role) : current.delete(cr.role)
    user.realmRoles = [...current]
  }
}

export function governanceSnapshot(actorId: string) {
  const realm = readRealm()
  requireRealmAdmin(realm, actorId)
  const admins = realm.users.filter(isRealmAdmin).length
  return { admins, threshold: quorumFor(admins), accounts: listAccounts(), changeRequests: realm.changeRequests }
}

// A request never takes effect on its own: even the requester must authorize it, and it only
// commits once `threshold` DISTINCT realm admins have authorized.
export function requestRoleChange(actorId: string, input: { userId?: unknown; role?: unknown; action?: unknown }) {
  const realm = readRealm()
  const actor = requireRealmAdmin(realm, actorId)
  const target = realm.users.find((u) => u.id === input.userId)
  if (!target) throw new SimTideError(404, 'UNKNOWN_USER')
  if (!GOVERNED_ROLES.includes(input.role as GovernedRole)) throw new SimTideError(400, 'INVALID_role')
  const role = input.role as GovernedRole
  const actionType = input.action === 'revoke' ? 'REVOKE_ROLES' : input.action === 'grant' ? 'GRANT_ROLES' : null
  if (!actionType) throw new SimTideError(400, 'INVALID_action')
  if ((actionType === 'GRANT_ROLES') === hasRole(target, role)) throw new SimTideError(409, 'NO_CHANGE')
  if (realm.changeRequests.some((c) => c.status === 'PENDING' && c.userId === target.id && c.role === role))
    throw new SimTideError(409, 'ALREADY_PENDING')
  const admins = realm.users.filter(isRealmAdmin).length
  const cr: ChangeRequest = {
    id: randomUUID(), entityType: 'USER', actionType, userId: target.id, role,
    requestedBy: actor.id, requestedByName: actor.name, requestedAt: new Date().toISOString(),
    approvals: [], threshold: quorumFor(admins), status: 'PENDING', decidedAt: null, deniedBy: null,
  }
  realm.changeRequests.unshift(cr)
  writeRealm(realm)
  return cr
}

export function decideRoleChange(actorId: string, id: string, decision: unknown) {
  const realm = readRealm()
  const actor = requireRealmAdmin(realm, actorId)
  const cr = realm.changeRequests.find((c) => c.id === id)
  if (!cr) throw new SimTideError(404, 'NOT_FOUND')
  if (cr.status !== 'PENDING') throw new SimTideError(409, 'NOT_PENDING')
  const now = new Date().toISOString()
  if (decision === 'deny') {
    Object.assign(cr, { status: 'DENIED', decidedAt: now, deniedBy: actor.id })
  } else if (decision === 'approve') {
    if (cr.approvals.some((a) => a.adminId === actor.id)) throw new SimTideError(409, 'ALREADY_AUTHORIZED')
    cr.approvals.push({ adminId: actor.id, adminName: actor.name, at: now })
    if (cr.approvals.length >= cr.threshold) {
      applyChange(realm, cr)
      Object.assign(cr, { status: 'APPROVED', decidedAt: now })
    }
  } else throw new SimTideError(400, 'INVALID_decision')
  writeRealm(realm)
  return cr
}
