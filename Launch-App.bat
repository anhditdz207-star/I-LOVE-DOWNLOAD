@echo off
chcp 65001 >nul
cd /d "%~dp0"
title I LOVE DOWNLOAD App

:: 1. Chay backend ngam neu chua bat
netstat -ano | findstr ":8000" >nul
if %errorlevel% neq 0 (
    if exist "%~dp0desktop\build-out\ild-backend.exe" (
        start /b "" "%~dp0desktop\build-out\ild-backend.exe" --port 8000
    ) else (
        start /b "" cmd /c "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
    )
    timeout /t 2 /nobreak >nul
)

:: 2. Mo cua so App rieng biet (khong co thanh dia chi, khong co tab web)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:8000" --window-size=1200,800
    exit /b 0
)

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:8000" --window-size=1200,800
    exit /b 0
)

start http://localhost:8000