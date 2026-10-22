# Where TideCloak fits in ReliefCloak

The live Tide network was under heavy load during the hackathon, so the demo runs against a **simulated TideCloak** that follows the same contracts as the real one.
This page lists what each part simulates, what real TideCloak would add, and how to switch over.

Planning source: Tide's MCP (`tide_choose_scenario` matched **`iga-admin-governance`**, plus the `verify-jwt-server-side`, `protect-api-nextjs` and `bootstrap-realm-from-template` playbooks).

## Why TideCloak matters here

ReliefCloak only works if **no single admin can give themselves payout powers or move money alone**.

- **Ordinary login:** the admin who controls the auth server can edit roles directly. That admin could make themselves auditor and disburser, then approve and pay their own proposal.
- **TideCloak:** keys are split across Tide's ORK network. Role changes in an IGA realm are **change requests that only commit with a quorum of independent admin signatures**. Not even the server operator can skip that.

## Mapping

| Concern | Real TideCloak | Simulated in this repo | Where |
|---|---|---|---|
| Sign-in | User proves their password to ORKs inside the Tide enclave; the threshold network signs the token | Picking a demo account calls `POST /api/sim-tide/login`, which signs a token | `lib/simTide.ts` `issueToken`, `lib/tide.tsx` `SimulatedTideBridge` |
| Token signing key | Realm VVK split across ORKs (14-of-20); never whole anywhere | One local Ed25519 key in `data/sim-tide-key.json` (gitignored) | `lib/simTide.ts` `signingKey` |
| Public key for verification | `jwk` embedded in `tidecloak.json` | `GET /api/sim-tide/jwks` | `app/api/sim-tide/jwks` |
| Token claims | `vuid`, `tideuserkey`, `realm_access.roles`, `resource_access['realm-management'].roles`, `iss`, `azp`, `exp` | Same claim names and shape | `issueToken` |
| Server-side check on every API | `verifyTideCloakToken(config, token, roles)` (+ DPoP proof when enabled) | `verifyToken`: EdDSA signature, `alg`, `kid`, `iss`, `azp`, `exp`; roles only from claims | `lib/auth.ts` `getSessionUser` |
| App roles | Realm roles `appUser`, `org_admin`, `auditor`, `disburser` | Same | `init/realm.json`, `lib/simTide.ts` |
| Realm admin | Client role `tide-realm-admin` on `realm-management` | Same (a client role, not a realm role) | `rolesOf`, `hasRole` in `lib/tide.tsx` |
| Role changes (IGA) | `/iga/change-requests` → `authorize` by each admin (enclave signature) → `commit` at threshold | `/api/sim-tide/governance` + `/api/sim-tide/change-requests/:id`; auto-commit at threshold | `requestRoleChange`, `decideRoleChange`, `/governance` page |
| Quorum | `max(1, floor(0.7 × admins))`; FirstAdmin mode with one admin | Same formula; seed has 3 realm admins → 2 signatures | `quorumFor` |
| Payout approval | App-level today; a Forseti policy would bind proposal, amount, recipient and approvers per payout | App-level checks in `services/reliefService.ts` (independent proposer, auditor, officer) | Not simulated as cryptography |

## What the simulation proves, and what it does not

**It does demonstrate:**
- The app has no trusted "who am I" header. A spoofed `x-mock-user` header, a token with edited roles, an `alg: none` token or an expired token all get **401**. This is tested in `scripts/test-sim-tide.cjs`, and the HTTP check runs against a live server.
- Roles come only from signed claims. A new role appears only in the next token after the change has **committed**.
- One admin cannot grant themselves `disburser`. Their own request and authorization leave it at `1/2` until a second, independent admin authorizes it.
- Every API route still checks roles server-side. Hiding a button in the UI is never the authorization.

**It does not provide Tide's guarantees:**
- Whoever runs this server holds the single signing key and can edit `data/sim-realm.json`. In real TideCloak, nobody holds the whole key, and governance approvals are sealed by the ORKs (`iga.attestor=tide`).
- There is no password or enclave. Anyone can pick any demo account.
- Per-payout approvals are application checks, not Tide signatures (`transactionPolicyVerified: false`).

## Switching to the real TideCloak

1. Start TideCloak (`tideorg/tidecloak-dev:latest`). This machine uses port 8081 because 8080 is taken. Then run `init/tcinit.sh` with `NEW_REALM_NAME=reliefcloak`. The licence email and acceptance of Tide's terms come from the team. A first attempt reached `setUpTideRealm -> 200`; that partial realm is kept in `tidecloak-data/` (gitignored).
2. Open the invite link, enroll the first admin, and let the script export `tidecloak.json`. It must contain `jwk`, `vendorId` and `homeOrkUrl`.
3. Set `NEXT_PUBLIC_TIDE_MOCK=false`. The `/api/sim-tide/*` routes then return 404. `lib/tide.tsx` uses `TideCloakProvider`, and `lib/auth.ts` verifies tokens with `verifyTideCloakToken`. Pages and services do not change.
4. Create the demo users in the realm and grant roles through the TideCloak admin console. Each grant is a change request needing quorum: the same flow as `/governance`.
5. Run Tide's doctor (`tide_doctor`) against the app, then do a real login.

## Commands

```bash
npm run test:sim-tide      # token + quorum tests
npm run reset:sim-tide     # restore demo accounts/roles (keeps the signing key)
```
