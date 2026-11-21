# TASK_CHECKLIST

## Milestone 1 — Research & architecture
- [x] Kiến trúc: Vite + React + TS + Tailwind (GitHub Pages) / FastAPI + yt-dlp + FFmpeg (Docker, Render)
- [x] Cấu trúc project, .env.example, .gitignore
- [ ] Kiểm tra commit, issue, license của yt-dlp, ReClip, MeTube, SocialClip (làm đầu Milestone 4)
- [ ] Phân tích giới hạn Render free (làm trước Milestone 6)

## Milestone 2 — Frontend foundation
- [x] Header: logo, tên, công tắc viên thuốc, badge nền tảng
- [x] Công tắc: kéo, bấm nửa trái/phải, nhấp đúp đổi ngày/đêm, bàn phím
- [x] Phong cảnh pixel SVG ngày/đêm + chuyển cảnh
- [x] Khung nhập URL (chưa hoạt động)
- [ ] Kiểm thử thủ công trên trình duyệt (chưa làm)
- [ ] Icon YouTube/TikTok chính thức (hiện là bản đơn giản hóa)

## Milestone 3 — Download interfaces
- [x] Luồng: dán URL, kiểm tra tên miền, đang tải, lỗi tiếng Việt, kết quả
- [x] Panel Video/Audio, chọn định dạng, tùy chọn không khả dụng bị vô hiệu hóa
- [x] Hợp đồng API: POST /api/info, GET /api/download (backend làm ở Milestone 4)
- [x] Chế độ dữ liệu giả (VITE_USE_MOCK) có nhãn rõ, tắt nút tải
- [ ] Tiến trình tải (cần backend hỗ trợ)
- [ ] Kiểm thử thủ công trên trình duyệt (chưa làm)

## Milestone 4 — Backend
- [x] Đánh giá repo: yt-dlp (Unlicense, hoạt động đến 19/11/2026, ~2800 issue mở), ReClip (MIT, Flask ~150 dòng, 42 issue). MeTube và SocialClip chưa kiểm tra được (GitHub API giới hạn tốc độ)
- [x] FastAPI: /api/info, /api/download, /healthz
- [x] Kiểm tra URL (https, đúng tên miền), giới hạn tốc độ, CORS, giới hạn thời lượng/dung lượng, 1 tác vụ cùng lúc, dọn file tạm
- [x] 13 unit test pass (dữ liệu yt-dlp giả)
- [x] Dockerfile, docker-compose.yml, render.yaml (CHƯA build thử, môi trường này không có Docker)
- [ ] Tải thật từ YouTube/TikTok (chưa thử, môi trường này không truy cập được)
- [ ] Hàng đợi/tiến trình kiểu MeTube (để sau nếu cần)

## Cập nhật theo yêu cầu mới
- [x] Chạy local-first: start.bat, backend phục vụ luôn giao diện đã build (dist/), chỉ nghe 127.0.0.1
- [x] CORS cho Private Network (14 test pass), sẵn sàng chuyển VPS qua docker compose
- [x] Dòng bản quyền "by Nguyễn Trung Nguyên" ở cả 3 trang
- [ ] start.bat chưa được chạy thử trên Windows thật (viết ở môi trường Linux)

## Hai viên thuốc: nhóm A (yêutừbé/tíctốc, ngang) và nhóm B (facebook/insta, dọc bên trái)
- [x] Chọn một nhóm thì viên thuốc nhóm kia ẩn đi; mỗi viên giữ nguyên vị trí (A ngang ở trên, B dọc bên trái), không xoay
- [x] Backend nhận Facebook, Instagram (chỉ nội dung công khai, không đăng nhập/cookie); 19 test pass
- [ ] Tải thật từ Facebook/Instagram chưa thử; Instagram thường yêu cầu đăng nhập nên có thể báo lỗi
- [ ] Icon Facebook/Instagram là bản đơn giản hóa, chưa xem trên trình duyệt thật

## Milestone 5 — Integration
- [ ] Chạy thật frontend + backend trên Windows 11 (cần người dùng thử, gửi lại lỗi nếu có)
- [ ] Sửa lỗi tương tác, thêm tiến trình tải nếu cần

## Milestone 6 — Deployment
- [x] Workflow GitHub Pages (.github/workflows/pages.yml), hướng dẫn trong README (chưa chạy thử trên GitHub)
- [ ] Build thử Docker, deploy Render hoặc VPS

## Lỗi/giới hạn đã biết
- Chưa kiểm thử tương tác trong trình duyệt thật
- Nút tải đang bị vô hiệu hóa có chủ đích
