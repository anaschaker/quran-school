#!/bin/sh
# استعادة قاعدة البيانات من نسخة احتياطية.
# الاستخدام:
#   sh scripts/restore.sh /backups/quran-school-backup-YYYY-MM-DD.db
#   FORCE=1 sh scripts/restore.sh ...   (بدون طلب تأكيد)
set -eu

if [ $# -lt 1 ]; then
  echo "الاستخدام: sh scripts/restore.sh <ملف-النسخة-الاحتياطية>"
  exit 1
fi

BACKUP="$1"
[ -f "$BACKUP" ] || { echo "❌ الملف غير موجود: $BACKUP"; exit 1; }

DB_PATH="${DATABASE_URL:-file:/data/dev.db}"
DB_PATH="${DB_PATH#file:}"
DB_PATH="${DB_PATH%%\?*}"
[ -n "$DB_PATH" ] || DB_PATH="/data/dev.db"

if [ "${FORCE:-}" != "1" ]; then
  printf "⚠️ سيتم استبدال قاعدة البيانات '%s' بـ '%s'.\n" "$DB_PATH" "$BACKUP"
  printf "اكتب RESTORE للتأكيد: "
  read -r CONFIRM
  [ "$CONFIRM" = "RESTORE" ] || { echo "أُلغيت العملية."; exit 0; }
fi

# نسخة أمان قبل الاستعادة (إن أمكن).
if [ -f "$DB_PATH" ]; then
  SAFETY="${DB_PATH}.before-restore-$(date -u +'%Y%m%dT%H%M%SZ')"
  cp "$DB_PATH" "$SAFETY"
  echo "📦 نسخة أمان (قبل الاستعادة): $SAFETY"
fi

rm -f "$DB_PATH-wal" "$DB_PATH-shm"
cp "$BACKUP" "$DB_PATH"

echo "✅ تم نسخ النسخة الاحتياطية إلى $DB_PATH"
echo "→ تطبيق الترحيلات (إن وُجدت)..."
npx prisma migrate deploy
echo "✅ الاستعادة اكتملت. أعد تشغيل التطبيق: docker compose restart app"
