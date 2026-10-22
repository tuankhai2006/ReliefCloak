# Admin implementation handoff

## Run locally

```powershell
npm ci
# Only if .env.local does not already exist:
Copy-Item .env.example .env.local
npm run dev
```

Open `/admin`. Mock mode offers Minh (organization admin), Ha (auditor), and Tuan (disbursement officer) through the existing account selector. The admin landing screen also offers those demo accounts when no internal user is selected. Mock identities are openly selectable and are not authentication.

The admin workspace has Vietnamese/English copy, remembers its language using `relief-language`, and has responsive layouts. Khai may connect this key to the shared language infrastructure. Report text and user-entered audit notes are not automatically translated.

## Seed and persistence

The common store is `data/relief.json` (gitignored). Every new report, legacy public post, campaign, donation and new payout uses this store. A filesystem lock coordinates synchronous mutations across route workers and a temporary-file rename commits the transaction.

On first access:

1. An existing `relief.json` is used unchanged.
2. Otherwise existing `community.json` reports/posts are migrated on the first successful write; missing report status means NEW.
3. Otherwise `relief.seed.json` supplies synthetic reports, one published campaign, 18,000,000 VND of simulated donations, and a pending 3,000,000 VND payout.

Existing local reports take precedence over seeds. If the dashboard has no seeded campaign, that is intentional preservation of existing data.

For a clean walkthrough, stop the app and run:

```powershell
npm run reset:relief -- --confirm
```

This explicitly replaces the current new-store demo records with synthetic seed data. It does not alter legacy `community.json` or `db.json`. Do not reset while a teammate is using the app.

`RELIEF_DATA_DIR` optionally selects an isolated store directory for tests. Copy `relief.seed.json` there to seed it. JSON persistence is for local/single-instance demonstration, not distributed hosting. If the process crashes while holding `relief.lock`, stop all app processes, inspect that directory, and remove only that stale empty lock before restarting; do not delete the data file.

## API contract — ready for Khai

All protected requests use the existing `useTide().authFetch`. Success responses contain the direct object/array; errors are `{ error: string }` with HTTP 400/401/403/404/409. IDs are opaque strings; all amounts are integer VND and dates are UTC ISO strings.

| Method | Route | Payload / result |
| --- | --- | --- |
| GET | `/api/admin/dashboard` | Internal roles: snapshot with reports (admin only), campaigns with balances, disbursements, audit, mode and transactionPolicyVerified=false |
| GET | `/api/admin/reports` | Admin only; reports with normalized status |
| PATCH | `/api/admin/reports` | `{ id, status, feedback }`; NEW→VERIFYING→ACCEPTED/REJECTED |
| GET | `/api/admin/campaigns` | Internal roles; includes draft campaigns and balances |
| POST | `/api/admin/campaigns` | Admin only; campaign creation fields below |
| PATCH | `/api/admin/campaigns` | `{ id, action: "save", ...fields }`, `{ id, action: "publish" }`, or `{ id, action: "close" }` |
| GET | `/api/admin/disbursements` | Internal roles; internal payout records |
| POST | `/api/admin/disbursements` | Admin: `{ campaignId, amountVnd, purpose, recipient }` |
| PATCH | `/api/admin/disbursements` | Auditor: `{ id, action: "audit", decision: "APPROVED" or "REJECTED", note }` |
| PATCH | `/api/admin/disbursements` | Officer: `{ id, action: "execute", idempotencyKey }` |
| GET | `/api/admin/audit` | Internal roles; audit events |
| GET | `/api/transparency` | Public allowlisted campaigns, donations and payout progress; no donor identities, reporter details, recipient, internal notes, or execution keys |

Campaign creation/save fields:

```json
{
  "reportId": "accepted-report-id",
  "title": { "vi": "Tiêu đề", "en": "Title" },
  "content": { "vi": "Nội dung công khai", "en": "Public content" },
  "image": "/photos/flood-1.svg",
  "targetVnd": 50000000
}
```

Only bundled `/photos/flood-1.svg` and `/photos/flood-2.svg` are currently accepted. Coordinate with the agent when adding Khai's image assets to this allowlist. Published content is immutable in this iteration; edits are available while DRAFT. Closed campaigns remain visible in public history, and payouts can still be completed from their existing balance.

### Functions for Khai's public campaign/donation APIs

Import from `services/reliefService.ts` in server code only:

- `publicCampaigns()` returns a safe public campaign list with receivedVnd, paidVnd and availableVnd. It excludes drafts and private report IDs/authors.
- `recordDonation(user, { campaignId, amountVnd, anonymous, idempotencyKey })` atomically validates and records one simulated donation per user/key. Repeating the same payload returns the original receipt. Reusing a key with changed fields returns 409. Retry with the same key after a network error.
- `ownDonations(user)` returns only that user's history without internal idempotency keys.
- `transparency()` supplies the public ledger projection.
- `readRelief()` and `mutateRelief(callback)` are the shared storage interface; never write `relief.json` directly or add a second feature-specific balance store.

Khai owns the HTTP wrappers for `/api/campaigns` and `/api/donations`; those routes are intentionally not implemented by the admin branch. Prefer a server-side `publicCampaigns().find(...)` with 404 when implementing campaign detail.

The existing `/api/reports` still supports resident creation and owner/admin listing for compatibility. Its payload is currently `{ region, description }`; optional needs, urgency and image types exist for Khai's form expansion. Extra client status/author fields are ignored. Continue using the common repository when adding those fields.

## Demo walkthrough

1. Select Minh and open `/admin/reports`. Move the Quang Tri report to VERIFYING, then ACCEPTED, with feedback.
2. Open `/admin/campaigns`, create a bilingual draft from that report, preview, save and publish.
3. Open `/admin/disbursements` and inspect the seeded Hue proposal, or propose a new amount within its available balance.
4. Switch to Ha, open the same queue, add a note and approve. Organization admins cannot call that operation.
5. Switch to Tuan, confirm a simulated payout. The actor must differ from both proposer and auditor.
6. Refresh: the same payout cannot execute twice. The dashboard and public transparency API show the updated balance.
7. Open `/admin/audit` to inspect the recorded actions. These are application logs, not cryptographic proofs.

## Legacy compatibility

- Existing reports/posts are preserved and use the common store.
- The old claim pages remain available for reference, but their navigation entries have been removed from the main demo flow.
- The old `/api/claims/:id/release` endpoint now returns 410 `LEGACY_PAYOUT_DISABLED`; new payouts must use the independently approved admin workflow.
- Old claim data and rogue demonstrations use the separate historical `db.json`. They are not included in campaign balances or transparency totals. Do not use that old demo to claim new Tide protection.

## Verification

```powershell
npm run test:community
npm run test:governance
npm run build
```

For HTTP checks, run a mock build/server with an isolated RELIEF_DATA_DIR containing the seed and set `RELIEF_TEST_URL=http://127.0.0.1:3100`, then run `node scripts/test-admin-http.cjs`. This creates synthetic test records in that server; never point it at shared demo data.

Checked: authorization, report privacy/transitions, campaign lifecycle, donation idempotency, independent approvers, immutable proposals, payout replay, overspending, rejection, storage contention, direct HTTP access, malformed request handling, and public field redaction.

Browser automation was disabled in the current environment. Responsive styles and bilingual views are implemented, but a human visual walkthrough is still required.

## Tide boundary

Live environment setup is tracked separately. Authenticated identities alone do not make payout decisions cryptographically enforced. Until a signed transaction policy and its verifier are wired in, every payout stays explicitly simulated and `transactionPolicyVerified` stays false. Mock credentials, application approvals and checksums are never proof of Tide enforcement.
