@echo off
chcp 65001 >nul
cd /d "%~dp0"
title I LOVE DOWNLOAD
echo ==============================================
echo        I LOVE DOWNLOAD - Desktop App
echo ==============================================

set "BIN_DIR=%~dp0desktop\src-tauri\binaries"
if exist "%BIN_DIR%\ild-backend-x86_64-pc-windows-msvc.exe" (
    echo Dang khoi chay backend dong goi san...
    start "" "%BIN_DIR%\ild-backend-x86_64-pc-windows-msvc.exe" --port 8000
    timeout /t 2 /nobreak >nul
    start http://localhost:8000
    exit /b 0
)

if exist "%~dp0desktop\build-out\ild-backend.exe" (
    echo Dang khoi chay backend tu build-out...
    start "" "%~dp0desktop\build-out\ild-backend.exe" --port 8000
    timeout /t 2 /nobreak >nul
    start http://localhost:8000
    exit /b 0
)

echo Dang khoi chay bang start.bat goc...
call "%~dp0start.bat"