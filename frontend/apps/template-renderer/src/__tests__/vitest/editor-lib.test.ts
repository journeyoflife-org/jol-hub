/**
 * Editor core unit tests — STEP 15 (vitest tier).
 *
 * The constrained-editor invariants (STEP 14) re-verified in the vitest
 * runner so v8 coverage sees them: block constraints, revision diff,
 * moderation helpers, prohibited-pattern scan.
 */
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_BLOCK_TYPES,
  EDITOR_LIMITS,
  imageCount,
  isAllowedBlockType,
  validateDraft,
  type EditorBlock,
} from '@/lib/editor/blocks';
import { diffBlocks, describeChange } from '@/lib/editor/diff';
import { decisionRequiresReason, isArt9Item, type ModerationItem } from '@/lib/editor/moderation';
import { scanProhibitedPatterns, draftTextOf, renderBlockHtml } from '@/lib/editor/sanitize';

describe('block constraints', () => {
  it('blocks.should.allow exactly the seven constrained types', () => {
    expect([...ALLOWED_BLOCK_TYPES].sort()).toEqual(
      ['button', 'divider', 'heading', 'image', 'paragraph', 'quote', 'spacer'].sort(),
    );
    for (const type of ALLOWED_BLOCK_TYPES) expect(isAllowedBlockType(type)).toBe(true);
    for (const type of ['script', 'iframe', 'html', 'table', 'embed']) {
      expect(isAllowedBlockType(type)).toBe(false);
    }
  });

  it('blocks.should.count images only', () => {
    const blocks: EditorBlock[] = [
      { id: 'a', type: 'image', mediaId: 'm1', altText: 'x' },
      { id: 'b', type: 'paragraph', text: 't' },
      { id: 'c', type: 'image', mediaId: 'm2', altText: 'y' },
    ];
    expect(imageCount(blocks)).toBe(2);
  });

  it('blocks.should.flag over-limit drafts (20 blocks / 10 images)', () => {
    const tooMany: EditorBlock[] = Array.from({ length: EDITOR_LIMITS.maxBlocks + 1 }, (_, i) => ({
      id: `b${i}`,
      type: 'paragraph',
      text: 't',
    }));
    const findings = validateDraft(tooMany);
    expect(findings.some((f) => f.code === 'too-many-blocks')).toBe(true);

    const tooManyImages: EditorBlock[] = Array.from(
      { length: EDITOR_LIMITS.maxImages + 1 },
      (_, i) => ({ id: `i${i}`, type: 'image', mediaId: `m${i}`, altText: 'x' }),
    );
    expect(validateDraft(tooManyImages).some((f) => f.code === 'too-many-images')).toBe(true);
  });

  it('blocks.should.require alt text and size limits for images', () => {
    const missingAlt: EditorBlock[] = [{ id: 'i1', type: 'image', mediaId: 'm1' }];
    expect(validateDraft(missingAlt).some((f) => f.code === 'missing-alt')).toBe(true);

    const oversized: EditorBlock[] = [{ id: 'i2', type: 'image', mediaId: 'm2', altText: 'x' }];
    const findings = validateDraft(oversized, { m2: EDITOR_LIMITS.maxImageBytes + 1 });
    expect(findings.some((f) => f.code === 'image-too-large')).toBe(true);
  });

  it('blocks.should.enforce text length caps per block type', () => {
    const longHeading: EditorBlock[] = [
      { id: 'h', type: 'heading', text: 'a'.repeat(EDITOR_LIMITS.maxTextLength.heading + 1) },
    ];
    expect(validateDraft(longHeading).some((f) => f.code === 'text-too-long')).toBe(true);
  });
});

describe('revision diff', () => {
  it('diff.should.detect added, removed and changed blocks', () => {
    const before: EditorBlock[] = [
      { id: 'a', type: 'heading', text: 'Old' },
      { id: 'b', type: 'paragraph', text: 'Keep' },
    ];
    const after: EditorBlock[] = [
      { id: 'a', type: 'heading', text: 'New' },
      { id: 'c', type: 'divider' },
    ];
    const changes = diffBlocks(before, after);
    const kinds = changes.map((c) => `${c.kind}:${c.blockId}`);
    expect(kinds).toContain('changed:a');
    expect(kinds).toContain('removed:b');
    expect(kinds).toContain('added:c');
    // Every change describes itself for the audit/moderation UI.
    for (const change of changes) expect(describeChange(change).length).toBeGreaterThan(0);
  });

  it('diff.should.report no changes for identical drafts', () => {
    const blocks: EditorBlock[] = [{ id: 'a', type: 'paragraph', text: 'Same' }];
    expect(diffBlocks(blocks, blocks)).toHaveLength(0);
  });
});

describe('moderation helpers', () => {
  function item(overrides: Partial<ModerationItem> = {}): ModerationItem {
    return {
      id: 'mod-1',
      tenantSlug: 'test-church',
      type: 'page-edit',
      status: 'pending',
      submittedAt: '2026-01-16T08:00:00Z',
      ...overrides,
    } as ModerationItem;
  }

  it('moderation.should.require reasons for reject/request-changes only', () => {
    expect(decisionRequiresReason('reject')).toBe(true);
    expect(decisionRequiresReason('request-changes')).toBe(true);
    expect(decisionRequiresReason('approve')).toBe(false);
    expect(decisionRequiresReason('escalate')).toBe(false);
  });

  it('moderation.should.route Art. 9 flags to the legal queue', () => {
    expect(isArt9Item(item({ status: 'art9-review' }))).toBe(true);
    expect(
      isArt9Item(
        item({
          ai: {
            approved: false,
            flags: [{ category: 'art9-sensitive-content', severity: 'high', reasoning: 'r' }],
          },
        }),
      ),
    ).toBe(true);
    expect(isArt9Item(item())).toBe(false);
  });
});

describe('prohibited patterns + text extraction', () => {
  it('sanitize.should.flag contact data embedded in content', () => {
    const findings = scanProhibitedPatterns('Rašykite info@parapija.lt arba +370 600 12345');
    const codes = findings.map((f) => f.code);
    expect(codes).toContain('prohibited-email');
    expect(codes).toContain('prohibited-phone');
  });

  it('sanitize.should.flag bare URLs in content', () => {
    const findings = scanProhibitedPatterns('Apsilankykite https://parapija.lt dabar');
    expect(findings.some((f) => f.code === 'prohibited-url')).toBe(true);
  });

  it('sanitize.should.extract concatenated draft text', () => {
    const blocks: EditorBlock[] = [
      { id: 'a', type: 'heading', text: 'Antraštė' },
      { id: 'b', type: 'paragraph', text: 'Tekstas' },
      { id: 'c', type: 'divider' },
    ];
    expect(draftTextOf(blocks)).toContain('Antraštė');
    expect(draftTextOf(blocks)).toContain('Tekstas');
  });

  it('sanitize.should.render every allowed block type', () => {
    const html = renderBlockHtml({ id: 'd', type: 'divider' });
    expect(html).toContain('<hr');
    const spacer = renderBlockHtml({ id: 's', type: 'spacer', size: 2 });
    expect(spacer).toContain('data-spacer');
    const button = renderBlockHtml({ id: 'b', type: 'button', label: 'Spausk', href: '/apie' });
    expect(button).toContain('href="/apie"');
    expect(button).toContain('rel="noopener noreferrer"');
    const img = renderBlockHtml({ id: 'i', type: 'image', mediaId: 'm1', altText: 'Alt' });
    expect(img).toContain('data-media-id="m1"');
    expect(img).toContain('alt="Alt"');
  });
});
