# دالة مشتركة: تحميل متغيرات البيئة من ملف prod.env إلى بيئة العملية الحالية.
function Import-QuranEnv {
    param(
        [Parameter(Mandatory = $true)][string]$Path
    )

    if (-not (Test-Path $Path)) {
        throw "لم يُعثر على ملف الإعدادات: $Path"
    }

    Get-Content -Path $Path -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if (-not $line) { return }
        if ($line.StartsWith("#")) { return }
        $index = $line.IndexOf("=")
        if ($index -lt 1) { return }
        $key = $line.Substring(0, $index).Trim()
        $value = $line.Substring($index + 1).Trim().Trim('"')
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# مسار جذر المشروع (scripts\windows -> جذر المشروع)
function Get-QuranRoot {
    return (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
}

# مجلد البيانات (قاعدة البيانات + النسخ الاحتياطية + السجلات)
function Get-QuranDataDir {
    if ($env:QURAN_DATA_DIR) { return $env:QURAN_DATA_DIR }
    return "C:\QuranSchoolData"
}
