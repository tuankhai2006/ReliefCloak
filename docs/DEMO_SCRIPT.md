# ReliefCloak: two-minute demo script

Target length: 2:00. The voiceover is about 310 words, which is tight for two minutes. Read briskly, or cut Part 2 to its first sentence if it runs long.
Final file: `demo.mp4` in the repo root, under 100 MB. 1080p at 30 fps, H.264, about 8 Mbps comes to roughly 120 MB for 2 minutes, so export at **5 Mbps** (about 75 MB).

## Before filming

1. Stop the app, then reset both stores so the numbers below match:
   ```bash
   npm run reset:relief -- --confirm
   ```
   ```bash
   npm run reset:sim-tide
   ```
2. `npm run dev`, open http://localhost:3000, switch the language to **EN**.
3. Browser at 1920×1080, zoom 110–125% so text reads on small screens. Hide bookmarks and extensions. Close devtools.
4. Open these tabs in order so cuts are quick: `/`, `/campaigns/campaign-hue`, `/admin/disbursements`, `/governance`, `/transparency`.
5. Rehearse each segment once. Record each segment as its own clip and join them in editing. Do not try to film it in one take.

Seed state you will see: Hue campaign, target 50,000,000 ₫, raised 18,000,000 ₫, one pending 3,000,000 ₫ payout. Demo accounts: An (resident), Minh (fund admin, realm admin), Hà (auditor, realm admin), Quang (realm admin), Tuấn (officer).

---

## 1. The possibility (0:00–0:20)

| On screen | Voiceover |
| --- | --- |
| Title card: **ReliefCloak**, subtitle "Disaster relief where no one person can move the money". 3 s. | |
| Home page `/`, slow scroll past the headline and the live totals. | "When floods hit central Vietnam, people give fast. ReliefCloak is a relief platform where residents report what they need, organizers run campaigns, and donors can follow every đồng from gift to payout." |

## 2. The constraint (0:20–0:40)

| On screen | Voiceover |
| --- | --- |
| Simple slide or animation: one "Admin" box with arrows to "Grant myself roles", "Approve", "Pay out". | "The problem is trust. In most systems, one admin who controls the login server can give themselves every role, approve their own payout and send the money. Donors only have a promise that this won't happen." |
| Cut to the home page "Why" section. | "So we split that power across people who can't override each other." |

## 3. The prototype (0:40–1:40)

**3a. Donate (0:40–0:55)**

| On screen | Voiceover |
| --- | --- |
| Account menu, sign in as **An**. Open the Hue campaign, enter 200,000 ₫, confirm, show the receipt. | "An, a resident, donates to the Hue campaign. The receipt is clearly marked simulated, and the public page shows the amount with no donor name." |

**3b. Payouts get refused (0:55–1:15)**

Show the payouts that get refused before the one that goes through.

| On screen | Voiceover |
| --- | --- |
| Sign in as **Minh**, `/admin/disbursements`, **Propose payout**. Hue campaign, amount **25,000,000**, recipient "Cửa hàng X", purpose "Mua hàng". **Submit for audit**. Zoom on the red error **"This campaign has insufficient available funds."** | "Minh, the fund admin, tries to pay out more than the campaign holds. The server refuses: the balance is recomputed from every donation, not taken from a number someone typed." |
| Same form again, amount **2,000,000**, recipient "Tài khoản cá nhân Minh", purpose "Chi phí khác". Submit. It appears as **Pending audit**. | "So he proposes a smaller payout to his own account." |
| Sign in as **Hà**, open that payout. Audit note "Người nhận không phải điểm hỗ trợ, thiếu chứng từ". Decision **Reject**, **Save decision**. Badge changes to **Rejected**. | "Hà, the independent auditor, sees the recipient and rejects it." |
| Sign in as **Tuấn**, filter **Rejected**. The card has no execute button. | "Tuấn, the officer, has nothing to execute. A rejected payout can never be paid." |

**3c. Three different people for one payout (1:15–1:28)**

| On screen | Voiceover |
| --- | --- |
| Speed up 2×: **Hà** approves the seeded 3,000,000 ₫ bottled-water payout, then **Tuấn** clicks **Execute simulated payout**, **Confirm payout**. Refresh and show it is **paid** once, with all three steps filled in. | "A genuine payout for bottled water passes the audit, and only then can Tuấn execute it, once. Proposer, auditor and officer must be three different people." |

**3d. TideCloak's role (1:28–1:42)**

| On screen | Voiceover |
| --- | --- |
| Sign in as **Minh**, `/governance`. Create change request: Grant `auditor` to Minh, then **Authorize**. Zoom on **1/2 authorized, Awaiting quorum**. | "Then can't Minh just make himself the auditor? This is TideCloak's part. Every role change needs a quorum of independent admins, so his own signature leaves it stuck at one of two." |
| Sign in as **Hà**, `/governance`, click **Deny**. Badge: **Denied**. | "Hà refuses it, and his roles stay the same." |
| On-screen caption (small, bottom): "TideCloak simulated locally: same token claims and quorum rule. Live Tide network was under load." | |

## 4. What changes (1:42–2:00)

| On screen | Voiceover |
| --- | --- |
| `/transparency`: raised, paid out, available. The 3,000,000 ₫ payout shows as paid. The 2,000,000 ₫ one shows as rejected and is not counted in "paid out". | "The public sees everything: what came in, what went out, and the payout that was blocked." |
| Back to the title card with the repo URL. | "Donors no longer have to trust a single admin. Residents get help faster because people give with confidence. And with TideCloak, no one, not even whoever runs the server, can hand themselves the keys. ReliefCloak." |

---

## Honesty checklist (keep the claims accurate)

- Say "simulated" on screen for both the donations and the TideCloak sign-in. Judges will check the repo, and `docs/TIDE_INTEGRATION.md` says this openly.
- The quorum applies to **role changes**. The per-payout three-person rule is an app check today, not a Tide signature. The script above keeps those two separate. Don't merge them into "every payout is signed by Tide".
- The line "not even whoever runs the server" describes real TideCloak. In the simulation the server holds the key. If you want to be strict, add "in production" to that sentence.

## Shot tips

- Cursor highlight on, mouse moves slow. Pause about 1 s before each click.
- Speed up the typing and account switching 2× in editing. Keep the result screens (receipt, 1/2 authorized, Denied, transparency) at normal speed.
- Record the voiceover separately and lay it over the clips. It is easier to time.
- Add captions. Many judges watch muted.
