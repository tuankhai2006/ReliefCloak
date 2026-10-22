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