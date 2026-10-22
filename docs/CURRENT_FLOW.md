# Flow hiện tại và kế hoạch TideCloak

## Cập nhật phần admin — 22/10/2026

- `/admin` có tổng quan, report, chiến dịch, kiểm toán/giải ngân và nhật ký; giao diện Việt–Anh.
- Luồng: NEW → VERIFYING → ACCEPTED/REJECTED; chiến dịch DRAFT → PUBLISHED → CLOSED.
- Ba danh tính độc lập đề xuất, duyệt và chi mô phỏng; kiểm tra số dư, chi trùng và idempotency tại backend.
- Kho dữ liệu chung `data/relief.json` giữ report/post cũ khi chuyển đổi. `/api/transparency` chỉ trả trường công khai.
- Phần user/quyên góp của Khải nối vào hàm dùng chung theo `docs/ADMIN_HANDOFF.md`.
- Endpoint giải ngân cũ `/api/claims/:id/release` đã ngừng hoạt động (410); dữ liệu claim cũ không nằm trong sổ chiến dịch mới.
- TypeScript, build, kiểm tra service và luồng HTTP đã qua. Chưa kiểm tra hình thức bằng trình duyệt vì công cụ browser đang bị tắt.
- Tide thật: container local và realm `reliefcloak` đã tạo, IGA đã bật. Đang chờ người dùng đăng ký quản trị viên đầu tiên. App vẫn dùng mock; chưa xác minh login/quorum hoặc policy cho từng giao dịch.

Chi tiết API, chạy thử và chia việc: [ADMIN_HANDOFF.md](ADMIN_HANDOFF.md).

Các mục bên dưới ghi lại baseline trước khi có khu admin mới.

Chạy mock: sao chép `.env.example` thành `.env.local`, `npm ci`, `npm run dev`. Chọn An để gửi report; chọn Minh để duyệt và đăng bài; mở `/posts` để xem. `npm run test:community` kiểm tra quyền và tính riêng tư của luồng. Dùng webpack vì Turbopack lỗi tiến trình biên dịch CSS trên máy Windows hiện tại.

## Đã triển khai

- Người đăng nhập gửi report tại `/reports`. Report không tự xuất hiện trên bảng tin.
- API chỉ trả report cho người gửi hoặc `org_admin`.
- Chỉ `org_admin` đăng bài tại `/api/posts`, từ một report đã tiếp nhận. Admin viết nội dung công khai riêng, không tự sao chép report.
- `/posts` công khai bài đã đăng. Không trả danh tính người report.
- Quyền đăng bài độc lập với `auditor` và `disburser`.
- Dữ liệu report dùng file JSON cục bộ, không được mã hóa. Chỉ dùng dữ liệu tổng hợp cho demo; không nhập thông tin định danh nhạy cảm.

## TideCloak: kế hoạch và giới hạn

Repo có SDK và adapter xác thực; `tidecloak.json` hiện trống. Mock mode không cung cấp bảo mật thực: header mock và base64 chỉ dùng phát triển.

1. Cấu hình realm thật, xác minh token server-side; người dân dùng `appUser`, người đăng bài dùng `org_admin`.
2. Bảo vệ việc cấp/đổi quyền nhạy cảm bằng Tide QEA. Theo tài liệu hiện tại, ngưỡng mặc định `max(1, floor(0.7*N))`: 2 quản trị viên chỉ cần 1 phiếu; 3 quản trị viên cần 2. Phải xác minh lại trên instance thực. Tài liệu còn nêu master realm không chịu QEA: cần ghi rõ ranh giới quyền hạ tầng trong demo.
3. Demo mục tiêu: tự cấp quyền nhạy cảm → pending → chưa đủ quorum bị từ chối → đủ quorum mới có hiệu lực. Điều này là quản trị quyền, không phải phê duyệt từng khoản chi.
4. Để chứng minh từng khoản chi không thể bị backend vượt qua, cần Forseti policy ràng buộc hồ sơ, số tiền, người nhận, danh tính người duyệt và chống phát lại; nơi thực thi chi phải kiểm tra bằng chứng đó. Chưa triển khai.

`doEncrypt/selfdecrypt` không tự giải quyết chia sẻ dữ liệu giữa Field Worker và Officer. Hai nút approve hiện lưu dữ liệu ứng dụng, chưa tạo chữ ký mật mã. Không dùng cảnh sửa DB trong mock để tuyên bố đã chứng minh bảo mật Tide.

Nguồn: https://docs.tide.org/Core-Concepts/iga-workflow và https://docs.tide.org/Core-Concepts/forseti-engine

Tài liệu TEAM_PLAN cũ cần đọc cùng bản cập nhật này; ngưỡng hai admin và mô tả ba chữ ký trong tài liệu cũ chưa được xác nhận.
