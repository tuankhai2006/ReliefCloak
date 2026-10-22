ReliefCloak: Zero-Trust Community Disaster Relief Protocol

ReliefCloak is a transparent, multi-party disaster relief distribution system that eliminates single-point-of-control fraud by releasing funds only when real-time victim requests, field worker verifications, and auditor approvals align via TideCloak.

Project Overview

1. Vision & Originality
Charity transparency fails because traditionally, one central admin or platform holds the master key to disburse donated funds. ReliefCloak reimagines disaster response where trust is no longer the bottleneck: donors contribute freely, knowing no single entity can misappropriate funds.

2. Trust Constraint Insight
In traditional relief platforms, backend admins or charity owners can execute unauthorized SQL database updates, bypass approval workflows, or disburse funds to fake accounts. The system relies entirely on human promises rather than cryptographic enforcement.

3. Value & Impact
ReliefCloak restores public faith in disaster relief by guaranteeing that 100% of disbursed funds go directly to verified victims in disaster-affected regions, eliminating embezzlement, fake claim fraud, and delayed emergency response.

4. Why TideCloak Matters
With TideCloak, the backend database only stores encrypted vault state—it holds no decryption keys or master privileges. Authority to release relief funds emerges only when signed credentials from three distinct entities meet: (1) Victim/Field Worker GPS request, (2) Relief Organization authorization, and (3) Independent Auditor sign-off. If any party attempts a unilateral override, TideCloak denies key reconstruction, rendering backend tampering mathematically impossible.

5. Prototype & Storytelling
Our prototype demonstrates a live emergency scenario in a flood-affected area: a field worker submits an emergency aid claim, triggering a multi-party approval sequence. Once all three TideCloak identities sign the transaction, the relief payout is decrypted and released in real time.

## Setup Instructions

> **Before running the app, read [docs/SETUP.md](docs/SETUP.md).**
> You must create `.env.local` from `.env.example` (it sets `NEXT_PUBLIC_TIDE_MOCK=true`). Without it the app shows a **Sign in** button that fails, because no live TideCloak realm is configured.

Admin workspace: open `/admin` after starting the app. See [admin API and teammate handoff](docs/ADMIN_HANDOFF.md) for the role-specific workflow, isolated tests, seed reset, and public/donation integration contracts. The new workflow uses simulated funds and independent application roles; live Tide transaction enforcement is still pending.

Implementation status: the current app supports private resident reports and admin-only public posts. See [current flow and Tide integration limits](docs/CURRENT_FLOW.md). The vision above is not a verified security guarantee: payouts are simulated, database approvals are not Tide signatures, and a live Tide realm plus transaction policy still need configuration and validation.

### Prerequisites
- Node.js 20.9+ and npm
- Docker (for the TideCloak server)
- Git Bash (Windows) with `curl` and `jq` for the init script

### Quick start (mock mode, no TideCloak needed)
```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_TIDE_MOCK=true
npm run dev
```
Open http://localhost:3000 and pick a role in the top-right corner. Full walkthrough (Vietnamese): [docs/SETUP.md](docs/SETUP.md).

### With TideCloak
1. Start a TideCloak server on http://localhost:8080 (see the TideCloak getting-started guide).
2. Adjust `init/.env.example` if needed (the init script reads defaults from it).
3. `npm run init` provisions the realm (with the ReliefCloak roles) and writes `tidecloak.json`.
4. Set `NEXT_PUBLIC_TIDE_MOCK=false` in `.env.local`, then `npm run dev`.

## Demo Video

The 2-minute prototype demonstration is available inside this repository at ./demo.mp4.

## Demo Roles & User Personas

The prototype includes pre-configured demo personas to showcase end-to-end zero-trust disaster relief governance:

| Persona & Demo Account | System Role | Accessible Views | Primary Responsibilities & Zero-Trust Constraints |
| :--- | :--- | :--- | :--- |
| **An / Bình**<br>`resident-1`, `resident-2` | `appUser` (Resident / Donor) | `/reports`<br>`/campaigns`<br>`/donations`<br>`/me`<br>`/transparency` | - Submits private emergency assistance reports specifying urgent needs (food, clean water, medical supplies).<br>- Contributes simulated donations with idempotent receipts.<br>- Tracks personal donation history; views the public ledger with identity redaction. |
| **Lan**<br>`fw-1` | `field_worker` (Field Worker) | `/reports` | - Verifies on-the-ground damage and logs verified emergency field claims from disaster zones. |
| **Minh**<br>`org-1` | `org_admin`, `tide-realm-admin` (Fund Admin) | `/admin/reports`<br>`/admin/campaigns`<br>`/admin/disbursements`<br>`/governance` | - Verifies resident reports (`NEW` &rarr; `VERIFYING` &rarr; `ACCEPTED` / `REJECTED`).<br>- Creates and publishes public relief campaigns based on accepted reports.<br>- Proposes relief fund disbursements.<br>- **Zero-Trust Constraint**: Cannot audit or execute own proposed payouts. |
| **Hà**<br>`aud-1` | `auditor`, `tide-realm-admin` (Independent Auditor) | `/admin/disbursements`<br>`/governance` | - Inspects pending payout proposals, verifying recipient legitimacy, invoices, and justification.<br>- Formally approves or rejects payouts with audit notes.<br>- **Zero-Trust Constraint**: Cannot propose payouts or disburse funds. Rejection permanently locks the payout from execution. |
| **Tuấn**<br>`off-1` | `disburser` (Disbursement Officer) | `/admin/disbursements` | - Executes approved payouts in real time.<br>- Validates idempotency keys to guarantee no double-disbursements.<br>- **Zero-Trust Constraint**: Must be an entirely distinct entity from both the proposer (`org_admin`) and the approver (`auditor`). |
| **Quang**<br>`gov-1` | `tide-realm-admin` (Realm Governance Admin) | `/governance` | - Evaluates role grant / revocation requests under Tide Identity Governance & Administration (IGA).<br>- Enforces multi-admin quorum consensus to prevent privilege escalation. |

---

## End-to-End User Flows

```
[ Resident / Victim ] ──(1. Emergency Report)──> [ Private Reports Queue ]
                                                              │
                                                   (2. Verify & Accept)
                                                              │
                                                              ▼
                                                   [ Published Campaign ] ◄──(3. Donate)── [ Donor ]
                                                              │
                                                     (4. Propose Payout)
                                                              │
                                                              ▼
                                                   [ Pending Audit Queue ]
                                                              │
                                                    (5. Inspect & Approve)
                                                              │
                                                              ▼
                                                   [ Approved Execution ]
                                                              │
                                                   (6. Execute Payout)
                                                              │
                                                              ▼
                                                   [ Public Transparency Ledger ]
```

### 1. Community Incident Reporting & Campaign Creation Flow
1. **Report Submission**: A disaster-affected resident (e.g., **An**) submits an emergency assistance request at `/reports` with location coordinates, urgency level (`STANDARD` / `URGENT`), specific supply needs (`food`, `water`, `medical`), and photo evidence. Reports remain private to protect victim privacy.
2. **Review & Verification**: The Relief Organization Admin (**Minh**) opens `/admin/reports`, reviews incoming submissions, transitions status (`NEW` &rarr; `VERIFYING` &rarr; `ACCEPTED`), and attaches official feedback.
3. **Campaign Publication**: From the accepted report, the Admin drafts a public bilingual campaign (Vietnamese & English) at `/admin/campaigns` with target funding goals, previews it, and publishes it to the public directory.

### 2. Transparent Public Donation Flow
1. **Campaign Discovery**: Donors browse published disaster campaigns on `/` or `/campaigns` with live progress bars and verified details.
2. **Simulated Contribution**: Donors specify a contribution amount (minimum 10,000 VND). The client attaches a unique `idempotencyKey` to guarantee that accidental duplicate clicks or network retries do not double-charge.
3. **Instant Receipt & Ledger Update**: The system issues an immediate verifiable receipt at `/donations/:id`. The campaign's `receivedVnd` and `availableVnd` update in real time.
4. **Public Redaction**: The contribution is logged on the public ledger at `/transparency` with timestamp and amount, while completely redacting donor identities and private reporter info.

### 3. Multi-Party Zero-Trust Disbursement Flow (3-Party Separation of Duty)
To prevent embezzlement, self-dealing, and rogue disbursements, every payout requires three distinct identities:

1. **Step 1: Payout Proposal (Fund Admin - Minh)**
   - The Fund Admin opens `/admin/disbursements` and submits a payout proposal specifying the target campaign, amount, recipient name/account, and intended purpose (e.g., bottled water emergency distribution).
   - **Dynamic Balance Enforcement**: The server dynamically recalculates available funds (`received donations - executed disbursements`). Proposing an amount greater than available funds is rejected immediately.
2. **Step 2: Independent Compliance Audit (Auditor - Hà)**
   - The Independent Auditor (**Hà**) accesses the audit queue. The Fund Admin has no permission to approve their own proposal.
   - **Fraud Mitigation**: If the payout is suspicious (e.g., proposed to a personal account or missing receipts), the Auditor records notes and clicks **Reject**. The payout status becomes `REJECTED` and is permanently blocked from execution.
   - **Compliance Approval**: If legitimate, the Auditor enters audit verification notes and approves the proposal (`APPROVED`).
3. **Step 3: Payout Execution (Disbursement Officer - Tuấn)**
   - The Disbursement Officer (**Tuấn**) views the approved payout queue. The Officer cannot execute rejected proposals or proposals they authored or audited (`actor != proposer && actor != auditor`).
   - The Officer clicks **Execute simulated payout**. The backend validates idempotency, deducts from the available campaign pool, updates the status to `PAID`, and logs an immutable audit event.
   - Re-executing or replaying the transaction is prevented.

### 4. TideCloak Decentralized Governance & Anti-Rogue Protection Flow (IGA)
A common vulnerability in traditional platforms is administrative privilege escalation: a rogue administrator edits the database or user directory to grant themselves auditor or disburser privileges. ReliefCloak prevents this via TideCloak's Identity Governance & Administration (IGA) quorum model:

1. **Rogue Escalation Attempt**: Admin **Minh** opens `/governance` and submits a change request to grant himself the `auditor` or `disburser` role.
2. **Quorum Interception**: Rather than immediately applying the role, TideCloak halts the grant in a `PENDING` state:
   $$\text{Threshold} = \max(1, \lfloor 0.7 \times N \rfloor)$$
   For 3 realm administrators, at least 2 independent signatures are mandatory. Minh's self-authorization provides only `1/2 authorized` ("Awaiting quorum").
3. **Consensus & Denial**: Independent Realm Admin **Hà** inspects the pending privilege request on `/governance` and clicks **Deny**.
4. **Enforced Security**: The request is marked `DENIED`, and Minh's roles remain unmodified. No single individual can bypass the 3-party approval hierarchy.
