# ReliefCloak — Kế hoạch cho team

> Đọc file này trước khi code. Hạn nộp: **18:00 hôm nay (22/10, giờ VN)**.
> Chỉ làm phần lõi. Phần lặt vặt (map, upload ảnh thật, thanh toán thật, responsive đẹp) thì **bỏ qua**.

---

## 0. Ý tưởng trong 1 câu

Thông tin nhận tiền của nạn nhân (STK, CCCD) **luôn bị mã hóa bằng TideCloak**. Chìa khóa giải mã chỉ xuất hiện khi **Tình nguyện viên + Chủ quỹ + Kiểm toán** cùng ký. Admin hay người nắm database **không thể một mình** đọc hay chi tiền.

**Câu ban giám khảo sẽ hỏi:** *"Nếu dùng login thường thì app có chạy y hệt không?"*
→ **Không.** Với login thường, admin sửa DB là chi được tiền. Với TideCloak, admin sửa DB cũng không mở được STK. Trang `/rogue` dùng để chứng minh điều này.

### ⚠️ Phát hiện quan trọng về TideCloak (Người 1 đọc kỹ)

Đã kiểm tra SDK thật (`@tidecloak/nextjs` 0.14.40, template `@tidecloak/create-nextjs`):

- `doEncrypt`/`doDecrypt` dùng role `_tide_<tag>.selfencrypt` / `.selfdecrypt`. Template ghi rõ: **self**-encrypt nghĩa là dữ liệu gắn với danh tính **người mã hóa**, chỉ người đó giải mã được.
  → Nếu Field Worker mã hóa thì **Officer KHÔNG mở được** bằng `selfdecrypt` thông thường.
- Cách đúng cho ý tưởng của mình là **Policy-Protected Decryption with approval** (có trong SDK):
  `draftDecryption()` → `requestTideOperatorApproval()` (Chủ quỹ + Auditor duyệt) → `commitDecryption(request, policy)`.
  Cần một **Tide Policy + Forseti contract** đã ký. Tài liệu tạo policy đang ghi "coming soon", nên **hỏi ngay Tide MCP / Discord #support**: *"How do I create a signed decryption policy requiring 2 approvers (org_admin + auditor) so a disburser can decrypt data encrypted by a field_worker?"*
- **IGA (quorum duyệt thay đổi quyền) chắc chắn có sẵn:** template bật IGA, mọi thay đổi user/role tạo change request PENDING cần admin duyệt. Đây là cảnh "admin tự cấp quyền thì bị kẹt".

**Phương án B** (nếu policy không kịp trước ~14:00): Officer mã hóa và giải mã cùng một danh tính, cụ thể là Field Worker nhập STK trên máy của Officer, hoặc tạo một tài khoản "Disbursement Desk". Quyền `_tide_payout.selfdecrypt` của tài khoản đó chỉ được cấp qua IGA với đủ 2 admin duyệt. Admin và DB vẫn không đọc được STK, và không ai tự cấp quyền được.

---

## 1. Các vai trò

| User demo | Role app | Quyền TideCloak |
|---|---|---|
| Field Worker (tình nguyện viên) | `field_worker` | `_tide_payout.selfencrypt`: chỉ **khóa** được |
| Chủ quỹ | `org_admin` + `tide-realm-admin` | 1 phiếu quorum |
| Auditor (kiểm toán) | `auditor` + `tide-realm-admin` | 1 phiếu quorum |
| Disbursement Officer | `disburser` | `_tide_payout.selfdecrypt`, **chỉ có sau khi đủ quorum** |
| Người quyên góp | không login | Chỉ xem `/public` |

---

## 2. Flow chính

```
① Field Worker  →  /claim/new
   Nhập: tên, vùng, số tiền, GPS, ảnh (giả lập), STK, CCCD
   Browser: doEncrypt(STK, CCCD, tag "payout")
   POST /api/claims  (chỉ gửi ciphertext)              ✍️ Chữ ký 1

② Chủ quỹ + Auditor  →  /claims
   Thấy: vùng, số tiền, GPS, ảnh. KHÔNG thấy STK (🔒)
   POST /api/claims/:id/approve
   Luật: không tự duyệt claim của mình, không duyệt 2 lần

③ Đủ 2 approve → mở đợt chi
   Change request trong TideCloak: gán _tide_payout.selfdecrypt cho Officer
   Chủ quỹ duyệt                                        ✍️ Chữ ký 2
   Auditor duyệt → Tide Fabric ký → quyền có hiệu lực   ✍️ Chữ ký 3

④ Officer  →  /disburse
   Browser: doDecrypt(ciphertext) → thấy STK
   POST /api/claims/:id/release → status PAID (giả lập chi tiền)

⑤ Người quyên góp  →  /public
   Thấy: vùng, số tiền, trạng thái, ai duyệt và lúc nào. STK/CCCD vẫn 🔒
```

### ⚠️ Nguyên tắc số 1

**Mã hóa và giải mã CHỈ chạy trên trình duyệt** (gọi `doEncrypt`/`doDecrypt` trong component client).
API route và DB **không bao giờ** nhận hay lưu plaintext STK/CCCD. Làm sai chỗ này là mất luôn luận điểm chính.

---

## 3. Demo tấn công: `/rogue`

| Tấn công | Kết quả mong đợi |
|---|---|
| Sửa DB: `status = 'PAID'` | Không có lệnh chi thật, vì Officer chưa có quyền decrypt |
| Sửa STK trong DB thành tài khoản của mình | Giải mã thất bại (ciphertext hỏng) |
| Bơm claim ma với STK dạng plaintext | Không phải ciphertext hợp lệ nên bị loại |
| Chủ quỹ tự cấp quyền decrypt cho mình | Change request kẹt ở *pending*, chờ Auditor |

---

## 4. Cấu trúc project (MVC nhẹ trên Next.js)

Khung đã được dựng sẵn từ template chính thức `@tidecloak/create-nextjs` (Next.js 16 + React 19), đặt ở **gốc repo** (không có `src/`):

```
ReliefCloak/
├── README.md
├── docs/TEAM_PLAN.md            ← file này
├── tidecloak.json               ← "{}" cho tới khi chạy `npm run init` (Người 1)
├── init/                        ← script + realm.json của Tide (đã thêm role ReliefCloak)
├── .env.example                 ← NEXT_PUBLIC_TIDE_MOCK=true/false
├── data/db.seed.json            ← dữ liệu mẫu (db.json tự tạo khi chạy, không commit)
├── public/photos/               ← ảnh mẫu hiện trường
├── app/                         ← VIEW
│   ├── layout.tsx               bọc <TideProvider> + NavBar
│   ├── page.tsx                 Trang chủ
│   ├── auth/redirect/page.tsx   Trang Tide quay về sau khi login
│   ├── claim/new/page.tsx       ①
│   ├── claims/page.tsx          ②
│   ├── disburse/page.tsx        ④
│   ├── public/page.tsx          ⑤
│   ├── rogue/page.tsx           Demo tấn công
│   └── api/                     ← CONTROLLER (mỏng: lấy user, gọi service)
│       ├── claims/route.ts
│       ├── claims/[id]/approve/route.ts
│       ├── claims/[id]/release/route.ts
│       └── rogue/route.ts
├── services/claimService.ts     Luật nghiệp vụ
├── models/
│   ├── claim.ts                 type Claim, ClaimStatus, Role
│   └── db.ts                    Đọc/ghi data/db.json
├── lib/
│   ├── tide.tsx                 useTide(): login, hasRole, encryptField, decryptField, authFetch (mock + thật)
│   ├── auth.ts                  Server: lấy user từ token (hoặc header mock)
│   └── useClaims.ts             Hook tải danh sách claim
└── components/
    ├── NavBar.tsx               Menu + chọn vai (mock) / đăng nhập
    ├── RequireRole.tsx
    ├── ClaimCard.tsx
    ├── StatusBadge.tsx
    └── EncryptedField.tsx       Hiện 🔒 hoặc plaintext
```

**Chạy thử ngay (mock, chưa cần TideCloak):**
```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_TIDE_MOCK=true
npm run dev                    # http://localhost:3000, chọn vai ở góc phải
```

| Lớp | Làm gì | KHÔNG làm gì |
|---|---|---|
| Model | Kiểu dữ liệu, đọc/ghi DB | Logic duyệt |
| Service | Luật: đủ approve, không tự duyệt, chuyển trạng thái | UI |
| Controller (`api/`) | Verify token, check role, gọi service | Giải mã |
| View | UI, gọi encrypt/decrypt qua `lib/tide.ts` | Tự quyết luật |

### Model `Claim`

```ts
type ClaimStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

interface Claim {
  id: string;
  victimName: string;
  region: string;
  amount: number;
  gps: string;                    // "16.4637, 107.5909"
  photoUrl: string;               // ảnh mẫu trong /public
  createdBy: string;              // userId của Field Worker
  createdAt: string;
  encryptedBankAccount: string;   // ciphertext từ doEncrypt
  encryptedNationalId: string;    // ciphertext từ doEncrypt
  approvals: { userId: string; role: 'org_admin' | 'auditor'; at: string }[];
  status: ClaimStatus;
  paidAt?: string;
}
```

---

## 5. Tech stack

| Phần | Chọn |
|---|---|
| Framework | Next.js (App Router) + TypeScript, dựng từ **TideCloak Quickstart** |
| Auth / mã hóa / quorum | **TideCloak** (chạy Docker) + SDK `@tidecloak/nextjs` |
| DB | File JSON (`data/db.json`) |
| UI | Tailwind CSS |
| GPS / ảnh | Text tọa độ + ảnh mẫu tĩnh (không làm map, không upload) |

---

## 6. Chia việc

| Người | Việc | Xong khi |
|---|---|---|
| **1. Tide** | Chạy Quickstart, tạo realm + 4 user + role, cấu hình quorum, viết `lib/tide.ts`, `lib/auth.ts` | Login được 4 vai; encrypt/decrypt chạy; Officer chưa có quyền thì decrypt lỗi |
| **2. Backend** | `models/`, `services/`, `api/` (kể cả `api/rogue`) | Gọi API bằng curl/Postman chạy đúng luật |
| **3. Frontend** | `/claim/new`, `/claims`, `/disburse`, `/public` + components | Đi hết flow ① → ⑤ trên UI |
| **4. Demo** | `/rogue`, viết lại README overview (≤300 từ), kịch bản + quay `demo.mp4` (2 phút, <100MB) | Video có đủ: vấn đề → vì sao không tin được → demo → điều gì thay đổi |

Người 2 và 3 có thể làm song song từ đầu bằng cách **mock `lib/tide.ts`** (encrypt = base64), rồi thay bằng hàm thật khi người 1 xong.

### 6.1 Hợp đồng chung: chốt trong 15 phút đầu, sau đó KHÔNG tự ý đổi

Nhờ 3 hợp đồng này, 4 người code song song được mà không phải chờ nhau.

> ✅ Cả 3 hợp đồng đã được code sẵn: `models/claim.ts`, `lib/tide.tsx` (hook `useTide()`, có cả bản mock lẫn bản Tide thật), và các route trong `app/api/`. Phần dưới đây giữ lại để tham khảo.

**a) Type `Claim`:** xem `models/claim.ts`.

**b) `lib/tide.tsx`:** thực tế là hook `useTide()` trả về các hàm dưới đây. Mock bật/tắt bằng `NEXT_PUBLIC_TIDE_MOCK`:

```ts
// Chạy trên client (component có "use client")
export async function encryptField(plain: string): Promise<string>;      // tag "payout"
export async function decryptField(cipher: string): Promise<string>;     // throw nếu không có quyền / ciphertext hỏng
export function hasRole(role: string): boolean;
export function currentUser(): { id: string; name: string; roles: string[] };
```

Bản mock để Người 3 dùng trước:

```ts
export async function encryptField(p: string) { return 'MOCK:' + btoa(p); }
export async function decryptField(c: string) {
  if (!c.startsWith('MOCK:')) throw new Error('Cannot decrypt');
  return atob(c.slice(5));
}
```

**c) API:** Người 2 viết, Người 3 gọi.

| Method | Path | Ai gọi | Body | Trả về / lỗi |
|---|---|---|---|---|
| GET | `/api/claims` | tất cả (kể cả `/public`) | — | `Claim[]` |
| POST | `/api/claims` | `field_worker` | `Claim` trừ `id`, `approvals`, `status`, `createdAt` | `Claim` mới. 400 nếu STK/CCCD không phải ciphertext |
| POST | `/api/claims/:id/approve` | `org_admin`, `auditor` | — | `Claim`. 403 nếu sai role, 409 nếu đã duyệt hoặc tự duyệt |
| POST | `/api/claims/:id/release` | `disburser` | — | `Claim` (PAID). 409 nếu chưa đủ 2 approve |
| POST | `/api/rogue` | trang `/rogue` (không cần auth, đóng vai "admin DB") | `{ attack: 'set-paid' \| 'swap-account' \| 'fake-claim', claimId? }` | `{ ok, message }` |

### 6.2 Checklist từng người

**👤 Người 1: Tide / hạ tầng** (việc khó nhất, nên giao người vững kỹ thuật nhất)
- [ ] Clone TideCloak Quickstart (Next.js) vào repo, chạy Docker TideCloak, push khung lên `main` **sớm nhất có thể**
- [ ] Hỏi Tide MCP / Hackbot: tên role encrypt/decrypt theo tag, cách bật quorum khi gán role
- [ ] Tạo realm, các role `field_worker`, `org_admin`, `auditor`, `disburser` và 4 user demo (+ 2 admin realm)
- [ ] Gán `_tide_payout.selfencrypt` cho Field Worker. Officer **chưa** có selfdecrypt
- [ ] Viết `lib/tide.ts` thật (đúng chữ ký ở 6.1b) + `lib/auth.ts` (verify token, lấy roles ở server)
- [ ] Bật quorum: gán selfdecrypt cho Officer cần cả Chủ quỹ + Auditor duyệt
- [ ] Ghi các bước setup vào phần Setup của README (cho Người 4)

**👤 Người 2: Backend**
- [ ] `models/claim.ts` (push ngay), `models/db.ts`, `data/db.json` với 2–3 claim mẫu
- [ ] `services/claimService.ts`: `createClaim`, `approve` (chặn sai role, tự duyệt, duyệt 2 lần; đủ 2 phiếu thì APPROVED), `release` (chỉ khi APPROVED)
- [ ] 4 route trong `api/claims/...` đúng bảng 6.1c. Lúc đầu đọc role từ header `x-role` để test, sau đổi sang `lib/auth.ts`
- [ ] `api/rogue/route.ts`: sửa thẳng `db.json` cho 3 kiểu tấn công
- [ ] Test hết bằng curl / Postman

**👤 Người 3: Frontend**
- [ ] Layout chung + trang chủ chọn vai / login
- [ ] Components: `StatusBadge`, `EncryptedField` (🔒 hoặc plaintext), `ClaimCard`, `ApproveButton`
- [ ] `/claim/new`: form, gọi `encryptField` cho STK/CCCD **trước khi** POST
- [ ] `/claims`: danh sách + nút Approve, hiện ai đã duyệt
- [ ] `/disburse`: nút "Mở khóa" gọi `decryptField` (lỗi thì hiện "🔒 Không có quyền"), sau đó nút Release
- [ ] `/public`: bảng công khai, không cần login

**👤 Người 4: Demo / nộp bài**
- [ ] `/rogue`: 4 nút tấn công, mỗi nút hiện kết quả "❌ Thất bại vì …" (gọi `/api/rogue` + thử `decryptField`)
- [ ] Viết lại phần overview của README (≤300 từ, 1 câu mô tả + 5 câu trả lời theo tiêu chí chấm), dùng mục 9 cho câu chữ
- [ ] Chuẩn bị dữ liệu demo: tên, vùng, số tiền, ảnh mẫu lũ trong `public/`
- [ ] Viết lời thoại theo mục 8, tập chạy demo với cả team lúc ~15:30
- [ ] 16:30 quay `demo.mp4` (<100MB), push, kiểm tra repo public, nộp Google Form

### 6.3 Quy tắc làm việc chung

- Mỗi người chỉ sửa thư mục của mình. Cần sửa file của người khác thì nhắn trước.
- Commit nhỏ, `git pull --rebase` trước khi push, push thường xuyên.
- Cứ 1,5 tiếng sync 5 phút: xong gì, kẹt gì.
- Kẹt TideCloak quá 30 phút thì hỏi #support trên Discord của Tide, đồng thời chuyển sang phương án B.

---

## 7. Thứ tự & mốc thời gian

1. **Ngay bây giờ:** Người 1 hỏi Tide MCP / Hackbot: *tên role chính xác cho encrypt/decrypt theo tag* và *cách bật quorum khi gán role* trong Quickstart.
2. Quickstart chạy được + `doEncrypt`/`doDecrypt` test OK.
3. Luồng chính ① → ④ chạy end-to-end.
4. Quorum cho việc gán role decrypt.
5. `/rogue` + `/public`.
6. **Muộn nhất 16:30:** dừng code, quay video, push repo, nộp form.

**Phương án B** nếu quorum không kịp: giữ phần mã hóa thật, quay cảnh 2 admin duyệt change request trong TideCloak admin console.

---

## 8. Kịch bản video 2 phút

| Thời gian | Nội dung |
|---|---|
| 0:00–0:20 | Lũ ở Huế, quỹ nhận tiền quyên góp, người dân không tin admin |
| 0:20–0:40 | Hệ thống cũ: admin sửa DB là chi được tiền cho tài khoản ma |
| 0:40–1:30 | Demo: Field Worker tạo claim (STK 🔒) → Chủ quỹ + Auditor duyệt → Officer mở khóa → PAID |
| 1:30–1:50 | `/rogue`: 4 tấn công đều thất bại |
| 1:50–2:00 | `/public`: người quyên góp thấy ai duyệt, tiền đi đâu, danh tính nạn nhân vẫn được bảo vệ |

---

## 9. Câu chữ nên tránh / nên dùng

| ❌ Tránh | ✅ Dùng |
|---|---|
| "Minh bạch 100%", "không thể đảo ngược" | "Không một bên nào có thể **đơn phương** chi tiền" |
| "Bảo chứng bằng toán học" | "Chìa khóa giải mã chỉ xuất hiện khi Chủ quỹ **và** Kiểm toán cùng ký" |
| "Rút sạch tiền trong quỹ" | "Tạo lệnh chi cho tài khoản ma" |
| Nói app chuyển tiền thật | "Chi tiền được giả lập" |
