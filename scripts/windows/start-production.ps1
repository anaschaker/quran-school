# تشغيل خادم الإنتاج على Windows.
# الاستخدام:
#   powershell -ExecutionPolicy Bypass -File scripts\windows\start-production.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\windows\start-production.ps1 -Port 8080

param(
    [int]$Port = 0
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_env.ps1"

$root = Get-QuranRoot
$dataDir = Get-QuranDataDir
$envFile = Join-Path $dataDir "prod.env"
$logDir = Join-Path $dataDir "logs"

if (-not (Test-Path $envFile)) {
    throw "لم يُعثر على ملف الإعدادات: $envFile. شغّل أولًا scripts\windows\setup-production.ps1"
}

Import-QuranEnv -Path $envFile
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$env:NODE_ENV = "production"
if ($Port -gt 0) { $env:PORT = "$Port" }
if (-not $env:PORT) { $env:PORT = "3000" }
if (-not $env:HOSTNAME) { $env:HOSTNAME = "127.0.0.1" }

$standalone = Join-Path $root ".next\standalone"
if (-not (Test-Path (Join-Path $standalone "server.js"))) {
    throw "لا توجد نسخة مبنية. شغّل أولًا scripts\windows\build-production.ps1"
}

Set-Location $root

Write-Host "تطبيق الترحيلات على قاعدة البيانات..." -ForegroundColor Cyan
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw "فشل تطبيق الترحيلات." }

$logFile = Join-Path $logDir ("server-{0}.log" -f (Get-Date -Format "yyyy-MM-dd"))

Write-Host "تشغيل الخادم على http://$($env:HOSTNAME):$($env:PORT)" -ForegroundColor Green
Write-Host "السجل: $logFile" -ForegroundColor Gray

Set-Location $standalone
node server.js 2>&1 | Tee-Object -FilePath $logFile -Append
