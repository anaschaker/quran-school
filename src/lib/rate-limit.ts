// Rate limiter بسيط في الذاكرة (مناسب لنسخة VPS単一).
// في بيئة serverless متعددة، يُفضّل Redis، لكن هذا يكفي للنشر على VPS.

const buckets = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const entries = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (entries.length >= limit) {
    buckets.set(key, entries);
    return { allowed: false, remaining: 0 };
  }

  entries.push(now);
  buckets.set(key, entries);
  return { allowed: true, remaining: limit - entries.length };
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
