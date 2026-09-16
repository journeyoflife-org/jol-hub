/**
 * Editor core tests — STEP 14.
 *
 * Covers the security surface: XSS payloads through the escape-first
 * renderer + URL policy, structural constraints, prohibited-pattern
 * scanning, revision diff and the zod edge-validation schemas.
 * Run via `pnpm --filter template-renderer test` (tsx --test).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EDITOR_LIMITS,
  imageCount,
  isAllowedBlockType,
  validateDraft,
  type EditorBlock,
} from '../lib/editor/blocks';
import {
  draftTextOf,
  escapeHtml,
  isSafeUrl,
  renderBlockHtml,
  renderDraftHtml,
  scanProhibitedPatterns,
} from '../lib/editor/sanitize';
import { diffBlocks, describeChange } from '../lib/editor/diff';
import { blockSchema, decisionBodySchema, draftBodySchema, uploadBodySchema } from '../lib/editor/validation';

function block(partial: Partial<EditorBlock> & { type: EditorBlock['type'] }): EditorBlock {
  return { id: 'b1', ...partial };
}

// =============================================================================
// XSS / SANITIZATION
// =============================================================================

test('escapeHtml neutralizes markup-significant characters', () => {
  assert.equal(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(escapeHtml('a"b\'c&d'), 'a&quot;b&#39;c&amp;d');
});

test('script payloads in block text render escaped, never executable', () => {
  const payloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '"><svg onload=alert(1)>',
    '<iframe src="https://evil.example"></iframe>',
  ];
  for (const payload of payloads) {
    const html = renderBlockHtml(block({ type: 'paragraph', text: payload }));
    // The output must be EXACTLY the escaped payload wrapped in <p> — no
    // live tags, no attribute context (escaped text cannot execute).
    assert.equal(html, `<p>${escapeHtml(payload)}</p>`, `payload not fully escaped: ${payload}`);
  }
});

test('only allowlisted tags are ever emitted', () => {
  const html = renderDraftHtml([
    block({ type: 'heading', text: 'H' }),
    block({ type: 'paragraph', text: 'P' }),
    block({ type: 'quote', text: 'Q' }),
    block({ type: 'divider' }),
    block({ type: 'spacer', size: 2 }),
    block({ type: 'button', label: 'Go', href: '/about' }),
    block({ type: 'image', mediaId: 'm1', altText: 'Alt' }),
  ]);
  const emitted = [...html.matchAll(/<([a-z0-9]+)[\s/]/gi)].map((m) => m[1]?.toLowerCase());
  const allowed = new Set(['p', 'h2', 'blockquote', 'strong', 'em', 'a', 'hr', 'br', 'button', 'div', 'span', 'img']);
  for (const tag of emitted) {
    assert.ok(allowed.has(tag as string), `unexpected tag <${tag}> in output`);
  }
});

test('marks render as <strong>/<em> over escaped text', () => {
  const html = renderBlockHtml(
    block({
      type: 'paragraph',
      text: 'bold <b>injection</b>',
      marks: [{ start: 0, end: 4, kind: 'bold' }],
    }),
  );
  assert.ok(html.startsWith('<p><strong>bold</strong>'));
  assert.ok(html.includes('&lt;b&gt;injection&lt;/b&gt;'));
});

test('unknown/disallowed block types render nothing', () => {
  const hostile = block({ type: 'html-embed' as never, text: '<script>x</script>' });
  assert.equal(renderBlockHtml(hostile), '');
});

// =============================================================================
// URL POLICY
// =============================================================================

test('isSafeUrl allows internal paths and allowlisted https hosts', () => {
  assert.equal(isSafeUrl('/about'), true);
  assert.equal(isSafeUrl('/lt/tenant/news/slug'), true);
  assert.equal(isSafeUrl('https://gyvenimo-kelias.lt/x'), true);
  assert.equal(isSafeUrl('https://sub.jol.lt/x'), true);
});

test('isSafeUrl blocks dangerous schemes, hosts and tricks', () => {
  const rejected = [
    'javascript:alert(1)',
    'data:text/html,<script>x</script>',
    'vbscript:msgbox(1)',
    'JaVaScRiPt:alert(1)',
    'http://gyvenimo-kelias.lt/x', // http downgrade
    'https://evil.example/',
    'https://gyvenimo-kelias.lt.evil.example/', // suffix spoof
    '//evil.example/x', // protocol-relative
    '/\\evil.example', // backslash normalization trick
    '',
  ];
  for (const href of rejected) {
    assert.equal(isSafeUrl(href), false, `should reject: ${href}`);
  }
});

test('unsafe link hrefs are dropped from rendered output', () => {
  const html = renderBlockHtml(
    block({
      type: 'paragraph',
      text: 'click me',
      links: [{ start: 0, end: 5, href: 'javascript:alert(1)' }],
    }),
  );
  assert.ok(!html.includes('javascript:'));
  assert.ok(!html.includes('<a '));
});

test('button blocks with unsafe targets lose the link', () => {
  const html = renderBlockHtml(block({ type: 'button', label: 'Go', href: 'https://evil.example' }));
  assert.equal(html, '<button type="button">Go</button>');
});

// =============================================================================
// CONSTRAINTS
// =============================================================================

test('validateDraft enforces block/image counts, lengths and alt text', () => {
  const blocks: EditorBlock[] = Array.from({ length: EDITOR_LIMITS.maxBlocks + 1 }, (_, i) =>
    block({ id: `b${i}`, type: 'paragraph', text: 'x' }),
  );
  blocks.push(block({ id: 'img1', type: 'image' })); // missing alt
  const findings = validateDraft(blocks);
  const codes = findings.map((f) => f.code);
  assert.ok(codes.includes('too-many-blocks'));
  assert.ok(codes.includes('missing-alt'));

  const ok = validateDraft([block({ type: 'paragraph', text: 'hello' })]);
  assert.equal(ok.length, 0);
});

test('heading text limit is enforced separately from paragraph', () => {
  const findings = validateDraft([block({ type: 'heading', text: 'x'.repeat(EDITOR_LIMITS.maxTextLength.heading + 1) })]);
  assert.ok(findings.some((f) => f.code === 'text-too-long'));
});

test('image size limit uses the provided byte map', () => {
  const findings = validateDraft(
    [block({ id: 'img', type: 'image', mediaId: 'm1', altText: 'ok' })],
    { m1: EDITOR_LIMITS.maxImageBytes + 1 },
  );
  assert.ok(findings.some((f) => f.code === 'image-too-large'));
});

test('block type allowlist is closed', () => {
  assert.equal(isAllowedBlockType('iframe'), false);
  assert.equal(isAllowedBlockType('html'), false);
  assert.equal(isAllowedBlockType('script'), false);
  assert.equal(isAllowedBlockType('table'), false);
  assert.equal(isAllowedBlockType('paragraph'), true);
  assert.equal(imageCount([block({ type: 'image', mediaId: 'x', altText: 'a' })]), 1);
});

// =============================================================================
// PROHIBITED PATTERNS
// =============================================================================

test('scanProhibitedPatterns flags emails, phones and bare URLs', () => {
  const findings = scanProhibitedPatterns('Contact me at info@parish.lt or +370 612 34567, see http://x.lt');
  const codes = findings.map((f) => f.code);
  assert.ok(codes.includes('prohibited-email'));
  assert.ok(codes.includes('prohibited-phone'));
  assert.ok(codes.includes('prohibited-url'));
  assert.equal(scanProhibitedPatterns('Šv. Mišios sekmadienį 10 val.').length, 0);
});

test('draftTextOf covers text, labels and alt text', () => {
  const text = draftTextOf([
    block({ type: 'paragraph', text: 'a@b.lt' }),
    block({ type: 'button', label: 'call +370 600 11111' }),
  ]);
  assert.ok(text.includes('a@b.lt'));
  assert.ok(text.includes('+370 600 11111'));
});

// =============================================================================
// DIFF
// =============================================================================

test('diffBlocks detects added, removed, changed and moved blocks', () => {
  const before: EditorBlock[] = [
    block({ id: 'a', type: 'heading', text: 'One' }),
    block({ id: 'b', type: 'paragraph', text: 'Two' }),
    block({ id: 'c', type: 'divider' }),
  ];
  const after: EditorBlock[] = [
    block({ id: 'b', type: 'paragraph', text: 'Two EDITED' }),
    block({ id: 'a', type: 'heading', text: 'One' }),
    block({ id: 'd', type: 'quote', text: 'New' }),
  ];
  const changes = diffBlocks(before, after);
  const kinds = changes.map((c) => c.kind);
  assert.ok(kinds.includes('changed')); // b text
  assert.ok(kinds.includes('moved')); // a
  assert.ok(kinds.includes('added')); // d
  assert.ok(kinds.includes('removed')); // c
  for (const change of changes) {
    assert.ok(describeChange(change).length > 0);
  }
});

test('diffBlocks on identical lists is empty', () => {
  const list = [block({ id: 'a', type: 'paragraph', text: 'same' })];
  assert.equal(diffBlocks(list, list).length, 0);
});

// =============================================================================
// ZOD EDGE SCHEMAS
// =============================================================================

test('draftBodySchema rejects disallowed block types and oversized text', () => {
  const hostile = draftBodySchema.safeParse({
    tenantSlug: 'parish-x',
    revision: 1,
    blocks: [{ id: 'b', type: 'iframe', text: 'x' }],
  });
  assert.equal(hostile.success, false);

  const tooMany = draftBodySchema.safeParse({
    tenantSlug: 'parish-x',
    revision: 1,
    blocks: Array.from({ length: EDITOR_LIMITS.maxBlocks + 1 }, (_, i) => ({ id: `b${i}`, type: 'paragraph' })),
  });
  assert.equal(tooMany.success, false);

  const valid = draftBodySchema.safeParse({
    tenantSlug: 'parish-x',
    revision: 0,
    blocks: [{ id: 'b', type: 'paragraph', text: 'hello' }],
  });
  assert.equal(valid.success, true);
});

test('draftBodySchema rejects unsafe links and missing alt text', () => {
  const unsafeLink = draftBodySchema.safeParse({
    tenantSlug: 'parish-x',
    revision: 0,
    blocks: [
      { id: 'b', type: 'paragraph', text: 'x', links: [{ start: 0, end: 1, href: 'javascript:alert(1)' }] },
    ],
  });
  assert.equal(unsafeLink.success, false);

  const missingAlt = draftBodySchema.safeParse({
    tenantSlug: 'parish-x',
    revision: 0,
    blocks: [{ id: 'i', type: 'image', mediaId: 'm1' }],
  });
  assert.equal(missingAlt.success, false);
});

test('decisionBodySchema requires reasons for negative outcomes', () => {
  assert.equal(
    decisionBodySchema.safeParse({ tenantSlug: 't', action: 'reject' }).success,
    false,
  );
  assert.equal(
    decisionBodySchema.safeParse({ tenantSlug: 't', action: 'reject', reason: 'spam' }).success,
    true,
  );
  assert.equal(decisionBodySchema.safeParse({ tenantSlug: 't', action: 'approve' }).success, true);
});

test('uploadBodySchema enforces type allowlist, 2MB and alt text', () => {
  assert.equal(
    uploadBodySchema.safeParse({
      tenantSlug: 't', fileName: 'a.gif', mimeType: 'image/gif', sizeBytes: 10, altText: 'x',
    }).success,
    false,
  );
  assert.equal(
    uploadBodySchema.safeParse({
      tenantSlug: 't', fileName: 'a.png', mimeType: 'image/png', sizeBytes: EDITOR_LIMITS.maxImageBytes + 1, altText: 'x',
    }).success,
    false,
  );
  assert.equal(
    uploadBodySchema.safeParse({
      tenantSlug: 't', fileName: 'a.png', mimeType: 'image/png', sizeBytes: 10, altText: '',
    }).success,
    false,
  );
  assert.equal(
    uploadBodySchema.safeParse({
      tenantSlug: 't', fileName: 'a.webp', mimeType: 'image/webp', sizeBytes: 10, altText: 'Alt',
    }).success,
    true,
  );
});

test('blockSchema rejects invalid block ids at the edge', () => {
  assert.equal(blockSchema.safeParse({ id: '', type: 'paragraph' }).success, false);
  assert.equal(blockSchema.safeParse({ id: 'x'.repeat(65), type: 'paragraph' }).success, false);
});
