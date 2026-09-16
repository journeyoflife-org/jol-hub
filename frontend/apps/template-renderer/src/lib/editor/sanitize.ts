/**
 * Sanitization — STEP 14 (user-generated content security).
 *
 * SECURITY MODEL (defense in depth, ISO 27001 A.8.2):
 *   1. STRUCTURAL: rich text is stored as plain text + marks/links
 *      (blocks.ts) — there is NO markup storage, so stored XSS is
 *      impossible by construction ("NEVER allow raw HTML input").
 *   2. ESCAPE-FIRST RENDER: `renderBlockHtml` escapes every text run
 *      before wrapping it in the ONLY emitted tags (<p>, <h2>, <strong>,
 *      <em>, <a>, <blockquote>, <hr>, <br>). No attribute is ever built
 *      from text content except allowlist-validated `href`.
 *   3. DOMPURIFY: the final HTML passes through DOMPurify (client side,
 *      ALLOWED_TAGS locked to the emit set) as the belt-and-braces layer —
 *      acceptance criterion "DOMPurify sanitizes all content".
 *   4. URL POLICY: `isSafeUrl` blocks javascript:/data:/vbscript: schemes
 *      and non-allowlisted external hosts (spec: prevent data leakage).
 *   5. PROHIBITED PATTERNS: emails/phone numbers in content are flagged —
 *      contact data belongs in the tenant identity block, not page copy.
 *
 * Pure functions — unit-tested with XSS payloads.
 */
import type { EditorBlock } from './blocks';

/** The ONLY tags the renderer may ever emit (DOMPurify allowlist mirror). */
export const SANITIZED_ALLOWED_TAGS = [
  'p', 'h2', 'blockquote', 'strong', 'em', 'a', 'hr', 'br', 'button', 'div', 'span', 'img',
] as const;

/** Hosts allowed for EXTERNAL links (internal `/…` paths are always fine). */
export const DEFAULT_URL_ALLOWLIST: readonly string[] = [
  'gyvenimo-kelias.lt',
  'jol.lt',
  'vyskupijos.lt',
];

// =============================================================================
// ESCAPING + URL POLICY
// =============================================================================

/** Escape ALL HTML-significant characters (escape-first rendering). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * URL safety gate. Internal tenant paths (`/…`, never `//…` protocol-
 * relative) pass; external URLs must be https and their host must end
 * with an allowlist entry. Every other scheme/host is rejected —
 * javascript:, data:, vbscript:, http downgrade, unknown hosts.
 */
export function isSafeUrl(href: string, allowlist: readonly string[] = DEFAULT_URL_ALLOWLIST): boolean {
  const value = href.trim();
  if (!value) return false;
  // Internal path — but not protocol-relative (`//evil.com`).
  if (value.startsWith('/') && !value.startsWith('//')) {
    // No control chars / backslashes (browsers normalize `\` to `/`).
    return !/[\\\u0000-\u001f]/.test(value);
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  return allowlist.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

// =============================================================================
// STRUCTURAL RENDER (escape-first)
// =============================================================================

/** Render text runs with interleaved <strong>/<em>/<a> marks. */
function renderMarkedText(text: string, block: Pick<EditorBlock, 'marks' | 'links'>): string {
  const points = new Set<number>([0, text.length]);
  for (const range of [...(block.marks ?? []), ...(block.links ?? [])]) {
    points.add(Math.max(0, Math.min(range.start, text.length)));
    points.add(Math.max(0, Math.min(range.end, text.length)));
  }
  const sorted = [...points].sort((a, b) => a - b);

  let html = '';
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (start === undefined || end === undefined || end <= start) continue;
    const run = escapeHtml(text.slice(start, end));
    const bold = (block.marks ?? []).some((m) => m.kind === 'bold' && m.start <= start && m.end >= end);
    const italic = (block.marks ?? []).some((m) => m.kind === 'italic' && m.start <= start && m.end >= end);
    const link = (block.links ?? []).find((l) => l.start <= start && l.end >= end);

    let rendered = run;
    if (bold) rendered = `<strong>${rendered}</strong>`;
    if (italic) rendered = `<em>${rendered}</em>`;
    if (link && isSafeUrl(link.href)) {
      rendered = `<a href="${escapeHtml(link.href)}" rel="noopener noreferrer">${rendered}</a>`;
    }
    html += rendered;
  }
  return html;
}

/**
 * Render ONE block to safe HTML. The output uses only SANITIZED_ALLOWED_TAGS
 * and escaped text; it is additionally DOMPurify-passed by the caller in the
 * browser. Returns '' for disallowed/unknown types (they never render).
 */
export function renderBlockHtml(block: EditorBlock): string {
  const text = block.text ?? '';
  switch (block.type) {
    case 'heading':
      return `<h2>${renderMarkedText(text, block)}</h2>`;
    case 'paragraph':
      return `<p>${renderMarkedText(text, block)}</p>`;
    case 'quote':
      return `<blockquote>${renderMarkedText(text, block)}</blockquote>`;
    case 'button': {
      const label = escapeHtml(block.label ?? '');
      // Valid nesting: a button is an <a data-block="button"> when linked
      // (no interactive-in-interactive), a plain <button> otherwise.
      if (!block.href || !isSafeUrl(block.href)) return `<button type="button">${label}</button>`;
      return `<a href="${escapeHtml(block.href)}" data-block="button" rel="noopener noreferrer">${label}</a>`;
    }
    case 'divider':
      return '<hr />';
    case 'spacer': {
      const size = Math.min(4, Math.max(1, block.size ?? 1));
      return `<div data-spacer="${size}"></div>`;
    }
    case 'image':
      // Media resolves through the library (mediaId) — never a raw tenant
      // URL. The src is injected by the renderer from the media library
      // record; alt text is escaped.
      return `<img data-media-id="${escapeHtml(block.mediaId ?? '')}" alt="${escapeHtml(block.altText ?? '')}" />`;
    default:
      return '';
  }
}

/** Render a full block list (preview / publish serialization). */
export function renderDraftHtml(blocks: readonly EditorBlock[]): string {
  return blocks.map(renderBlockHtml).filter(Boolean).join('\n');
}

// =============================================================================
// PROHIBITED PATTERNS (data-leakage prevention)
// =============================================================================

export type ProhibitedFinding = {
  code: 'prohibited-email' | 'prohibited-phone' | 'prohibited-url';
  severity: 'warn';
  message: string;
};

/** Loose email detector (intentionally conservative). */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
/** Lithuanian/international phone shapes (8 6xx…, +370…, +48…). */
const PHONE_RE = /(?:\+?370|8)\s?[(\s]?\d{2,3}[)\s]?\s?\d{3}\s?\d{2,3}|\+\d{8,14}/g;
/** Bare URLs in TEXT (links belong in link marks, not copy). */
const BARE_URL_RE = /https?:\/\/[^\s<>]+/g;

/**
 * Scan free text for contact data / bare URLs (spec TASK 2: prevent data
 * leakage). Findings are WARN — the editor surfaces them and moderation
 * sees them; they do not block autosave.
 */
export function scanProhibitedPatterns(text: string): ProhibitedFinding[] {
  const findings: ProhibitedFinding[] = [];
  if (EMAIL_RE.test(text)) {
    findings.push({
      code: 'prohibited-email',
      severity: 'warn',
      message: 'Email addresses are not allowed in page content (use the contact block).',
    });
  }
  EMAIL_RE.lastIndex = 0;
  if (PHONE_RE.test(text)) {
    findings.push({
      code: 'prohibited-phone',
      severity: 'warn',
      message: 'Phone numbers are not allowed in page content (use the contact block).',
    });
  }
  PHONE_RE.lastIndex = 0;
  if (BARE_URL_RE.test(text)) {
    findings.push({
      code: 'prohibited-url',
      severity: 'warn',
      message: 'Raw URLs are not allowed in text — use the link control.',
    });
  }
  BARE_URL_RE.lastIndex = 0;
  return findings;
}

/** Collect free text from a draft for pattern scanning. */
export function draftTextOf(blocks: readonly EditorBlock[]): string {
  return blocks
    .map((block) => [block.text ?? '', block.label ?? '', block.altText ?? ''].join('\n'))
    .join('\n');
}
