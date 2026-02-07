type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type CheckRateLimitArgs = {
  namespace: string;
  key: string;
  max: number;
  windowMs: number;
  now?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
};

const STORE_KEY = "__ayzal_rate_limit_store__";

function getStore() {
  const globalState = globalThis as unknown as Record<string, unknown>;
  const existing = globalState[STORE_KEY];
  if (existing instanceof Map) {
    return existing as Map<string, RateLimitBucket>;
  }
  const created = new Map<string, RateLimitBucket>();
  globalState[STORE_KEY] = created;
  return created;
}

function cleanupExpiredBuckets(store: Map<string, RateLimitBucket>, now: number) {
  // Keep memory bounded for long-lived server processes.
  if (store.size < 5_000) return;
  for (const [bucketKey, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(bucketKey);
    }
  }
}

export function resolveRequestIp(request: Request) {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const first = xForwardedFor
      .split(",")
      .map((value) => value.trim())
      .find(Boolean);
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

export function checkRateLimit(args: CheckRateLimitArgs): RateLimitResult {
  const now = args.now ?? Date.now();
  const key = `${args.namespace}:${args.key}`;
  const store = getStore();
  cleanupExpiredBuckets(store, now);

  const existing = store.get(key);
  const windowStart = !existing || existing.resetAt <= now;
  const bucket: RateLimitBucket = windowStart
    ? { count: 0, resetAt: now + args.windowMs }
    : existing;

  bucket.count += 1;
  store.set(key, bucket);

  const allowed = bucket.count <= args.max;
  const remaining = Math.max(0, args.max - bucket.count);
  const retryAfterSeconds = allowed
    ? 0
    : Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return {
    allowed,
    limit: args.max,
    remaining,
    retryAfterSeconds,
    resetAt: bucket.resetAt,
  };
}

export function checkRequestRateLimit({
  request,
  namespace,
  max,
  windowMs,
  scope = "ip",
}: {
  request: Request;
  namespace: string;
  max: number;
  windowMs: number;
  scope?: "ip" | "path-and-ip";
}): RateLimitResult {
  const ip = resolveRequestIp(request);
  const key = scope === "path-and-ip" ? `${ip}:${new URL(request.url).pathname}` : ip;
  return checkRateLimit({
    namespace,
    key,
    max,
    windowMs,
  });
}

export function buildRateLimitHeaders(result: RateLimitResult) {
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", String(result.limit));
  headers.set("X-RateLimit-Remaining", String(result.remaining));
  headers.set("X-RateLimit-Reset", String(Math.floor(result.resetAt / 1000)));
  if (!result.allowed) {
    headers.set("Retry-After", String(result.retryAfterSeconds));
  }
  return headers;
}
