#!/bin/sh
# يولّد سرًا عشوائيًا قويًا (32 بايت = 256 بت) مناسبًا لمتغير AUTH_SECRET.
# الاستخدام:
#   sh scripts/generate-secret.sh
#   AUTH_SECRET="$(sh scripts/generate-secret.sh)"
set -eu

if command -v openssl >/dev/null 2>&1; then
  openssl rand -base64 32 | tr '+/' '-_' | tr -d '=\n'
  exit 0
fi

if command -v node >/dev/null 2>&1; then
  node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
  exit 0
fi

echo "خطأ: يلزم توفر openssl أو node لتوليد السر." >&2
exit 1
