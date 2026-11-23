#!/bin/sh
set -e

APP_USER="nextjs"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

# بعض المنصات (مثل Render) تُركّب القرص الدائم كمجلد يملكه root.
# نضمن أن مستخدم التطبيق يملك مجلدات البيانات قبل تشغيل Prisma.
mkdir -p /data "$BACKUP_DIR" 2>/dev/null || true
if [ "$(id -u)" = "0" ]; then
  chown -R "$APP_USER":nodejs /data "$BACKUP_DIR" 2>/dev/null || true
fi

run_as_app() {
  if [ "$(id -u)" = "0" ]; then
    su-exec "$APP_USER" "$@"
  else
    "$@"
  fi
}

# 1) تطبيق ترحيلات قاعدة البيانات (آمنة وقابلة للتكرار).
#    عند أول تشغيل تُنشئ ملف SQLite داخل volume /data.
run_as_app npx prisma migrate deploy

# 2) نسخة احتياطية يومية في الخلفية (تحتفظ بآخر 14 نسخة).
#    يمكن تعطيلها بضبط BACKUP_AUTO="false".
if [ "${BACKUP_AUTO:-true}" = "true" ]; then
  run_as_app sh scripts/backup-loop.sh &
fi

# 3) تشغيل خادم Next.js (مخرجات standalone).
if [ "$(id -u)" = "0" ]; then
  exec su-exec "$APP_USER" node server.js
else
  exec node server.js
fi
