# تهيئة إنتاجية لمرة واحدة على Windows:
#   - إنشاء مجلد البيانات (قاعدة البيانات، النسخ الاحتياطية، السجلات)
#   - توليد ملف prod.env يحتوي AUTH_SECRET عشوائيًا
#   - تطبيق ترحيلات Prisma على قاعدة بيانات إنتاجية جديدة
#   - إنشاء حساب المدير الأول (اختياري عبر المعاملات)
#
# مثال:
#   powershell -ExecutionPolicy Bypass -File scripts\windows\setup-production.ps1 `
#     -AdminName "مدير المدرسة" -AdminEmail "admin@example.com" -AdminPassword "StrongPass123"

param(
    [string]$DataDir = "",
    [string]$AdminName = "",
    [string]$AdminEmail = "",
    [string]$AdminPhone = "",
    [string]$AdminPassword = ""
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_env.ps1"

$root = Get-QuranRoot
if (-not $DataDir) { $DataDir = Get-QuranDataDir }

$backupDir = Join-Path $DataDir "backups"
$logDir = Join-Path $DataDir "logs"
New-Item -ItemType Directory -Force -Path $DataDir, $backupDir, $logDir | Out-Null

$envFile = Join-Path $DataDir "prod.env"

if (-not (Test-Path $envFile)) {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $authSecret = [Convert]::ToBase64String($bytes)

    $dbPath = (Join-Path $DataDir "quran.db") -replace "\\", "/"
    $backupPath = $backupDir -replace "\\", "/"

    $lines = @(
        "# إعدادات الإنتاج — لا ترفع هذا الملف إلى GitHub ولا تشاركه.",
        "NODE_ENV=`"production`"",
        "PORT=`"3000`"",
        "HOSTNAME=`"127.0.0.1`"",
        "DATABASE_URL=`"file:$dbPath`"",
        "AUTH_SECRET=`"$authSecret`"",
        "BACKUP_DIR=`"$backupPath`"",
        "BACKUP_RETENTION=`"14`"",
        "TZ=`"Asia/Beirut`"",
        "NEXT_PUBLIC_SITE_URL=`"`"",
        "",
        "# البريد (اختياري — يُستخدم لإشعارات أولياء الأمور)",
        "MAIL_FROM=`"مدرسة القرآن الكريم <quraanschool11@gmail.com>`"",
        "SMTP_HOST=`"`"",
        "SMTP_PORT=`"587`"",
        "SMTP_USER=`"`"",
        "SMTP_PASS=`"`""
    )

    Set-Content -Path $envFile -Value ($lines -join "`r`n") -Encoding UTF8
    Write-Host "[1/3] تم إنشاء ملف الإعدادات: $envFile" -ForegroundColor Green
}
else {
    Write-Host "[1/3] ملف الإعدادات موجود مسبقًا: $envFile" -ForegroundColor Yellow
}

Import-QuranEnv -Path $envFile

Write-Host "[2/3] تطبيق ترحيلات قاعدة البيانات..." -ForegroundColor Cyan
Set-Location $root
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw "فشل تطبيق الترحيلات." }

if ($AdminEmail -and $AdminPassword) {
    Write-Host "[3/3] إنشاء حساب المدير..." -ForegroundColor Cyan
    $env:ADMIN_NAME = $AdminName
    $env:ADMIN_EMAIL = $AdminEmail
    $env:ADMIN_PHONE = $AdminPhone
    $env:ADMIN_PASSWORD = $AdminPassword
    npx tsx scripts/init-production.ts
    $env:ADMIN_PASSWORD = $null
    if ($LASTEXITCODE -ne 0) { throw "فشل إنشاء حساب المدير." }
}
else {
    Write-Host "[3/3] لم يُنشأ حساب مدير (لم تُمرَّر AdminEmail/AdminPassword)." -ForegroundColor Yellow
    Write-Host "     أنشئه لاحقًا: npx tsx scripts/init-production.ts" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "تمّت التهيئة بنجاح." -ForegroundColor Green
Write-Host "قاعدة البيانات: $env:DATABASE_URL" -ForegroundColor Green
Write-Host "لتشغيل الخادم:  powershell -ExecutionPolicy Bypass -File scripts\windows\start-production.ps1" -ForegroundColor Green
