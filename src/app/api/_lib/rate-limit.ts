/**
 * Simple fixed-window in-memory rate limiter for protecting endpoints that
 * trigger external-provider calls or writes. A single-process Map is
 * sufficient for this single-instance deployment; a horizontally-scaled
 * deployment would need a shared store (e.g. Redis) instead — swapping the
 * backing store is the only change that would require.
 */
const requestCountsByKey = new Map<string, { count: number; windowStartMs: number }>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = requestCountsByKey.get(key);

  if (!entry || now - entry.windowStartMs >= windowMs) {
    requestCountsByKey.set(key, { count: 1, windowStartMs: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.ceil((entry.windowStartMs + windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientKeyFrom(request: Request): string {
  // Behind a trusted proxy this would read x-forwarded-for; falling back to
  // a constant keeps the limiter functional (if coarser) in dev/direct access.
  return request.headers.get("x-forwarded-for") ?? "local";
}
