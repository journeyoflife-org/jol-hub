/**
 * Error tracking core — STEP 16.
 *
 * Pure classification layer used by the client boundary/handlers and the
 * server ingestion route:
 *   - categorize: network / auth / commerce / rendering / security / unknown
 *   - fingerprint: stable grouping key (dedup of "similar" errors)
 *   - severity: impact-based assessment (frequency lives server-side)
 *   - breadcrumbs: bounded ring buffer of user actions before an error
 *
 * No tracker SDK here — on-prem GlitchTip/self-hosted Sentry attaches at
 * the ingestion route (ADR-gated); this core stays vendor-neutral.
 */

export type ErrorCategory = 'network' | 'auth' | 'commerce' | 'rendering' | 'security' | 'unknown';
export type ErrorSeverity = 'critical' | 'error' | 'warning';

export interface ClassifiedError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  fingerprint: string;
  message: string;
  stack?: string;
  componentStack?: string;
}

export interface ErrorContext {
  route?: string;
  /** React component stack (rendering errors). */
  componentStack?: string;
  status?: number;
}

const NETWORK_MARKERS = /fetch|network|timeout|aborted|failed to fetch|load failed|econn|etimedout|dns/i;
const AUTH_MARKERS = /401|403|unauthorized|forbidden|session|signin|sign-in|csrf|token expired/i;
const COMMERCE_MARKERS = /checkout|payment|donation|cart|order|stripe|booking|reservation/i;
const SECURITY_MARKERS = /rate limit|xss|sanitiz|injection|permission denied|rbac/i;

/** Assign a category from the error + request context. */
export function categorizeError(error: unknown, context: ErrorContext = {}): ErrorCategory {
  if (context.componentStack) return 'rendering';
  if (context.status === 401 || context.status === 403) return 'auth';

  const message = messageOf(error);
  const haystack = `${message} ${context.route ?? ''}`;

  if (context.status !== undefined && context.status >= 500) return 'network';
  if (AUTH_MARKERS.test(haystack)) return 'auth';
  if (SECURITY_MARKERS.test(haystack)) return 'security';
  if (COMMERCE_MARKERS.test(haystack)) return 'commerce';
  if (NETWORK_MARKERS.test(haystack)) return 'network';
  return 'unknown';
}

/** Impact-based severity (frequency-based escalation is server-side). */
export function assessSeverity(category: ErrorCategory, error: unknown): ErrorSeverity {
  // Money + identity paths are critical by impact, regardless of volume.
  if (category === 'commerce' || category === 'auth' || category === 'security') return 'critical';
  if (category === 'rendering') return 'error';
  if (category === 'network') {
    // Transient network failures are expected on modest infrastructure;
    // fatal-shaped ones (programming errors surfaced as network) escalate.
    return error instanceof TypeError ? 'error' : 'warning';
  }
  return 'warning';
}

/**
 * Stable fingerprint for grouping similar errors:
 *   category + normalized message + top stack frames.
 * Normalization strips volatile parts (ids, numbers, urls, slugs) so the
 * same defect reported from 400k tenants collapses into one issue.
 */
export function fingerprintError(error: unknown, context: ErrorContext = {}): string {
  const category = categorizeError(error, context);
  const message = normalizeMessage(messageOf(error));
  const frames = topFrames(stackOf(error), 3).join('|');
  const route = context.route ? normalizeMessage(context.route) : '';
  return `${category}::${message}::${frames}${route ? `::${route}` : ''}`;
}

/** Full classification in one pass. */
export function classifyError(error: unknown, context: ErrorContext = {}): ClassifiedError {
  const category = categorizeError(error, context);
  return {
    category,
    severity: assessSeverity(category, error),
    fingerprint: fingerprintError(error, context),
    message: messageOf(error).slice(0, 512),
    stack: stackOf(error)?.slice(0, 4096),
    componentStack: context.componentStack?.slice(0, 2048),
  };
}

// =============================================================================
// Breadcrumbs — bounded trail of user actions preceding an error
// =============================================================================

export type BreadcrumbType = 'navigation' | 'click' | 'api' | 'form' | 'console';

export interface Breadcrumb {
  type: BreadcrumbType;
  message: string;
  time: string;
}

/**
 * Ring buffer of breadcrumbs (newest last). Category is fixed at creation;
 * entries are REDACTED by the caller before push (see client binding).
 */
export function createBreadcrumbBuffer(capacity = 20, now: () => Date = () => new Date()) {
  const entries: Breadcrumb[] = [];

  return {
    push(type: BreadcrumbType, message: string): void {
      entries.push({ type, message: message.slice(0, 256), time: now().toISOString() });
      if (entries.length > capacity) entries.shift();
    },
    drain(): Breadcrumb[] {
      return entries.splice(0, entries.length);
    },
    snapshot(): readonly Breadcrumb[] {
      return [...entries];
    },
    size(): number {
      return entries.length;
    },
  };
}

// =============================================================================
// helpers
// =============================================================================

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'unknown error';
  }
}

function stackOf(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

/** Strip volatile fragments so equivalent errors share a fingerprint. */
function normalizeMessage(message: string): string {
  return (
    message
      .replace(/https?:\/\/[^\s)]+/g, '<url>')
      .replace(/[0-9a-f]{8,}/gi, '<id>')
      .replace(/\d+/g, '<n>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160)
  );
}

/** Top N `at …` frames, stripped of columns and absolute hosts. */
function topFrames(stack: string | undefined, count: number): string[] {
  if (!stack) return [];
  return stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('at '))
    .slice(0, count)
    .map((line) => line.replace(/^at\s+/, '').replace(/:\d+:\d+\)?$/, ''));
}
