/**
 * Middleware-level rate limiting (STEP 5).
 *
 * Fixed-window counters keyed by client IP (+ tenant slug when resolved),
 * in-memory per isolate — deliberately dependency-free so it runs on the
 * edge runtime without external services. Production deploys behind
 * Proxmox/nginx may layer stricter limits upstream; this is the baseline
 * defense against enumeration probes and abuse (SOC 2 CC6.1).
 */
const WINDOW_MS = 10_000;
/** Requests allowed per window per key. */
const MAX_REQUESTS = 120;
/** Keys kept alive — bounds memory under hostile variety attacks. */
const MAX_KEYS = 10_000;

interface WindowEntry {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowEntry>();

/** Best-effort client IP (proxy chains: left-most x-forwarded-for). */
export function clientIp(request: { headers: Headers; ip?: string }): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || request.ip || 'unknown';
}

/**
 * Returns `true` when the key exceeded its window budget (and the request
 * should be rejected with 429).
 */
export function isRateLimited(key: string, now = Date.now()): boolean {
  const entry = windows.get(key);

  if (!entry || now >= entry.resetAt) {
    if (windows.size >= MAX_KEYS) {
      // Evict the oldest window to bound memory.
      const oldest = windows.keys().next().value;
      if (oldest !== undefined) windows.delete(oldest);
    }
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

/** Test/ops hook. */
export function resetRateLimiter(): void {
  windows.clear();
}
