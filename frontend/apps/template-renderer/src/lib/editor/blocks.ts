/**
 * Block model + content constraints — STEP 14 (10% tenant control).
 *
 * Tenants edit a CONSTRAINED subset of their site through a block editor;
 * JOL retains 90% control and every change flows through the moderation
 * queue. This module is the single source of truth for WHAT is allowed:
 *
 *   - Block allowlist: heading, paragraph, image, quote, button, divider,
 *     spacer. HTML embeds, scripts, iframes and tables are NOT block types
 *     at all — they cannot be selected, parsed, or persisted (ISO 27001
 *     A.8.2 user-generated content security).
 *   - Structural limits: 20 blocks/page, 10 images/page, 2MB/image,
 *     per-type text length caps.
 *   - Rich text is STRUCTURED (segments with marks), never raw markup —
 *     see sanitize.ts.
 *
 * Pure functions — fully unit-testable.
 */

/** The closed set of editable block types (spec allowlist). */
export const ALLOWED_BLOCK_TYPES = [
  'heading',
  'paragraph',
  'image',
  'quote',
  'button',
  'divider',
  'spacer',
] as const;

export type EditorBlockType = (typeof ALLOWED_BLOCK_TYPES)[number];

/** Inline style mark — bold/italic/link ONLY (design system enforced). */
export interface TextMark {
  /** 0-based start offset into the segment's parent text. */
  start: number;
  /** Exclusive end offset. */
  end: number;
  kind: 'bold' | 'italic';
}

/** A hyperlink on a text range (validated by sanitize.isSafeUrl). */
export interface TextLink {
  start: number;
  end: number;
  href: string;
}

/** A page block. Union by `type`; unknown types are rejected at the gate. */
export interface EditorBlock {
  /** Client-generated id (crypto.randomUUID) — stable across revisions. */
  id: string;
  type: EditorBlockType;
  /** heading / paragraph / quote text (plain text + marks). */
  text?: string;
  marks?: TextMark[];
  links?: TextLink[];
  /** image: media library reference (never a raw tenant URL). */
  mediaId?: string;
  /** image: REQUIRED before the upload completes (WCAG 1.1.1). */
  altText?: string;
  /** button label + target (internal path or allowlisted external URL). */
  label?: string;
  href?: string;
  /** spacer height in design-system steps (1–4). */
  size?: 1 | 2 | 3 | 4;
}

/** A draft document (the editable 10% of one page). */
export interface EditorDraft {
  pageId: string;
  tenantSlug: string;
  blocks: EditorBlock[];
  /** Monotonic revision counter owned by the backend. */
  revision: number;
  updatedAt: string;
}

// =============================================================================
// CONSTRAINTS (spec TASK 2)
// =============================================================================

/** Hard structural limits — enforced client (UX) AND server (security). */
export const EDITOR_LIMITS = {
  maxBlocks: 20,
  maxImages: 10,
  maxImageBytes: 2 * 1024 * 1024, // 2MB
  maxTextLength: {
    heading: 120,
    paragraph: 2000,
    quote: 500,
    button: 40,
    altText: 255,
  },
  maxRevisions: 10,
  autoSaveMs: 30_000,
  sessionTimeoutMs: 2 * 60 * 60 * 1000, // 2h — re-auth required after
} as const;

/** Allowed upload MIME types (jpg, png, webp, svg — spec). */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'] as const;

export type ConstraintFinding = {
  code:
    | 'too-many-blocks'
    | 'too-many-images'
    | 'unknown-block-type'
    | 'text-too-long'
    | 'image-too-large'
    | 'missing-alt'
    | 'invalid-image-type';
  severity: 'fail';
  /** Block id when applicable. */
  blockId?: string;
  message: string;
};

export function isAllowedBlockType(value: unknown): value is EditorBlockType {
  return typeof value === 'string' && (ALLOWED_BLOCK_TYPES as readonly string[]).includes(value);
}

/** Count image blocks in a draft. */
export function imageCount(blocks: readonly EditorBlock[]): number {
  return blocks.filter((block) => block.type === 'image').length;
}

/**
 * Validate a draft against every structural constraint. Returns ALL
 * findings (the UI lists them; the server refuses to persist when any
 * exist). Pure — also used by the API proxy as defense in depth.
 */
export function validateDraft(blocks: readonly EditorBlock[], imageSizeBytes?: Record<string, number>): ConstraintFinding[] {
  const findings: ConstraintFinding[] = [];

  if (blocks.length > EDITOR_LIMITS.maxBlocks) {
    findings.push({
      code: 'too-many-blocks',
      severity: 'fail',
      message: `Page exceeds the ${EDITOR_LIMITS.maxBlocks}-block limit (${blocks.length}).`,
    });
  }

  const images = blocks.filter((block) => block.type === 'image');
  if (images.length > EDITOR_LIMITS.maxImages) {
    findings.push({
      code: 'too-many-images',
      severity: 'fail',
      message: `Page exceeds the ${EDITOR_LIMITS.maxImages}-image limit (${images.length}).`,
    });
  }

  for (const block of blocks) {
    if (!isAllowedBlockType(block.type)) {
      findings.push({
        code: 'unknown-block-type',
        severity: 'fail',
        blockId: block.id,
        message: `Block type "${String(block.type)}" is not allowed.`,
      });
      continue;
    }

    if (block.type === 'heading' || block.type === 'paragraph' || block.type === 'quote') {
      const limit = EDITOR_LIMITS.maxTextLength[block.type];
      if ((block.text ?? '').length > limit) {
        findings.push({
          code: 'text-too-long',
          severity: 'fail',
          blockId: block.id,
          message: `${block.type} text exceeds ${limit} characters.`,
        });
      }
    }

    if (block.type === 'button' && (block.label ?? '').length > EDITOR_LIMITS.maxTextLength.button) {
      findings.push({
        code: 'text-too-long',
        severity: 'fail',
        blockId: block.id,
        message: `Button label exceeds ${EDITOR_LIMITS.maxTextLength.button} characters.`,
      });
    }

    if (block.type === 'image') {
      if (!(block.altText ?? '').trim()) {
        findings.push({
          code: 'missing-alt',
          severity: 'fail',
          blockId: block.id,
          message: 'Image blocks require alt text (WCAG 1.1.1).',
        });
      } else if ((block.altText ?? '').length > EDITOR_LIMITS.maxTextLength.altText) {
        findings.push({
          code: 'text-too-long',
          severity: 'fail',
          blockId: block.id,
          message: `Alt text exceeds ${EDITOR_LIMITS.maxTextLength.altText} characters.`,
        });
      }
      const bytes = block.mediaId ? imageSizeBytes?.[block.mediaId] : undefined;
      if (bytes !== undefined && bytes > EDITOR_LIMITS.maxImageBytes) {
        findings.push({
          code: 'image-too-large',
          severity: 'fail',
          blockId: block.id,
          message: 'Image exceeds the 2MB limit.',
        });
      }
    }
  }

  return findings;
}
