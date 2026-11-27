# Downloads the helper programs the app ships with: FFmpeg + ffprobe, Deno (YouTube JS challenges), gallery-dl (photos).
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$triple = 'x86_64-pc-windows-msvc'
$out = Join-Path $PSScriptRoot '..\src-tauri\binaries'
New-Item -ItemType Directory -Force $out | Out-Null
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) 'ild-bin'
Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $tmp | Out-Null

# FFmpeg (LGPL build from BtbN)
Invoke-WebRequest 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-lgpl.zip' -OutFile "$tmp\ffmpeg.zip"
Expand-Archive "$tmp\ffmpeg.zip" -DestinationPath "$tmp\ffmpeg"
$bin = Get-ChildItem "$tmp\ffmpeg" -Recurse -Filter ffmpeg.exe | Select-Object -First 1
Copy-Item $bin.FullName "$out\ffmpeg-$triple.exe"
Copy-Item (Join-Path $bin.DirectoryName 'ffprobe.exe') "$out\ffprobe-$triple.exe"

# Deno (JavaScript runtime that yt-dlp needs for YouTube)
Invoke-WebRequest 'https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip' -OutFile "$tmp\deno.zip"
Expand-Archive "$tmp\deno.zip" -DestinationPath "$tmp\deno"
Copy-Item "$tmp\deno\deno.exe" "$out\deno-$triple.exe"

# gallery-dl is built from backend/requirements.txt in build-backend.ps1 (GitHub releases no longer ship .exe assets).
Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
Get-ChildItem $out | Format-Table Name, Length
