@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === I LOVE DOWNLOAD ===
where python >nul 2>nul || (echo Chua co Python. Hay chay: winget install Python.Python.3.12 ^& mo lai cua so nay & pause & exit /b 1)
where ffmpeg >nul 2>nul || (echo Chua co FFmpeg. Hay chay: winget install Gyan.FFmpeg ^& mo lai cua so nay & pause & exit /b 1)
where deno >nul 2>nul || echo [Luu y] Chua co Deno, tai YouTube co the loi. Cai bang: winget install DenoLand.Deno
if not exist backend\.venv python -m venv backend\.venv
call backend\.venv\Scripts\activate.bat
pip install -q -r backend\requirements.txt || (echo Cai thu vien that bai & pause & exit /b 1)
if not exist backend\.env copy backend\.env.example backend\.env >nul
rem Build lai giao dien chi khi go: start.bat rebuild (can Node.js)
if /i "%1"=="rebuild" (
  where node >nul 2>nul || (echo Can Node.js de build lai & pause & exit /b 1)
  echo VITE_API_BASE_URL=> .env.production.local
  call npm install && call npm run build
)
if not exist dist\index.html (echo Thieu thu muc dist. Chay: start.bat rebuild & pause & exit /b 1)
echo Mo http://localhost:8000 (dong cua so nay de tat may chu)
start "" /b cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:8000"
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause
