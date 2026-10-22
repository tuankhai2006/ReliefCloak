# ReliefCloak — Implementation Plan

Last updated: 22 October 2026

This is the shared implementation and progress tracker for Khai and the coding agent. It records the agreed product direction. Where older planning documents describe a different flow, follow this plan and keep `docs/CURRENT_FLOW.md` accurate about what actually works.

## 1. Product goal

Build a polished, bilingual Vietnamese–English disaster relief demo covering the complete journey:

**Private resident report → admin review → published campaign → simulated donation → independent payout approval → simulated disbursement → public transparency ledger.**

Residents submit private reports. Only organization admins publish public content. Publishing a campaign does not authorize a payout.

The target is a hackathon prototype using synthetic data and simulated payments, not a production financial service. A complete mock demo is a product milestone; it does not by itself satisfy the challenge's live TideCloak integration requirement.

## 2. Confirmed decisions

| Topic | Decision |
| --- | --- |
| Languages | Vietnamese and English; Vietnamese by default |
| Visual direction | Light theme, white and green, relief imagery, restrained orange urgency accents |
| Users | Guests, residents/donors, organization admins, independent auditors, disbursement officers |
| Public publishing | Organization admins only |
| Reports | Visible only to their author and authorized organization admins |
| Donations and payouts | Simulated; clearly labeled throughout the interface |
| Team structure | Two vertical feature owners; both implement frontend and backend |
| Existing foundation | Next.js, React, TypeScript, Tailwind, TideCloak adapter, local JSON demo storage |
| Tide environment | Only mock mode currently available; live realm configuration remains outstanding |
| Delivery timing | Exact deadline and available coding hours still need confirmation; milestones below are dependency-based |

## 3. Current baseline

These items already exist; do not treat them as new work or as evidence of live Tide enforcement.

- [x] Repository cloned and existing implementation inspected.
- [x] Private report submission and report listing by owner/admin.
- [x] Admin-only public post creation with server-side authorization.
- [x] Public posts page with separately edited public content.
- [x] Mock resident account for testing.
- [x] Existing claim approval and simulated disbursement scaffold.
- [x] Community service tests and successful mock production build.
- [x] Development/build scripts use webpack after local Turbopack failures.
- [x] Database tampering endpoint restricted to local mock development.
- [ ] Full visual design and bilingual interface.
- [ ] Campaign lifecycle, simulated donations, and complete admin dashboards.
- [ ] Live TideCloak realm and verified governance demonstration.
- [ ] Tide-enforced authorization for individual disbursements.

Baseline implementation commit: `2863794`. Tests from that baseline must be rerun after relevant changes.

## 4. Scope

### Included

- Public home page, campaign discovery, campaign details, and transparency ledger.
- Resident dashboard, report submission/tracking, simulated donation flow, receipts, and donation history.
- Admin workspace for report review and campaign management.
- Role-specific audit and disbursement workflows.
- Persistent local demo data, repeatable seed/reset procedure, and synthetic identities.
- Images bundled with the project, responsive layouts, and Vietnamese–English interface copy.
- Loading, empty, validation, error, success, and unauthorized states.
- Backend role checks, independent actors, safe status transitions, and duplicate payment prevention.
- Honest documentation of mock behavior and live Tide integration status.

### Excluded from this milestone

- Real banking, card processing, or money transfers.
- Real identity checks or guarantees that a report is factually true.
- Live disaster maps, AI verification, chat, SMS, or email delivery.
- Automatic translation of user-generated reports.
- Production hosting architecture, multi-instance JSON storage, and production compliance claims.

## 5. Roles and access

| Role | Allowed actions |
| --- | --- |
| Guest | Browse published campaigns and public transparency data |
| Resident/donor (`appUser`) | Submit reports, view own reports, make simulated donations, view own receipts/history |
| Organization admin (`org_admin`) | Review reports, publish campaigns, propose disbursements |
| Auditor (`auditor`) | Inspect proposals and approve/reject with a reason |
| Disbursement officer (`disburser`) | Execute an approved simulated payout |

- Demo accounts have one primary application role each.
- The proposal author, auditor, and executing officer must be different identities.
- Enforce permissions and identity separation in backend services, not just navigation.
- Public responses must use explicit field allowlists; do not expose private report bodies, account details, or reporter identities.
- Keep the legacy `field_worker` flow functional until its replacement is integrated; the agent owns that migration.

## 6. User journeys and state transitions

### Reports

1. An authenticated resident submits location, needs, urgency, description, and a bundled illustrative image.
2. The resident sees their submission and subsequent admin feedback.
3. An admin reviews the report and accepts or rejects it with feedback.
4. An accepted report may become a campaign draft; it never becomes public automatically.

`NEW → VERIFYING → ACCEPTED | REJECTED`

### Campaigns

1. An admin creates a draft from an accepted report.
2. The admin writes public Vietnamese/English titles and descriptions, selects imagery, and sets a funding target.
3. The admin previews and publishes the campaign.
4. Visitors browse published campaigns; donors can make simulated donations while the campaign is open.
5. Closing a campaign stops new donations; historical receipts and approved payout history remain available.

`DRAFT → PUBLISHED → CLOSED`

### Simulated donations

1. A signed-in user chooses a positive integer VND amount.
2. The confirmation screen clearly states that no real payment occurs.
3. The server creates one donation record per idempotent request.
4. The donor receives a simulated receipt and sees it in their history.
5. Public anonymity hides the donor's identity in public views, not their ownership in private history.

### Simulated disbursements

1. An admin submits purpose, synthetic recipient, campaign, and amount.
2. An independent auditor approves or rejects the immutable proposal.
3. A third identity with the officer role executes an approved proposal once.
4. The server rechecks available funds at execution and records the audit event.
5. Changes to amount/recipient after submission require a new proposal and approval.

`PENDING_AUDIT → APPROVED | REJECTED`; `APPROVED → PAID_SIMULATED`

## 7. Screens

| Area | Screen | Key content |
| --- | --- | --- |
| Public | Home | Hero image, mission, seeded demo metrics, featured campaigns, how it works |
| Public | Campaign list | Search, region/status filters, image cards, funding progress |
| Public | Campaign detail | Imagery, public needs, funding target/progress, updates, donation action |
| Public | Transparency | Simulated donations/disbursements and approval progress without private details |
| User | Dashboard | Own recent reports, donation summary, quick actions |
| User | Report form | Location, needs, urgency, description, sample image selection |
| User | My reports/detail | Status timeline and admin feedback |
| User | Donation/receipt | Amount, optional public anonymity, confirmation, simulated receipt |
| User | Donation history | Campaign, amount, date, receipt reference |
| Admin | Dashboard | Review queue, active campaigns, donations, pending disbursements |
| Admin | Report management | Filters, details, review actions, campaign creation |
| Admin | Campaign management | Draft editor, preview, publish, close |
| Internal | Disbursements | Propose, audit, and execute views according to role |
| Internal | Audit history | Actor, action, object, timestamp, outcome |

## 8. Parallel ownership

The proposed assignment follows the agreed two-person full-stack split. Both owners can work concurrently once milestone 1 contracts are frozen.

### Khai — public experience, residents, and donations

**Frontend**

- Home, campaign list/detail, resident dashboard.
- Report submission and personal tracking.
- Donation confirmation, receipts, and history.
- Public transparency presentation using the agreed read API.
- Shared UI primitives, public header/footer, responsive styling, language switcher, and imagery.

**Backend**

- Resident report submission and own-report queries.
- Public campaign read endpoints/projections.
- Simulated donation creation, idempotency, receipts, and own-history queries.

**Primary files/areas**

- Public/user pages and feature components.
- `app/api/reports/` for resident requests; coordinate the existing combined admin behavior before separating it.
- New public campaign and donation endpoints.
- Feature services for resident reports and donations.
- Shared UI and localization infrastructure, with translations separated by feature.

### Coding agent — internal operations, governance, and payouts

**Frontend**

- Admin shell and dashboard.
- Report review and campaign management.
- Auditor queue, officer payout workspace, and audit history.

**Backend**

- Admin report actions and campaign write endpoints.
- Disbursement proposal, audit, execution, and audit events.
- Shared domain types, storage repository interfaces, auth/role enforcement.
- Tide adapter integration and legacy claims migration.

**Primary files/areas**

- New `app/admin/` pages and internal feature components.
- New `app/api/admin/` endpoints.
- Models, persistence interfaces, auth adapter, and disbursement services.
- Existing `claims`, `disburse`, and `rogue` migration/integration.

### Shared-file rules

- Khai owns shared UI/localization changes; the agent consumes those components.
- The agent owns shared model/storage/auth changes; Khai consumes the agreed interfaces.
- Coordinate `app/layout.tsx`, `components/NavBar.tsx`, `package.json`, lockfiles, and `init/realm.json` before editing.
- Each owner updates their own checklist section below.
- Do not change shared types or endpoint responses silently.
- Use separate branches/checkouts for parallel development; suggested branches: `feat/public-user-donations` and `feat/admin-governance`.
- Merge small integrated milestones; avoid a single final large merge.
- Do not force-push over a teammate's commits.

## 9. Shared contracts to freeze before feature work

These are proposed contracts, not a claim that the endpoints already exist. The agent drafts the types/storage interfaces; both owners confirm the contract commit before building against it.

### Domain objects

| Object | Essential fields |
| --- | --- |
| Report | ID, author ID, region, needs, urgency, description, image reference, status, feedback, timestamps |
| Campaign | ID, source report ID, bilingual public title/content, images, target VND, status, timestamps |
| Donation | ID, donor ID, campaign ID, amount VND, public anonymity, idempotency key, simulated receipt, timestamp |
| Disbursement | ID, campaign ID, immutable amount/purpose/recipient, proposer, auditor, officer, status, timestamps |
| AuditEvent | ID, actor ID, action, object ID/type, outcome, timestamp |

### Proposed API boundaries

| API family | Owner | Behavior |
| --- | --- | --- |
| `/api/reports` | Khai | Submit and list own reports |
| `/api/admin/reports` | Agent | Admin review queue and status/feedback actions |
| `/api/campaigns` | Khai | Published campaign list/detail with public projections |
| `/api/admin/campaigns` | Agent | Draft creation, updates, publication, closure |
| `/api/donations` | Khai | Authenticated simulated donation and own-history queries |
| `/api/admin/disbursements` | Agent | Role-specific proposal, approval/rejection, execution |
| `/api/transparency` | Agent | Public aggregate/ledger projection consumed by Khai's UI |
| `/api/admin/audit` | Agent | Authorized internal audit history |

Specify detail/action routes, response types, validation errors, and example payloads in the contract commit. Keep existing routes working or migrate every consumer in the same merge.

### Invariants

- Store money as positive safe integers in VND; never trust client-calculated totals.
- Compute received/paid totals from authoritative donation/disbursement records.
- Recheck campaign state when accepting a donation.
- Recheck available balance and payment status atomically when executing a payout.
- Use idempotency keys for donation creation and payout execution.
- Generate IDs, actor identity, and timestamps on the server.
- Store timestamps in UTC; localize their display.
- Use one error response convention, such as `{ error: string, code?: string }`.
- Separate public DTOs from internal storage objects.
- Local JSON storage is single-instance demo persistence. Serialize mutations in one storage layer; no independent read-modify-write implementations across feature services.
- Database audit entries are not cryptographic signatures or tamper-proof evidence.

## 10. Design and localization

- Use white cards, soft neutral backgrounds, green primary actions, and orange urgency accents.
- Establish shared button, card, input, select, status badge, table, dialog, and empty-state components first.
- Public pages emphasize images and campaign stories; admin pages emphasize readable queues and actions.
- Provide visible focus states, field labels, sufficient contrast, and keyboard-accessible controls.
- Keep the demo indicator visible; label donation confirmations and receipts as simulated.
- Bundle images locally for reliable demos and record attribution/license or generation status.
- Do not present illustrative imagery as verified evidence of an actual event.
- Translate interface labels, validation feedback, empty states, navigation, and seeded campaign content.
- Preserve the original language of user reports; do not pretend automatic translation exists.
- Keep language selection across navigation and refresh.

## 11. TideCloak integration track

### Current facts

- The repo contains the SDK and an authentication adapter.
- `tidecloak.json` was empty at the baseline; no live realm has been validated.
- Mock account selection, mock headers, and mock encryption are development aids, not security guarantees.
- Application database approvals do not create Tide signatures.
- Self-encryption/self-decryption does not automatically enable a different officer identity to decrypt a field worker's data.

### Implementation checklist

- [ ] Start/obtain a TideCloak environment and configure a non-master application realm.
- [ ] Configure real accounts and application roles; verify server-side token validation.
- [ ] Confirm governed role changes and the effective quorum on the actual instance.
- [ ] Demonstrate a sensitive role change remaining pending below quorum.
- [ ] Demonstrate the same change becoming effective only after sufficient independent approvals.
- [ ] Document which infrastructure powers remain outside this demonstration's protection.
- [ ] Investigate a Forseti policy for individual disbursements bound to proposal ID, amount, recipient, and independent approvers, with replay protection.
- [ ] Verify policy evidence at the component that executes the simulated payment before claiming transaction-level Tide enforcement.

The cited Tide QEA documentation currently gives the default threshold as `max(1, floor(0.7 × N))`: two admins need one approval; three need two. Confirm this on the deployed version. The same documentation notes that the master realm is not QEA-governed. Do not promise that two admin accounts automatically require two signatures or that all infrastructure powers disappear.

If only role-governance integration is completed, demonstrate and describe that exact capability. Do not claim that each payout has cryptographic multi-party authorization until implemented and tested.

References:

- https://docs.tide.org/Core-Concepts/iga-workflow
- https://docs.tide.org/Core-Concepts/forseti-engine
- https://docs.tide.org/ai-agent-pack

## 12. Milestones and integration gates

| Milestone | Khai | Agent | Exit condition |
| --- | --- | --- | --- |
| M1: Shared foundation | UI kit, public layout, i18n, image assets | Types, storage interfaces, roles, API examples; begin Tide setup checks | Both feature owners build against the same contract commit |
| M2: Report to campaign | Report form/history, public campaign pages | Review queue, campaign draft/publish | A resident report becomes an admin-authored public campaign |
| M3: Donation to payout | Donation, receipt, personal history | Proposal, independent audit, simulated payout, ledger API | One complete financial simulation with correct balance |
| M4: Product polish | Responsive UI, bilingual copy, loading/error states | Role violations, replay/duplicate checks, transition validation | Main actions work and invalid operations are rejected |
| M5: Integrated demo | Public/user walkthrough | Internal/Tide walkthrough, status documentation | Repeatable end-to-end demo from a clean seed |

Tide environment investigation starts in M1, not after the UI is finished. Record blockers early and continue independent mock product work without disguising the blocker.

## 13. Progress tracker

### Khai

- [ ] K1 — Shared UI kit and public/user layouts.
- [ ] K2 — Vietnamese/English localization and switcher.
- [ ] K3 — Home page and locally bundled campaign imagery.
- [ ] K4 — Campaign listing/detail and public read APIs.
- [ ] K5 — Resident dashboard, report form/history, and resident APIs.
- [ ] K6 — Simulated donation API with validation and idempotency.
- [ ] K7 — Donation confirmation, receipts, and history.
- [ ] K8 — Public transparency UI.
- [ ] K9 — Responsive/accessibility pass and user-flow verification.

### Coding agent

- [ ] A1 — Domain/API contracts and serialized demo storage.
- [ ] A2 — Server-side permissions and role-specific admin shell.
- [ ] A3 — Admin report review and feedback.
- [ ] A4 — Campaign editor, publication, closure, and write APIs.
- [ ] A5 — Immutable disbursement proposals and auditor decisions.
- [ ] A6 — Officer execution, balance checks, and duplicate prevention.
- [ ] A7 — Audit history and public transparency projection.
- [ ] A8 — Tide environment, auth, and governance validation.
- [ ] A9 — Legacy flow migration and truthful integration documentation.
- [ ] A10 — Backend negative cases and full build verification.

### Shared integration

- [ ] S1 — Confirm API/type contract commit and file ownership.
- [ ] S2 — Merge M2 and run report → campaign together.
- [ ] S3 — Merge M3 and run donation → payout together.
- [ ] S4 — Verify language switching and mobile layouts across both areas.
- [ ] S5 — Verify clean setup, demo reset, and synthetic seed data.
- [ ] S6 — Update README and demo script to match actual Tide behavior.

## 14. Acceptance checklist

- [ ] A resident submits a report and sees it after refresh.
- [ ] Another resident cannot read that private report through UI or API.
- [ ] An admin reviews the report and publishes a separately written campaign.
- [ ] A non-admin cannot publish, including by directly calling the API.
- [ ] Guests see only published public campaign data.
- [ ] A donor receives exactly one simulated receipt for a repeated request.
- [ ] Invalid donation amounts and donations to closed campaigns are rejected.
- [ ] An admin proposes a payout without being able to self-audit it.
- [ ] An auditor can approve/reject but cannot execute without the correct role and independent identity.
- [ ] An officer cannot execute a pending/rejected proposal.
- [ ] An approved payout cannot execute twice or exceed available funds.
- [ ] The public ledger updates without revealing private report content or sensitive recipient details.
- [ ] Language preference persists and the interface works on mobile.
- [ ] Loading, empty, error, and success states exist for main workflows.
- [ ] Type checking, feature tests, production build, and manual walkthrough pass after integration.
- [ ] The demo clearly distinguishes mock payments, application approvals, and verified live Tide operations.

## 15. Handoff and tracking rules

For every completed work item, append a short entry below with owner, task IDs, commit, validation, and remaining issues. Check a box only when the implementation and relevant verification are complete.

Before handing off:

1. Sync the remote branch and preserve teammate changes.
2. Run checks appropriate to the touched feature.
3. Update this tracker and `docs/CURRENT_FLOW.md` when behavior or integration status changes.
4. Include exact setup steps and any new environment-variable names in `.env.example`; never commit credentials or personal demo data.
5. State API changes explicitly and identify consumers needing updates.

### Work log

| Date | Owner | Tasks / commit | Validation | Remaining issues |
| --- | --- | --- | --- | --- |
| 2026-10-22 | Coding agent | Baseline `2863794`: private reports and admin posts | Type checking, community service tests, mock production build | Full product UI, campaigns/donations, and live Tide remain outstanding |
| 2026-10-22 | Planning | Shared implementation plan created | Matches agreed scope and proposed vertical ownership | Confirm deadline and M1 contract commit before parallel feature work |

### Blockers / decisions

| Item | Owner | Status / next action |
| --- | --- | --- |
| Exact delivery deadline | Team | Confirm available time and prioritize milestone delivery accordingly |
| Live Tide environment | Coding agent / team | Mock only; obtain/start realm and independent demo accounts |
| Per-payout cryptographic policy | Coding agent | Investigate verified Tide guidance; do not claim implemented protection |
| Final route/type contracts | Both | Freeze in M1 and share the commit before parallel implementation |
