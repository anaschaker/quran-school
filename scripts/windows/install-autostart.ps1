# تسجيل مهام Windows تلقائية:
#   QuranSchool-Server  → تشغيل الخادم عند تسجيل الدخول (وإعادة التشغيل عند الفشل)
#   QuranSchool-Backup  → نسخة احتياطية يومية الساعة 2:00 فجرًا
#
# الاستخدام (بدون صلاحيات مدير):
#   powershell -ExecutionPolicy Bypass -File scripts\windows\install-autostart.ps1
#
# للإزالة:
#   powershell -ExecutionPolicy Bypass -File scripts\windows\install-autostart.ps1 -Remove

param(
    [switch]$Remove,
    [string]$BackupTime = "02:00"
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_env.ps1"

$root = Get-QuranRoot
$serverTask = "QuranSchool-Server"
$backupTask = "QuranSchool-Backup"

if ($Remove) {
    Unregister-ScheduledTask -TaskName $serverTask -Confirm:$false -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $backupTask -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "تمّت إزالة المهام." -ForegroundColor Green
    return
}

$powershell = (Get-Command powershell.exe).Source
$startScript = Join-Path $root "scripts\windows\start-production.ps1"
$backupScript = Join-Path $root "scripts\windows\backup-production.ps1"

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 5 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero)

# 1) خادم الموقع
$serverAction = New-ScheduledTaskAction `
    -Execute $powershell `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`"" `
    -WorkingDirectory $root

$serverTrigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$serverTrigger.Delay = "PT30S"

Unregister-ScheduledTask -TaskName $serverTask -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask `
    -TaskName $serverTask `
    -Action $serverAction `
    -Trigger $serverTrigger `
    -Settings $settings `
    -Description "تشغيل موقع مدرسة القرآن الكريم عند تسجيل الدخول" | Out-Null

# 2) نسخة احتياطية يومية
$backupAction = New-ScheduledTaskAction `
    -Execute $powershell `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$backupScript`"" `
    -WorkingDirectory $root

$backupTrigger = New-ScheduledTaskTrigger -Daily -At $BackupTime

Unregister-ScheduledTask -TaskName $backupTask -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask `
    -TaskName $backupTask `
    -Action $backupAction `
    -Trigger $backupTrigger `
    -Settings $settings `
    -Description "نسخة احتياطية يومية لقاعدة بيانات المدرسة" | Out-Null

Write-Host "تمّ تسجيل المهمتين:" -ForegroundColor Green
Write-Host "  - $serverTask (عند تسجيل الدخول)" -ForegroundColor Gray
Write-Host "  - $backupTask (يوميًا $BackupTime)" -ForegroundColor Gray
Write-Host ""
Write-Host "لتشغيل الخادم الآن:  Start-ScheduledTask -TaskName $serverTask" -ForegroundColor Cyan
Write-Host "لإيقافه:             Stop-ScheduledTask  -TaskName $serverTask" -ForegroundColor Cyan
Write-Host "لحالة المهمة:        Get-ScheduledTaskInfo -TaskName $serverTask" -ForegroundColor Cyan
