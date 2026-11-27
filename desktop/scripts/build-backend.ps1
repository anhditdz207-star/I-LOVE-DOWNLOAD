# Packs the Python backend (+ the built UI in .\dist) and gallery-dl into standalone exes that Tauri runs as sidecars.
$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $root
if (-not (Test-Path 'dist\index.html')) { throw 'Chua build giao dien (thieu dist\index.html). Chay build-all.ps1' }
$binDir = 'desktop\src-tauri\binaries'
$triple = 'x86_64-pc-windows-msvc'
New-Item -ItemType Directory -Force $binDir, 'desktop\build-work' | Out-Null

python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt pyinstaller
python -m PyInstaller --noconfirm --onefile --name ild-backend `
  --distpath desktop\build-out --workpath desktop\build-work --specpath desktop\build-work `
  --paths backend --collect-all yt_dlp --collect-all yt_dlp_ejs --collect-submodules uvicorn `
  --add-data "$root\dist;ui" backend\desktop_entry.py
if ($LASTEXITCODE -ne 0) { throw 'PyInstaller ild-backend that bai' }
Copy-Item desktop\build-out\ild-backend.exe "$binDir\ild-backend-$triple.exe" -Force

@'
import sys, gallery_dl
if __name__ == "__main__":
    sys.exit(gallery_dl.main())
'@ | Out-File -Encoding utf8 desktop\build-work\gallery_dl_entry.py
python -m PyInstaller --noconfirm --onefile --name gallery-dl `
  --distpath desktop\build-out --workpath desktop\build-work --specpath desktop\build-work `
  --collect-all gallery_dl desktop\build-work\gallery_dl_entry.py
if ($LASTEXITCODE -ne 0) { throw 'PyInstaller gallery-dl that bai' }
Copy-Item desktop\build-out\gallery-dl.exe "$binDir\gallery-dl-$triple.exe" -Force
