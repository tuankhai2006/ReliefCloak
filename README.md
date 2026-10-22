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

Setup Instructions

Prerequisites

Node.js: v18.0.0 or higher

npm: v9.0.0 or higher

TideCloak Environment: Active credentials or TideCloak Quickstart setup

Installation

Clone the repository:

git clone https://github.com/YOUR_GITHUB_USERNAME/ReliefCloak.git
cd ReliefCloak


Install dependencies:

npm install


Configure Environment Variables:
Create a .env file in the root directory and populate it with your TideCloak credentials:

PORT=3000
TIDECLOAK_SERVER_URL=https://auth.tidecloak.com
TIDECLOAK_REALM=relief-cloak
TIDECLOAK_CLIENT_ID=relief-cloak-app
TIDECLOAK_CLIENT_SECRET=your_client_secret


Run the Application:

Development Mode:

npm run dev


Production Build:

npm run build
npm start


Access the Application:
Open your browser and navigate to http://localhost:3000.

Demo Video

The 2-minute prototype demonstration is available inside this repository at ./demo.mp4.