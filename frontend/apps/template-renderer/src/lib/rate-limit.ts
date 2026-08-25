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

// =============================================================================
// LOGIN BRUTE-FORCE LIMITER (STEP 10)
// =============================================================================

/** Login attempts allowed per window per IP (spec: 5 per 15 min). */
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
/** Bounded map — same eviction discipline as the general limiter. */
const LOGIN_MAX_KEYS = 10_000;

const loginWindows = new Map<string, WindowEntry>();

/**
 * Returns `true` when the key exhausted its LOGIN budget (brute-force
 * protection, OWASP ASVS V2.2 / ISO 27001 A.9.2). Callers should answer
 * 429 with a GENERIC message — never reveal whether the account exists.
 */
export function isLoginRateLimited(key: string, now = Date.now()): boolean {
  const entry = loginWindows.get(key);

  if (!entry || now >= entry.resetAt) {
    if (loginWindows.size >= LOGIN_MAX_KEYS) {
      const oldest = loginWindows.keys().next().value;
      if (oldest !== undefined) loginWindows.delete(oldest);
    }
    loginWindows.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > LOGIN_MAX_ATTEMPTS;
}

/** Test/ops hook. */
export function resetRateLimiter(): void {
  windows.clear();
  loginWindows.clear();
}
