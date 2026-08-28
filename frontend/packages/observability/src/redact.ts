/**
 * PII / secret redaction — STEP 16 (GDPR Art. 5, SOC 2 CC7.2).
 *
 * Every log record passes through {@link redactValue} before emission.
 * Two signal classes:
 *
 *   1. KEY-BASED — field names that are sensitive by definition
 *      (password, token, secret, authorization, cookie, card, ssn…).
 *      The VALUE is replaced wholesale with `[REDACTED:<kind>]`.
 *   2. PATTERN-BASED — sensitive shapes inside free text (emails, phone
 *      numbers, PANs, bearer tokens, JWTs, AWS keys). Replaced inline.
 *
 * RULES honored: passwords/tokens/card numbers/personal data NEVER reach
 * a log sink. Redaction is intentionally OVER-eager: a missed diagnostic
 * detail is acceptable, a PII leak is not.
 */

/** Marker used for key-based (wholesale) redaction. */
export const REDACTED = '[REDACTED]';

/** Key names whose values are always redacted (case-insensitive). */
const SENSITIVE_KEY_PATTERN =
  /^(.*)(password|passwd|secret|token|authorization|auth|cookie|session|card|pan|cvv|cvc|ssn|credential|apikey|api_key|private[_-]?key|x-api-key)(.*)$/i;

/** Patterns for inline redaction in free text. */
const TEXT_PATTERNS: Array<{ kind: string; regex: RegExp }> = [
  // Emails — GDPR personal data.
  { kind: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  // JWTs — three base64url segments (session/identity bearer).
  { kind: 'jwt', regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g },
  // Bearer/basic auth header values.
  { kind: 'token', regex: /\b(bearer|basic)\s+[A-Za-z0-9+/_=.-]{12,}/gi },
  // AWS access key ids.
  { kind: 'aws-key', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  // Card numbers — 13–19 digits, optionally space/dash separated.
  { kind: 'card', regex: /\b(?:\d[ -]?){13,19}\b/g },
  // Phone numbers — digit clusters with separators (EU shapes: +370 6xx
  // xxxxx, 8 6xx xxxxx, +49 …). Deliberately broad; UUIDs and ISO
  // timestamps are PROTECTED before this pass (see redactText) so
  // traceability fields survive.
  { kind: 'phone', regex: /\+?\d[\d\s\-()]{6,16}\d/g },
];

/**
 * Shapes that must never be touched by the broad patterns (traceability):
 * UUIDs (request ids) and ISO-8601 timestamps. They are swapped for
 * placeholders before redaction and restored after.
 */
const PROTECTED_PATTERNS: RegExp[] = [
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
  /\d{4}-\d{2}-\d{2}[T ][\d:.]+(?:Z|[+-]\d{2}:?\d{2})?/g,
  /\d{4}-\d{2}-\d{2}/g,
];

/** Max recursion depth for value redaction (defense vs deep structures). */
const MAX_DEPTH = 8;

/** True when a key name marks its value as sensitive. */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

/**
 * Redact sensitive shapes inside a free-text string. Returns the redacted
 * copy — the input is never mutated. UUIDs and ISO timestamps are
 * protected across the pass so traceability fields stay intact.
 */
export function redactText(value: string): string {
  // 1. Protect traceability shapes behind placeholders.
  const stashed: string[] = [];
  let out = value;
  for (const pattern of PROTECTED_PATTERNS) {
    pattern.lastIndex = 0;
    out = out.replace(pattern, (match) => {
      stashed.push(match);
      return `\u0000${stashed.length - 1}\u0000`;
    });
  }

  // 2. Redact sensitive shapes.
  for (const { kind, regex } of TEXT_PATTERNS) {
    regex.lastIndex = 0;
    out = out.replace(regex, `[REDACTED:${kind}]`);
  }

  // 3. Restore protected shapes.
  return out.replace(/\u0000(\d+)\u0000/g, (_m, index) => stashed[Number(index)] ?? '');
}

/**
 * Deep-redact an arbitrary value for logging.
 *   - sensitive KEYS → wholesale `[REDACTED]`;
 *   - strings → inline pattern redaction;
 *   - arrays/objects → walked recursively (depth-limited, cycle-safe).
 */
export function redactValue(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value;
  if (depth > MAX_DEPTH) return '[TRUNCATED]';

  if (typeof value === 'string') return redactText(value);
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactText(value.message),
      stack: value.stack ? redactText(value.stack) : undefined,
    };
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((item) => redactValue(item, depth + 1, seen));
    }

    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      out[key] = isSensitiveKey(key) ? REDACTED : redactValue(entry, depth + 1, seen);
    }
    return out;
  }

  // functions, symbols — not serializable into logs.
  return String(typeof value);
}
