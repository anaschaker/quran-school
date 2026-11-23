# بناء نسخة الإنتاج على Windows (مخرجات standalone الجاهزة للتشغيل).
# الاستخدام:
#   powershell -ExecutionPolicy Bypass -File scripts\windows\build-production.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\windows\build-production.ps1 -SkipInstall

param(
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_env.ps1"

$root = Get-QuranRoot
Set-Location $root

if (-not $SkipInstall) {
    Write-Host "[1/4] تثبيت الاعتماديات..." -ForegroundColor Cyan
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "فشل npm ci" }
}

Write-Host "[2/4] توليد Prisma Client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) { throw "فشل prisma generate" }

Write-Host "[3/4] بناء Next.js..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "فشل البناء" }

Write-Host "[4/4] نسخ الملفات الثابتة إلى مخرجات standalone..." -ForegroundColor Cyan
$standalone = Join-Path $root ".next\standalone"
if (-not (Test-Path (Join-Path $standalone "server.js"))) {
    throw "لم يُعثر على .next\standalone\server.js — تأكد أن next.config.ts يحتوي output: 'standalone'."
}

Copy-Item -Path (Join-Path $root "public") -Destination $standalone -Recurse -Force
New-Item -ItemType Directory -Force -Path (Join-Path $standalone ".next") | Out-Null
Copy-Item -Path (Join-Path $root ".next\static") -Destination (Join-Path $standalone ".next") -Recurse -Force

Write-Host ""
Write-Host "تمّ البناء. شغّل الخادم بالأمر:" -ForegroundColor Green
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\windows\start-production.ps1" -ForegroundColor Green
