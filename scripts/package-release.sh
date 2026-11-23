#!/bin/sh
# إنتاج حزمة تسليم نظيفة: quran-school-v0.0.1.3.zip
# لا تتضمن node_modules ولا .env ولا قواعد بيانات nor .next.
set -eu

cd "$(dirname "$0")/.."

VERSION="v0.0.1.3"
ARCHIVE="quran-school-${VERSION}.zip"
STAGE="$(mktemp -d)"

cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

# نسخ الملفات (rsync إن وُجد، وإلا cp مع استبعادات).
if command -v rsync >/dev/null 2>&1; then
  rsync -a \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.env' \
    --exclude '.env.*' \
    --exclude 'prisma/*.db' \
    --exclude 'prisma/*.db-*' \
    --exclude 'backups' \
    --exclude '*.log' \
    --exclude '.git' \
    --exclude 'coverage' \
    ./ "$STAGE/quran-school/"
else
  mkdir -p "$STAGE/quran-school"
  cp -a . "$STAGE/quran-school/"
  rm -rf "$STAGE/quran-school/node_modules" "$STAGE/quran-school/.next" \
    "$STAGE/quran-school/.git" "$STAGE/quran-school/backups" "$STAGE/quran-school/coverage"
  rm -f "$STAGE/quran-school/.env" "$STAGE/quran-school/.env."*
  rm -f "$STAGE/quran-school/prisma/"*.db "$STAGE/quran-school/prisma/"*.db-*
  find "$STAGE/quran-school" -name '*.log' -delete
fi

# تأكد من عدم وجود أسرار/قواعد بيانات.
if grep -R --exclude-dir=node_modules -nE 'AUTH_SECRET="[A-Za-z0-9_-]{16,}"' "$STAGE" 2>/dev/null | grep -v 'change-me\|غيّرني\|example' >/dev/null; then
  echo "❌ تم العثور على ما يشبه سراً في الحزمة. ألغِ العملية." >&2
  exit 1
fi
if find "$STAGE" -name '*.db' | grep -q .; then
  echo "❌ توجد قاعدة بيانات داخل الحزمة." >&2
  exit 1
fi

command -v zip >/dev/null 2>&1 || { echo "❌ يلزم تثبيت zip (apt-get install zip)."; exit 1; }
rm -f "$ARCHIVE"
(cd "$STAGE" && zip -r "$OLDPWD/$ARCHIVE" quran-school >/dev/null)
echo "✅ تم إنشاء $ARCHIVE"
ls -lh "$ARCHIVE"
