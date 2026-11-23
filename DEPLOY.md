# دليل النشر (DEPLOY.md)

هذا الدليل موجَّه لمن ينشر **مدرسة القرآن الكريم** على خادم (VPS) لأول مرة.
نفترض خادمًا (Ubuntu 22.04+) with Docker. جميع الأوامر بالعربية/الإنجليزية.

---

## 1. شراء خادم (VPS)

- مزوّد (DigitalOcean/Hetzner/Contabo/…): خطة 2 vCPU / 4GB RAM / 80GB كحد أدنى.
- نظام تشغيل: **Ubuntu 22.04 LTS**.
- فتح منافذ: 22 (SSH)، 80، 443 (HTTPS). لا تفتح 3000 للإنترنت.
- احفظ IP الخادم وبيانات root.

## 2. تثبيت Docker

```bash
ssh root@IP
apt-get update && apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg ufw
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
```

جدار الحماية:

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 3. رفع المشروع

```bash
mkdir -p /opt/quran-school
cd /opt/quran-school
# من جهازك:
# scp quran-school-v0.0.1.3.zip root@IP:/opt/quran-school/
unzip quran-school-v0.0.1.3.zip
cd quran-school
```

## 4. ضبط البيئة

```bash
cp .env.production.example .env
sh scripts/generate-secret.sh   # انسخ الناتج
nano .env
```

الحد الأدنى (غيّر كل قيم «غيّرني»):

```
DATABASE_URL="file:/data/dev.db"
AUTH_SECRET="<السر-المولَّد>"
NEXT_PUBLIC_SITE_URL="https://quran.example.com"
MAIL_FROM="مدرسة القرآن الكريم <quraanschool11@gmail.com>"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="quraanschool11@gmail.com"
SMTP_PASS="<كلمة-مرور-التطبيق>"
ADMIN_NAME="مدير المدرسة"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="<كلمة-مرور-قوية-10+>"
```

## 5. بناء وتشغيل الحاوية

```bash
docker compose up -d --build
docker compose logs -f app
```

انتظر حتى يظهر `Ready` (قد يأخذ 2-4 دقائق في أول بناء). ثم:

```bash
curl -s http://127.0.0.1:3000/api/health | head
```

## 6. تهيئة المدير الأول (مرة واحدة)

```bash
docker compose run --rm app npx tsx scripts/init-production.ts
```

أدخل الاسم/البريد/كلمة المرور (أو اعتمد على .env). بعد الانتهاء:

```bash
docker compose restart app
```

## 7. حذف البيانات التجريبية (إن وُجدت)

```bash
docker compose run --rm app npx tsx scripts/reset-demo-data.ts
```

اكتب `RESET` للتأكيد.

## 8. إعداد Nginx و HTTPS (Let's Encrypt)

```bash
apt-get install -y nginx certbot python3-certbot-nginx
```

ملف `/etc/nginx/sites-available/quran-school`:

```nginx
server {
    listen 80;
    server_name quran.example.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/quran-school /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d quran.example.com
```

Certbot سيُحدّث إعداد Nginx لـ HTTPS تلقائيًا.

## 9. ضبط الدومين (DNS)

في لوحة مزوّد الدومين أضف سجل A:
- `quran.example.com → IP الخادم`

انتظر propagation (دقائق إلى ساعات). اختبر:
```bash
curl -I https://quran.example.com
```

## 10. النسخ الاحتياطي

- يوميًا (تلقائيًا في الحاوية): يُنشئ `/backups/quran-school-backup-YYYY-MM-DD.db` (احتفاظ 14).
- يدويًا:
  ```bash
  docker compose exec app sh scripts/backup.sh
  ```
- تحميل من اللوحة: `/admin/settings` → «نسخة احتياطية».
- سحب نسخة إلى جهازك:
  ```bash
  docker cp quran-school:/backups/quran-school-backup-YYYY-MM-DD.db ./
  ```
- استعادة:
  ```bash
  docker compose stop app
  docker compose run --rm app sh scripts/restore.sh /backups/quran-school-backup-YYYY-MM-DD.db
  docker compose start app
  ```

## 11. الصيانة اليومية

```bash
# السجلات
docker compose logs -f app --tail=100
# إعادة تشغيل
docker compose restart app
# تحديث (بعد رفع كود جديد)
docker compose up -d --build
# نسخة احتياطية
docker compose exec app sh scripts/backup.sh
```

## 12. الانتقال من SQLite إلى PostgreSQL (مستقبلاً)

1. غيّر `datasource db { provider = "postgresql" url = env("DATABASE_URL") }` في `prisma/schema.prisma`.
2. `DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"`.
3. `npx prisma migrate deploy` (أو `migrate dev` محليًا).
4. صدّر بيانات SQLite (مثلاً `sqlite3 dev.db .dump`) وأدخلها في PostgreSQL.
5. حدّث `src/app/admin/settings/backup/route.ts` (لا يدعم PostgreSQL) — استخدم `pg_dump` بدلًا.
6. أعد البناء والنشر.

## 13. النشر على Render أو Fly.io (بديل عن VPS)

### Render
1. ادفع المشروع إلى GitHub (أو ارفع zip).
2. في Render: **New → Blueprint** واختر `render.yaml` (أو Web Service → Docker).
3. عيّن متغيرات البيئة (AUTH_SECRET, NEXT_PUBLIC_SITE_URL, SMTP_*, ADMIN_*).
4. Render يبني Dockerfile ويُشغّل `/api/health` كفحص صحة.
5. أضف disk (يُعرَّف في render.yaml) لـ `/data` (قاعدة البيانات) و`/backups`.
6. شغّل init-production مرة:
   ```bash
   # عبر Render Shell:
   npx tsx scripts/init-production.ts
   ```

### Fly.io
```bash
fly auth login
fly launch --no-deploy   # يستخدم fly.toml
fly volumes create quran_data --size 1 --region fra
fly volumes create quran_backups --size 1 --region fra
fly secrets set AUTH_SECRET="..." NEXT_PUBLIC_SITE_URL="https://..." SMTP_PASS="..." ADMIN_PASSWORD="..."
fly deploy
fly ssh console -C "npx tsx scripts/init-production.ts"
```

> ملاحظة: Render/Fly.io يدعمان Docker + volumes، لذا **لا حاجة لتغيير الكود** (SQLite يبقى). Netlify (serverless) غير مناسب لهذا التطبيق.

## استكشاف الأخطاء

- **الصفحة لا تفتح**: `docker compose logs app`، تحقق من `AUTH_SECRET` (≥32 بايت).
- **خطأ P2021 (جدول غير موجود)**: `docker compose run --rm app npx prisma migrate deploy`.
- **البريد لا يُرسل**: تحقق من SMTP_* و MAIL_FROM، وفعّل «تفضيلات الإشعارات» للمستخدم.
- **النسخة الاحتياطية فارغة**: استخدم VACUUM (السكربت يفعل ذلك). لا تنسخ ملف DB أثناء الكتابة.
- **403 على /admin/settings/backup**: تأكد من تسجيل الدخول كمدير.
