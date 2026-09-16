/**
 * Server-side draft validation — STEP 14 (defense in depth).
 *
 * The API proxies re-validate every incoming draft with zod BEFORE anything
 * reaches the backend: disallowed block types, oversized text, missing alt
 * text and unsafe URLs are rejected at the edge (the client validates too —
 * UX; this layer is SECURITY). Mirrors `lib/editor/blocks.ts` limits.
 */
import { z } from 'zod';
import { ALLOWED_BLOCK_TYPES, EDITOR_LIMITS } from './blocks';
import { isSafeUrl } from './sanitize';

const markSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  kind: z.enum(['bold', 'italic']),
});

const linkSchema = z
  .object({
    start: z.number().int().min(0),
    end: z.number().int().min(0),
    href: z.string().max(2048),
  })
  .refine((link) => isSafeUrl(link.href), { message: 'Link target is not allowed.' });

export const blockSchema = z
  .object({
    id: z.string().min(1).max(64),
    type: z.enum(ALLOWED_BLOCK_TYPES), // closed allowlist — no HTML/iframe/script
    text: z.string().max(EDITOR_LIMITS.maxTextLength.paragraph).optional(),
    marks: z.array(markSchema).max(50).optional(),
    links: z.array(linkSchema).max(10).optional(),
    mediaId: z.string().max(128).optional(),
    altText: z.string().max(EDITOR_LIMITS.maxTextLength.altText).optional(),
    label: z.string().max(EDITOR_LIMITS.maxTextLength.button).optional(),
    href: z.string().max(2048).optional(),
    size: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  })
  // Per-type refinements (type-specific length limits + safe button hrefs).
  .superRefine((block, ctx) => {
    if (block.type === 'heading' && (block.text ?? '').length > EDITOR_LIMITS.maxTextLength.heading) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['text'], message: 'Heading too long.' });
    }
    if (block.type === 'quote' && (block.text ?? '').length > EDITOR_LIMITS.maxTextLength.quote) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['text'], message: 'Quote too long.' });
    }
    if (block.type === 'image' && !(block.altText ?? '').trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['altText'], message: 'Alt text is required.' });
    }
    if (block.type === 'button' && block.href && !isSafeUrl(block.href)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['href'], message: 'Button target is not allowed.' });
    }
  });

/** A full draft body (POST /draft). */
export const draftBodySchema = z.object({
  tenantSlug: z
    .string()
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/)
    .max(64),
  blocks: z.array(blockSchema).max(EDITOR_LIMITS.maxBlocks),
  revision: z.number().int().min(0),
});

/** Moderation decision body (POST /moderation/[itemId]). */
export const decisionBodySchema = z.object({
  tenantSlug: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/).max(64),
  action: z.enum(['approve', 'reject', 'request-changes', 'escalate']),
  reason: z.string().max(1000).optional(),
}).refine(
  (body) => !(body.action === 'reject' || body.action === 'request-changes') || (body.reason ?? '').trim().length > 0,
  { message: 'A reason is required for reject / request-changes.' },
);

/** Media upload registration body (POST /media). */
export const uploadBodySchema = z.object({
  tenantSlug: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/).max(64),
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  sizeBytes: z.number().int().min(1).max(EDITOR_LIMITS.maxImageBytes),
  altText: z.string().min(1).max(EDITOR_LIMITS.maxTextLength.altText),
});
