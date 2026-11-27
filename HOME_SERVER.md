# YouTube chạy online mà không cần máy tính cá nhân của bạn

**Vấn đề:** YouTube chặn IP của máy chủ cloud (Render...). IP nhà dân thì thường được. Cách miễn phí duy nhất để YouTube chạy 24/7 mà không bật máy tính của bạn là dùng **một thiết bị riêng ở nhà bật liên tục** (laptop/mini PC cũ, Raspberry Pi) làm backend chỉ cho YouTube. Các nền tảng khác vẫn chạy trên Render.

Phần web đã sẵn sàng: nếu GitHub có biến `YT_API_BASE_URL`, riêng YouTube sẽ gọi sang địa chỉ đó, mọi thứ khác không đổi.

## Các bước (chưa được thử trên thiết bị thật, hãy làm từng bước và báo lỗi)
1. Trên thiết bị cũ: cài Docker, tải mã nguồn (zip từ GitHub), tạo `backend/.env` từ `backend/.env.example` rồi sửa:
   - `ALLOWED_ORIGINS=https://anhditdz207-star.github.io`
   - `TRUST_PROXY=true`
2. Chạy `docker compose up -d --build` (backend nghe cổng 8000). Mở `http://localhost:8000/healthz` để kiểm tra.
3. Tạo địa chỉ https công khai cho cổng 8000 bằng đường hầm miễn phí. Hai lựa chọn (mình chưa kiểm tra lại giới hạn hôm nay):
   - **Cloudflare quick tunnel**: `cloudflared tunnel --url http://localhost:8000` cho một địa chỉ ngẫu nhiên, đổi mỗi lần chạy lại, nên mỗi lần đổi phải cập nhật biến ở bước 4.
   - **Tailscale Funnel**: địa chỉ cố định dạng `*.ts.net`, cần tài khoản Tailscale của bạn.
4. GitHub → Settings → Secrets and variables → Actions → Variables → thêm `YT_API_BASE_URL` = địa chỉ ở bước 3 (không có dấu `/` cuối), rồi chạy lại workflow Pages.

## Lưu ý
- Thiết bị phải cắm điện và nối mạng; tắt là YouTube ngừng chạy (các nền tảng khác không ảnh hưởng).
- Lưu lượng đi qua mạng nhà bạn, và bạn là người đứng sau dịch vụ này.
- Không có gì bảo đảm YouTube sẽ không chặn IP nhà bạn nếu dùng quá nhiều.
