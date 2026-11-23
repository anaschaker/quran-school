#!/bin/sh
# نسخة احتياطية يومية (يُستدعى من cron أو entrypoint في Docker).
set -e
cd "$(dirname "$0")/.."
exec npx tsx scripts/backup-db.ts
