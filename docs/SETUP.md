# Hướng dẫn chạy ReliefCloak (cho team)

> Kế hoạch tổng thể và chia việc: xem [TEAM_PLAN.md](TEAM_PLAN.md).

## 1. Cần cài sẵn

| Công cụ | Phiên bản | Kiểm tra |
|---|---|---|
| Node.js | 20.9 trở lên | `node -v` |
| Git | bất kỳ | `git --version` |
| Docker | chỉ Người 1 cần (chạy TideCloak thật) | `docker --version` |

## 2. Lấy code về

Lần đầu:
```bash
git clone <link-repo-github-của-nhóm>
cd ReliefCloak
```

Những lần sau (trước khi bắt đầu code):
```bash
git pull
```

## 3. Cài package

```bash
npm install
```

Mạng yếu bị lỗi `ECONNRESET` thì chạy lại lệnh trên, hoặc:
```bash
npm install --fetch-retries=5
```

## 4. Tạo file cấu hình

Copy `.env.example` thành `.env.local`:

- Git Bash / macOS / Linux:
  ```bash
  cp .env.example .env.local
  ```
- PowerShell:
  ```powershell
  Copy-Item .env.example .env.local
  ```

Nội dung mặc định là `NEXT_PUBLIC_TIDE_MOCK=true` (mock mode, **không cần TideCloak**).

## 5. Chạy app

```bash
npm run dev
```

Mở http://localhost:3000 và **chọn vai ở góc phải** (chỉ có trong mock mode).

## 6. Đi thử toàn bộ flow (mock mode)

| Bước | Chọn vai | Vào trang | Làm gì |
|---|---|---|---|
| ① | Lan (Field Worker) | Tạo claim | Điền form, nhập STK/CCCD → "Mã hóa & gửi claim" |
| ② | Minh (Chủ quỹ) | Duyệt claim | Bấm ✍️ Duyệt. STK hiện 🔒 |
| ② | Hà (Auditor) | Duyệt claim | Bấm ✍️ Duyệt → claim thành "Đủ chữ ký" |
| ④ | Tuấn (Officer) | Giải ngân | 🔓 Mở khóa STK → 💸 Giải ngân |
| ⑤ | (bất kỳ) | Công khai | Xem ai đã duyệt, tổng tiền đã chi |
| 🏴‍☠️ | Tuấn (Officer) | Rogue Admin | Bấm các tấn công → đều "Giải mã thất bại" |

**Làm lại từ đầu:** vào `/rogue` bấm "Khôi phục DB mẫu", hoặc:
```bash
npm run reset-db
```

Dữ liệu nằm ở `data/db.json` (tự tạo từ `data/db.seed.json`, không commit lên git).

## 7. Chạy với TideCloak thật (Người 1)

1. Chạy TideCloak server bằng Docker ở http://localhost:8080 (theo hướng dẫn getting-started của Tide).
2. Sửa `init/.env.example` nếu cần (URL, tên realm, tài khoản admin). Script đọc giá trị mặc định từ file này.
3. Mở **Git Bash** (cần `curl` và `jq`), rồi chạy:
   ```bash
   npm run init
   ```
   Script sẽ tạo realm (đã có sẵn các role ReliefCloak), bật IGA và ghi ra `tidecloak.json`.
4. Trong `.env.local`, đổi thành `NEXT_PUBLIC_TIDE_MOCK=false`.
5. Trong TideCloak admin console: tạo 4 user, gán role:
   - Field Worker: `field_worker`, `_tide_payout.selfencrypt`
   - Chủ quỹ: `org_admin` (+ `tide-realm-admin`)
   - Auditor: `auditor` (+ `tide-realm-admin`)
   - Officer: `disburser` (`_tide_payout.selfdecrypt` chỉ cấp qua change request đủ 2 admin duyệt)
6. Chạy lại:
   ```bash
   npm run dev
   ```

⚠️ Đọc mục **"Phát hiện quan trọng"** trong [TEAM_PLAN.md](TEAM_PLAN.md) về giới hạn của `selfdecrypt`.

## 8. Quy trình git hằng ngày

```bash
git pull --rebase origin main
```
```bash
git add <các file mình sửa>
```
```bash
git commit -m "mô tả ngắn"
```
```bash
git push origin main
```

- Chỉ sửa thư mục mình phụ trách (xem TEAM_PLAN mục 6).
- **Không commit:** `node_modules/`, `.env.local`, `data/db.json` (đã có trong `.gitignore`).
- Push bị `rejected` thì chạy lại `git pull --rebase origin main` rồi push.

## 9. Lỗi thường gặp

| Lỗi | Cách sửa |
|---|---|
| Trang báo "Hãy đăng nhập (hoặc chọn vai…)" | Chọn vai ở góc phải |
| Không thấy ô chọn vai | Kiểm tra `.env.local` có `NEXT_PUBLIC_TIDE_MOCK=true`, rồi tắt và chạy lại `npm run dev` |
| `Port 3000 is in use` | Tắt terminal đang chạy app khác, hoặc `npm run dev -- -p 3001` |
| `Cannot find module ...` | Chạy lại `npm install` (thường do vừa `git pull` có package mới) |
| Dữ liệu demo bị rối | `npm run reset-db` |
| `npm run init` lỗi trên Windows | Chạy trong Git Bash, kiểm tra đã cài `jq` và TideCloak đang chạy ở cổng 8080 |
