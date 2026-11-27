# Builds the Windows installer end to end. Needs: Node.js, Python 3.12, Rust (rustup) and Visual Studio Build Tools (C++).
$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $root
# UI that talks to the backend on its own address (the desktop backend serves the UI itself)
'VITE_API_BASE_URL=' | Out-File -Encoding ascii .env.production.local
npm ci
npm run build
Remove-Item .env.production.local -ErrorAction SilentlyContinue
& "$PSScriptRoot\fetch-binaries.ps1"
& "$PSScriptRoot\build-backend.ps1"
Set-Location "$root\desktop"
npx --yes @tauri-apps/cli@2 build
Write-Host "Xong. File cai dat nam o: desktop\src-tauri\target\release\bundle\nsis"
