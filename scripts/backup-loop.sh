#!/bin/sh
# حلقة نسخ احتياطي يومي: نسخة عند الإقلاع، ثم كل 24 ساعة.
# يمكن تعطيلها بضبط BACKUP_AUTO="false" في البيئة.
while true; do
  sh scripts/backup.sh >/dev/null 2>&1 || echo "⚠️ فشل النسخ الاحتياطي في $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  sleep 86400
done
