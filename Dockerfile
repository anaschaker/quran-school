# ==========================================================================
# صورة إنتاج متعددة المراحل — مدرسة القرآن الكريم
# تعتمد على مخرجات standalone في Next.js لتقليل حجم الصورة.
# ==========================================================================

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
# --legacy-peer-deps لتفادي تعارض @types/node مع vitest في بيئة التطوير فقط.
RUN npm ci --legacy-peer-deps

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl su-exec
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0

# مستخدم غير جذري + مجلدات دائمة.
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001 \
  && mkdir -p /data /backups \
  && chown -R nextjs:nodejs /app /data /backups

# نثبّت اعتماديات التشغيل فقط، ثم أدوات الترحيل/الصيانة (prisma CLI + tsx)
# لأن entrypoint وscripts/init-production تحتاجها داخل الحاوية.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps \
  && npm install --no-save --no-package-lock prisma@6.19.3 tsx@4.23.15 \
  && npm cache clean --force

COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# عميل Prisma المولّد + محرّك الاستعلام (مطلوبان وقت التشغيل).
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --chown=nextjs:nodejs scripts ./scripts
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh ./scripts/*.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["./entrypoint.sh"]
