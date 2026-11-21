# I LOVE DOWNLOAD

## Chạy nhanh trên Windows 11 (khuyến nghị)
Chỉ cần Python, FFmpeg và Deno (một lần, trong PowerShell, rồi mở lại cửa sổ):
```
winget install Python.Python.3.12
winget install Gyan.FFmpeg
winget install DenoLand.Deno
```
Sau đó **bấm đúp `start.bat`**. Script tự tạo môi trường Python, cài thư viện, rồi mở http://localhost:8000. Giao diện và backend chạy cùng một địa chỉ nên không cần Node.js, không cần cấu hình CORS. Đóng cửa sổ đen để tắt. Máy chủ chỉ nghe ở `127.0.0.1`, người khác trong mạng không truy cập được.
Muốn build lại giao diện sau khi sửa code: cài Node.js rồi chạy `start.bat rebuild`.

## Dùng trên điện thoại (cùng Wi-Fi với máy tính)
Chạy `start.bat lan`, xem địa chỉ IPv4 hiện ra (ví dụ 192.168.1.5), rồi trên điện thoại mở `http://192.168.1.5:8000`. Lần đầu Windows hỏi tường lửa thì chọn cho phép mạng riêng tư. Chỉ dùng ở mạng nhà. Trang GitHub Pages không gọi được backend từ điện thoại, vì `localhost` trên điện thoại là chính điện thoại.

## Dùng trang GitHub Pages với backend trên máy bạn
Trang trên GitHub Pages có thể gọi backend ở `http://localhost:8000` khi backend đang chạy. Thêm địa chỉ Pages vào `backend\.env`: `ALLOWED_ORIGINS=http://localhost:8000,https://<tên-github>.github.io`. Chrome/Edge có thể hỏi quyền truy cập mạng nội bộ, hãy cho phép. Safari có thể chặn, khi đó dùng http://localhost:8000. Vì backend chạy trên máy bạn nên chỉ bạn dùng được.

## Chuyển backend sang VPS sau này
Không phải viết lại: chạy `docker compose up -d --build`, rồi đặt biến `API_BASE_URL` của GitHub Pages thành địa chỉ VPS và `ALLOWED_ORIGINS` của backend thành địa chỉ Pages.

## Chạy frontend trên Windows 11
1. Cài Node.js LTS (https://nodejs.org).
2. Mở PowerShell trong thư mục dự án:
   ```
   npm install
   copy .env.example .env
   npm run dev
   ```
3. Mở http://localhost:5173

## Chạy backend trên Windows 11
1. Cài Python 3.12, FFmpeg và Deno (PowerShell):
   ```
   winget install Python.Python.3.12
   winget install Gyan.FFmpeg
   winget install DenoLand.Deno
   ```
   Mở lại PowerShell để nhận PATH mới.
2. Trong thư mục `backend`:
   ```
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt -r requirements-dev.txt
   copy .env.example .env
   python -m pytest -q
   uvicorn app.main:app --reload --port 8000
   ```
3. Kiểm tra http://localhost:8000/healthz (phải thấy `"ffmpeg": true`), rồi chạy frontend với `VITE_API_BASE_URL=http://localhost:8000` và `VITE_USE_MOCK=false`.

## Docker (VPS hoặc Render)
`docker compose up -d --build` (cần `backend/.env`). Render: dùng `render.yaml`, đặt `ALLOWED_ORIGINS` là địa chỉ GitHub Pages của bạn.
### Triển khai backend lên Render (miễn phí, không cần thẻ)
1. Đã push repo lên GitHub (có `render.yaml` ở thư mục gốc). Đăng ký render.com bằng tài khoản GitHub.
2. New → **Blueprint** → chọn repo `I-LOVE-DOWNLOAD` → khi được hỏi `ALLOWED_ORIGINS` nhập `https://<tên-github>.github.io` → Apply. Đợi build vài phút.
3. Lấy địa chỉ dạng `https://i-love-download-api-xxxx.onrender.com`, mở `/healthz` kiểm tra.
4. GitHub → Settings → Secrets and variables → Actions → Variables → sửa `API_BASE_URL` thành địa chỉ đó (không có dấu `/` ở cuối), rồi Actions → Re-run workflow.
Gói free tự ngủ sau 15 phút, lần đầu mở lại mất khoảng 1 phút. Cấu hình đang giới hạn 720p, 20 phút, 150 MB để vừa RAM 512 MB.

Giới hạn Render free: RAM nhỏ, tự ngủ khi không dùng, và YouTube hay chặn IP máy chủ cloud.
Luôn giữ yt-dlp mới (`pip install -U yt-dlp` hoặc build lại image) vì trang nguồn thay đổi thường xuyên.

## Bảo mật backend
Chỉ nhận `https` và đúng tên miền YouTube/TikTok, giới hạn tốc độ theo IP, CORS theo `ALLOWED_ORIGINS`, id định dạng kiểm tra bằng danh sách cố định, file tạm xóa sau khi gửi và quét định kỳ.

## Triển khai GitHub Pages
Đặt `VITE_BASE=/<tên-repo>/` khi build. Hướng dẫn đầy đủ ở Milestone 6.

## Triển khai frontend lên GitHub Pages
1. Đẩy mã lên GitHub (nhánh `main`). Nhớ commit cả `package-lock.json` (chạy `npm install` một lần trước khi commit).
2. Repo → Settings → Pages → Source: **GitHub Actions**.
3. Repo → Settings → Secrets and variables → Actions → tab **Variables** → thêm `API_BASE_URL` = địa chỉ backend (ví dụ `https://ten-dich-vu.onrender.com`). Đây là biến công khai, không đặt khóa bí mật ở đây.
4. Đặt `ALLOWED_ORIGINS` của backend thành `https://<tên-github>.github.io` (chỉ gồm origin, không có đường dẫn `/<repo>`).
5. Push lên `main`, workflow `pages.yml` sẽ build và đăng. Đổi backend sau này chỉ cần sửa `API_BASE_URL` rồi chạy lại workflow.
