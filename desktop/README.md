# I LOVE DOWNLOAD - bản app cho Windows (Tauri)

Cách hoạt động: Tauri (Rust) mở một cửa sổ và chạy ngầm backend Python (yt-dlp, gallery-dl, FFmpeg) ở `127.0.0.1:18765`.
Backend đồng thời phục vụ luôn giao diện React. Cửa sổ đầu tiên là màn hình chờ (`splash/`), khi backend sẵn sàng thì tự chuyển vào giao diện.
Vì chạy bằng IP nhà bạn nên YouTube thường không chặn.

## Build bằng GitHub (khuyên dùng, không cần cài Rust)
Repo → Actions → "Build desktop app (Windows)" → Run workflow. Khi xong, tải file `I-LOVE-DOWNLOAD-setup` ở cuối trang chạy, giải nén và chạy file `.exe` cài đặt.

## Build trên máy bạn
Cần: Node.js, Python 3.12, Rust (rustup.rs), Visual Studio Build Tools (workload "Desktop development with C++").
Mở PowerShell ở thư mục gốc dự án: `./desktop/scripts/build-all.ps1`.

## Lưu ý
- File cài chưa ký số nên Windows SmartScreen sẽ cảnh báo (More info → Run anyway). Một số phần mềm diệt virus hay báo nhầm file đóng gói Python.
- Chưa thử trên máy thật: nếu bước nào lỗi, gửi nguyên văn lỗi.
- Giao diện web (GitHub Pages + Render) vẫn giữ nguyên, không bị ảnh hưởng.
