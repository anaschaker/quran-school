# نسخة احتياطية يدوية لقاعدة البيانات (VACUUM INTO + الاحتفاظ بآخر 14 نسخة).
# الاستخدام:
#   powershell -ExecutionPolicy Bypass -File scripts\windows\backup-production.ps1

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_env.ps1"

$root = Get-QuranRoot
$dataDir = Get-QuranDataDir
$envFile = Join-Path $dataDir "prod.env"
$logDir = Join-Path $dataDir "logs"

if (-not (Test-Path $envFile)) {
    throw "لم يُعثر على ملف الإعدادات: $envFile"
}

Import-QuranEnv -Path $envFile
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Set-Location $root

$logFile = Join-Path $logDir "backup.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logFile -Value "[$timestamp] بدء النسخة الاحتياطية"

npx tsx scripts/backup-db.ts 2>&1 | Tee-Object -FilePath $logFile -Append

if ($LASTEXITCODE -ne 0) {
    Add-Content -Path $logFile -Value "[$timestamp] فشل النسخ الاحتياطي"
    throw "فشل النسخ الاحتياطي — راجع $logFile"
}

Write-Host "تمّت النسخة الاحتياطية في: $env:BACKUP_DIR" -ForegroundColor Green
